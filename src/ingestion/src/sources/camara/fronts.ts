import { parse as parseCsv } from "csv-parse/sync";
import { prisma } from "@polar/db";
import type { CollectionContext, SourceAdapter } from "../sourceAdapter";
import { splitIntoBatches } from "../splitIntoBatches";
import { toUtcText } from "../toUtcText";
import { fetchCamaraBulkCsv } from "./camaraClient";

const CURRENT_LEGISLATURE_ID = "57";
const WRITE_BATCH_SIZE = 5000;
const TRANSACTION_TIMEOUT_MS = 10 * 60 * 1000;

// the source text has typos ("Coordernador"), so the role comes from its code
const ROLES_BY_CODE: Record<string, string> = {
    "14": "Coordenador",
    "1004": "Membro",
};
const COORDINATOR_ROLE_CODE = "14";

interface RawCamaraFronts {
    frontsCsv: string;
    membershipsCsv: string;
}

interface FrontRow {
    id: string;
    uri: string;
    titulo: string;
    idLegislatura: string;
    coordenador_id: string;
}

interface MembershipRow {
    id: string;
    "deputado_.id": string;
    "deputado_.codTitulo": string;
}

interface ParsedCamaraFronts {
    fronts: FrontRow[];
    memberships: MembershipRow[];
}

interface NormalizedCamaraFronts {
    fronts: { id: number; title: string; sourceUrl: string; collectedAt: Date }[];
    memberships: { frontId: number; deputyId: number; role: string; collectedAt: Date }[];
}

function mapRole(roleCode: string): string {
    const role = ROLES_BY_CODE[roleCode];
    if (!role) {
        throw new Error(`camara-fronts: unknown role code "${roleCode}"`);
    }
    return role;
}

export const camaraFrontsAdapter: SourceAdapter<RawCamaraFronts, ParsedCamaraFronts, NormalizedCamaraFronts> = {
    name: "camara-fronts",

    async fetch(): Promise<RawCamaraFronts> {
        return {
            frontsCsv: await fetchCamaraBulkCsv("frentes"),
            membershipsCsv: await fetchCamaraBulkCsv("frentesDeputados"),
        };
    },

    // both files cover every legislature since 2003, so rows of other legislatures are dropped while parsing
    parse(rawData: RawCamaraFronts): ParsedCamaraFronts[] {
        const fronts = (parseCsv(rawData.frontsCsv, { columns: true, delimiter: ";", bom: true }) as FrontRow[]).filter(
            (row) => row.idLegislatura === CURRENT_LEGISLATURE_ID,
        );
        const currentFrontIds = new Set(fronts.map((row) => row.id));
        const memberships = parseCsv(rawData.membershipsCsv, {
            columns: true,
            delimiter: ";",
            bom: true,
            onRecord: (row: MembershipRow) => (currentFrontIds.has(row.id) ? row : null),
        }) as MembershipRow[];
        return [{ fronts, memberships }];
    },

    normalize(parsedRecords: ParsedCamaraFronts[], context: CollectionContext): NormalizedCamaraFronts[] {
        const parsed = parsedRecords[0];
        if (!parsed) {
            throw new Error("camara-fronts: nothing to normalize");
        }
        const { collectedAt } = context;

        const fronts = parsed.fronts.map((row) => ({
            id: Number(row.id),
            title: row.titulo,
            sourceUrl: row.uri,
            collectedAt,
        }));
        const coordinatorIdByFrontId = new Map(parsed.fronts.map((row) => [row.id, row.coordenador_id]));

        // a deputy can be listed as member and as coordinator of the same front; the coordinator row is kept
        const membershipsByKey = new Map<string, NormalizedCamaraFronts["memberships"][number]>();
        for (const row of parsed.memberships) {
            const roleCode = row["deputado_.codTitulo"];
            // a few coordinator rows come without deputy id, which frentes.csv provides
            const deputyId =
                row["deputado_.id"] ||
                (roleCode === COORDINATOR_ROLE_CODE ? coordinatorIdByFrontId.get(row.id) : undefined);
            if (!deputyId) {
                throw new Error(`camara-fronts: membership of front ${row.id} without deputy id`);
            }

            const key = `${row.id}|${deputyId}`;
            if (membershipsByKey.has(key) && roleCode !== COORDINATOR_ROLE_CODE) {
                continue;
            }
            membershipsByKey.set(key, {
                frontId: Number(row.id),
                deputyId: Number(deputyId),
                role: mapRole(roleCode),
                collectedAt,
            });
        }

        return [{ fronts, memberships: [...membershipsByKey.values()] }];
    },

    async upsert(normalizedRecords: NormalizedCamaraFronts[]) {
        const records = normalizedRecords[0];
        if (!records) {
            throw new Error("camara-fronts: nothing to write");
        }

        const knownDeputyIds = new Set((await prisma.deputy.findMany({ select: { id: true } })).map(({ id }) => id));
        const missingDeputyIds = [
            ...new Set(records.memberships.map((row) => row.deputyId).filter((id) => !knownDeputyIds.has(id))),
        ];
        if (missingDeputyIds.length > 0) {
            throw new Error(
                `camara-fronts: deputies ${missingDeputyIds.join(", ")} are not in the database, run camara-deputies first`,
            );
        }

        await prisma.$transaction(
            async (transaction) => {
                for (const batch of splitIntoBatches(records.fronts, WRITE_BATCH_SIZE)) {
                    await transaction.$executeRaw`
                        INSERT INTO fronts (id, title, source_url, collected_at)
                        SELECT * FROM unnest(
                            ${batch.map((row) => row.id)}::int[],
                            ${batch.map((row) => row.title)}::text[],
                            ${batch.map((row) => row.sourceUrl)}::text[],
                            ${batch.map((row) => toUtcText(row.collectedAt))}::timestamp[]
                        )
                        ON CONFLICT (id) DO UPDATE SET
                            title = EXCLUDED.title,
                            source_url = EXCLUDED.source_url,
                            collected_at = EXCLUDED.collected_at`;
                }

                // memberships have no dates in the source, so they are replaced as a whole to drop deputies who left
                await transaction.frontMembership.deleteMany();
                for (const batch of splitIntoBatches(records.memberships, WRITE_BATCH_SIZE)) {
                    await transaction.$executeRaw`
                        INSERT INTO front_memberships (front_id, deputy_id, role, collected_at)
                        SELECT * FROM unnest(
                            ${batch.map((row) => row.frontId)}::int[],
                            ${batch.map((row) => row.deputyId)}::int[],
                            ${batch.map((row) => row.role)}::text[],
                            ${batch.map((row) => toUtcText(row.collectedAt))}::timestamp[]
                        )`;
                }
            },
            { timeout: TRANSACTION_TIMEOUT_MS },
        );

        return { insertedOrUpdatedCount: records.fronts.length + records.memberships.length };
    },
};
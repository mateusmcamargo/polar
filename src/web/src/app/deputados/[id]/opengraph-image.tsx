import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { PARTY_COLORS } from "@polar/db/party-colors";
import { prefersWhiteText } from "@/components/PartyBadge/PartyBadge";
import { loadDeputyProfile, loadDeputyYear, parseDeputyId } from "./deputyProfileData";

// share image of the profile, a comic panel recognizable on WhatsApp and social networks (DESIGN.md, "Comic accent")
export const revalidate = 86400;
export const alt = "Resumo do deputado no polar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// rendered on the first request of each deputy and kept, like the profile page
export function generateStaticParams(): { id: string }[] {
    return [];
}

const MINIMUM_COUNTED_VOTES = 30;
// next/font serves woff2, which next/og cannot read, so the share image loads the ttf files kept in assets/fonts
const FONTS_DIRECTORY = path.join(process.cwd(), "assets", "fonts");
const INK = "#121110";
const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

function dotTexture(dotColor: string): string {
    return `radial-gradient(circle, ${dotColor} 1.8px, transparent 2.8px)`;
}

// satori draws an empty frame when it cannot load an image, so the photo is fetched here and a failure fails the
// render, which keeps the previous image in the cache instead of storing one without the photo
async function loadPhoto(photoUrl: string): Promise<string> {
    const response = await fetch(photoUrl);
    if (!response.ok) {
        throw new Error(`${photoUrl} answered ${response.status}`);
    }
    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    return `data:${contentType};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
}

function share(part: number, whole: number, minimum: number): string {
    return whole >= minimum && whole > 0 ? `${Math.round((part / whole) * 100)}%` : "–";
}

interface ImageProps {
    params: Promise<{ id: string }>;
}

export default async function Image({ params }: ImageProps) {
    const { id } = await params;
    const deputyId = parseDeputyId(id);
    const profile = deputyId === null ? null : await loadDeputyProfile(deputyId);
    const year = profile?.years[0];
    const yearData = profile && year ? await loadDeputyYear(profile.id, profile.stateCode, year) : null;
    const plenary = yearData?.annualPage?.plenary;
    const plenaryDays = plenary ? plenary.present + plenary.justifiedAbsences + plenary.unjustifiedAbsences : 0;
    const partyColor = profile?.party ? PARTY_COLORS[profile.party.acronym]?.color : undefined;

    const stats = yearData
        ? [
              { figure: share(yearData.metrics.partyAligned, yearData.metrics.partyVotes, MINIMUM_COUNTED_VOTES), label: "com o partido" },
              { figure: share(yearData.metrics.governmentAligned, yearData.metrics.governmentVotes, MINIMUM_COUNTED_VOTES), label: "com o governo" },
              { figure: share(plenary?.present ?? 0, plenaryDays, 1), label: "presença" },
          ]
        : [];
    const collectedAt = yearData?.votesCollectedAt ?? profile?.collectedAt;
    const [regularFont, boldFont, photo] = await Promise.all([
        readFile(path.join(FONTS_DIRECTORY, "AtkinsonHyperlegibleNext-Regular.ttf")),
        readFile(path.join(FONTS_DIRECTORY, "AtkinsonHyperlegibleNext-Bold.ttf")),
        profile?.photoUrl ? loadPhoto(profile.photoUrl) : null,
    ]);

    return new ImageResponse(
        (
            <div
                style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    padding: 44,
                    backgroundColor: "#ECEAE6",
                    backgroundImage: dotTexture("rgba(18, 17, 16, 0.16)"),
                    backgroundSize: "10px 10px",
                    color: INK,
                    fontFamily: "Atkinson Hyperlegible Next",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flex: 1,
                        gap: 40,
                        padding: 36,
                        border: `6px solid ${INK}`,
                        backgroundColor: "#FAF9F7",
                        boxShadow: `14px 14px 0 ${INK}`,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            width: 340,
                            border: `6px solid ${INK}`,
                            backgroundColor: "#F5CD52",
                            backgroundImage: dotTexture("rgba(18, 17, 16, 0.12)"),
                            backgroundSize: "10px 10px",
                            overflow: "hidden",
                        }}
                    >
                        {photo && (
                            <img src={photo} alt="" width={328} height={430} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }} />
                        )}
                    </div>
                    <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ display: "flex", fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>
                                {profile?.politicalName ?? "polar"}
                            </div>
                            {profile && (
                                <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32 }}>
                                    {profile.party && (
                                        <div
                                            style={{
                                                display: "flex",
                                                padding: "4px 16px",
                                                borderRadius: 10,
                                                fontWeight: 700,
                                                backgroundColor: partyColor ?? "#FAF9F7",
                                                color: partyColor && prefersWhiteText(partyColor) ? "#FFFFFF" : INK,
                                                border: partyColor ? "none" : `2px solid ${INK}`,
                                            }}
                                        >
                                            {profile.party.acronym}
                                        </div>
                                    )}
                                    <div style={{ display: "flex" }}>
                                        {profile.stateCode} ·{" "}
                                        {profile.sex === "FEMALE" ? "Deputada federal" : profile.sex === "MALE" ? "Deputado federal" : "Câmara dos Deputados"}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: 40 }}>
                            {stats.map((stat) => (
                                <div key={stat.label} style={{ display: "flex", flexDirection: "column", fontSize: 26 }}>
                                    <div style={{ display: "flex", fontSize: 64, fontWeight: 700 }}>{stat.figure}</div>
                                    {stat.label}
                                </div>
                            ))}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 24,
                                paddingTop: 12,
                                borderTop: "2px solid rgba(18, 17, 16, 0.2)",
                                fontSize: 20,
                            }}
                        >
                            <div style={{ display: "flex" }}>{year ? `polar · dados de ${year}` : "polar"}</div>
                            <div style={{ display: "flex" }}>
                                {collectedAt ? `Fonte: Câmara dos Deputados, ${dateFormat.format(collectedAt)}` : "Fonte: Câmara dos Deputados"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
            fonts: [
                { name: "Atkinson Hyperlegible Next", data: regularFont, weight: 400, style: "normal" },
                { name: "Atkinson Hyperlegible Next", data: boldFont, weight: 700, style: "normal" },
            ],
        },
    );
}
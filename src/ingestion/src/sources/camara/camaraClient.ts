const CAMARA_API_URL = "https://dadosabertos.camara.leg.br/api/v2";
const USER_AGENT = "polar-ingestion (open data platform, contact via repository)";
const MAX_ATTEMPTS = 4;
const PAUSE_BETWEEN_REQUESTS_MS = 100;
// the website is not meant for automated access, so pages are requested slowly
const PAUSE_BETWEEN_PAGES_MS = 1000;

interface CamaraResponse<Data> {
    dados: Data;
    links?: { rel: string; href: string }[];
}

function sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function withRetry<Result>(request: () => Promise<Result>): Promise<Result> {
    for (let attempt = 1; ; attempt++) {
        try {
            return await request();
        } catch (error) {
            if (attempt >= MAX_ATTEMPTS) {
                throw error;
            }
            // exponential backoff: 1s, 2s, 4s
            await sleep(1000 * 2 ** (attempt - 1));
        }
    }
}

async function fetchOk(url: string, accept: string): Promise<Response> {
    const response = await fetch(url, { headers: { accept, "user-agent": USER_AGENT } });
    if (!response.ok) {
        throw new Error(`${url} answered ${response.status}`);
    }
    return response;
}

function fetchJsonWithRetry<Data>(url: string): Promise<CamaraResponse<Data>> {
    return withRetry(async () => (await fetchOk(url, "application/json")).json() as Promise<CamaraResponse<Data>>);
}

// the server closes long downloads midway, so each attempt resumes from the last byte received
async function fetchResumable(url: string, accept: string): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;
    let totalBytes: number | null = null;

    await withRetry(async () => {
        while (totalBytes === null || receivedBytes < totalBytes) {
            const headers: Record<string, string> = { accept, "user-agent": USER_AGENT };
            if (receivedBytes > 0) {
                headers.range = `bytes=${receivedBytes}-`;
            }
            const response = await fetch(url, { headers });
            if (!response.ok || !response.body || (receivedBytes > 0 && response.status !== 206)) {
                throw new Error(`${url} answered ${response.status}`);
            }
            totalBytes ??= Number(response.headers.get("content-length"));

            const bytesBefore = receivedBytes;
            try {
                for await (const chunk of response.body) {
                    chunks.push(chunk);
                    receivedBytes += chunk.length;
                }
            } catch (error) {
                // a cut that still brought data resumes at once; only a cut without progress counts as a failed attempt
                if (receivedBytes === bytesBefore) {
                    throw error;
                }
                console.log(`${url}: connection closed at ${receivedBytes} of ${totalBytes} bytes, resuming`);
            }
        }
    });

    return Buffer.concat(chunks);
}

// bulk files per year (votacoes-2025.csv) or whole (orgaos.csv)
export async function fetchCamaraBulkCsv(dataset: string, year?: number): Promise<string> {
    const yearSuffix = year === undefined ? "" : `-${year}`;
    const url = `https://dadosabertos.camara.leg.br/arquivos/${dataset}/csv/${dataset}${yearSuffix}.csv`;
    return (await fetchResumable(url, "text/csv")).toString("utf8");
}

// html pages of the Câmara website, for data that has no API or bulk file
export async function fetchCamaraPage(url: string): Promise<string> {
    const page = await withRetry(async () => (await fetchOk(url, "text/html")).text());
    await sleep(PAUSE_BETWEEN_PAGES_MS);
    return page;
}

export function buildCamaraUrl(path: string, query: Record<string, string | number> = {}): string {
    const searchParams = new URLSearchParams(
        Object.entries(query).map(([key, value]) => [key, String(value)]),
    );
    const queryString = searchParams.size > 0 ? `?${searchParams}` : "";
    return `${CAMARA_API_URL}${path}${queryString}`;
}

export async function fetchCamaraObject<Data>(path: string): Promise<Data> {
    const response = await fetchJsonWithRetry<Data>(buildCamaraUrl(path));
    await sleep(PAUSE_BETWEEN_REQUESTS_MS);
    return response.dados;
}

// follows the "next" link until the last page
export async function fetchCamaraList<Item>(
    path: string,
    query: Record<string, string | number> = {},
): Promise<Item[]> {
    const items: Item[] = [];
    let nextUrl: string | undefined = buildCamaraUrl(path, { ...query, itens: 100 });

    while (nextUrl) {
        const response: CamaraResponse<Item[]> = await fetchJsonWithRetry<Item[]>(nextUrl);
        items.push(...response.dados);
        nextUrl = response.links?.find((link) => link.rel === "next")?.href;
        await sleep(PAUSE_BETWEEN_REQUESTS_MS);
    }

    return items;
}

export function extractIdFromUri(uri: string | null | undefined): number | null {
    const lastSegment = uri?.split("/").pop();
    const id = Number(lastSegment);
    return lastSegment && Number.isInteger(id) ? id : null;
}
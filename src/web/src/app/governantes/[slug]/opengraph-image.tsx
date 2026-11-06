import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { plainGlossaryText } from "@polar/db/glossary";
import { findGalleryEntry, RULER_PAGES } from "@polar/db/rulers";

// share image of a ruler page, the same comic panel as the deputy share image (DESIGN.md, "Comic accent")
export const alt = "Resumo da história de quem governou o Brasil, no polar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
    return Object.keys(RULER_PAGES).map((slug) => ({ slug }));
}

// next/font serves woff2, which next/og cannot read, so the share image loads the ttf files kept in assets/fonts
const FONTS_DIRECTORY = path.join(process.cwd(), "assets", "fonts");
const PUBLIC_DIRECTORY = path.join(process.cwd(), "public");
const INK = "#121110";
const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

function dotTexture(dotColor: string): string {
    return `radial-gradient(circle, ${dotColor} 1.8px, transparent 2.8px)`;
}

// the portrait lives in public/, read from disk so the render does not depend on the site being reachable
async function loadPortrait(publicPath: string): Promise<string> {
    const file = await readFile(path.join(PUBLIC_DIRECTORY, publicPath));
    return `data:image/jpeg;base64,${file.toString("base64")}`;
}

// the first sentence of the summary fits the panel; the rest is on the page
function firstSentence(text: string): string {
    const end = text.indexOf(". ");
    return end === -1 ? text : text.slice(0, end + 1);
}

interface ImageProps {
    params: Promise<{ slug: string }>;
}

export default async function Image({ params }: ImageProps) {
    const { slug } = await params;
    const page = RULER_PAGES[slug];
    const entry = findGalleryEntry(slug);
    const [regularFont, boldFont, portrait] = await Promise.all([
        readFile(path.join(FONTS_DIRECTORY, "AtkinsonHyperlegibleNext-Regular.ttf")),
        readFile(path.join(FONTS_DIRECTORY, "AtkinsonHyperlegibleNext-Bold.ttf")),
        entry?.portrait ? loadPortrait(entry.portrait.file) : null,
    ]);
    const reviewedOn = page ? dateFormat.format(new Date(`${page.reviewedOn}T12:00:00-03:00`)) : null;

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
                            backgroundColor: "#F2C230",
                            backgroundImage: dotTexture("rgba(18, 17, 16, 0.12)"),
                            backgroundSize: "10px 10px",
                            overflow: "hidden",
                        }}
                    >
                        {portrait && (
                            <img src={portrait} alt="" width={328} height={437} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                        )}
                    </div>
                    <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>
                                {page?.officeLabel ?? "Governantes do Brasil"}
                            </div>
                            <div style={{ display: "flex", fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>{entry?.name ?? "polar"}</div>
                            {page && <div style={{ display: "flex", fontSize: 32, lineHeight: 1.35 }}>{firstSentence(plainGlossaryText(page.summary))}</div>}
                        </div>
                        {page && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 24 }}>
                                {page.tags.map((tag) => (
                                    <div key={tag} style={{ display: "flex", padding: "4px 14px", borderRadius: 10, border: `2px solid ${INK}` }}>
                                        {tag}
                                    </div>
                                ))}
                            </div>
                        )}
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
                            <div style={{ display: "flex" }}>polar · Governantes do Brasil</div>
                            <div style={{ display: "flex" }}>{reviewedOn ? `Fontes revisadas em ${reviewedOn}` : "Fontes na página"}</div>
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
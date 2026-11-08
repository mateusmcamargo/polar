import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { plainGlossaryText } from "@polar/db/glossary";
import { MARCO_PAGES } from "@polar/db/marcos";
import { projectToMap } from "@/components/LocationMap/projection";
import { MAP_HEIGHT, MAP_WIDTH, STATE_SHAPES } from "@/components/StateMap/stateShapes";

// share image of a landmark page, the same comic panel as the ruler share image with the location map where the portrait would be
export const alt = "Resumo de um marco do Brasil, no polar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
    return Object.keys(MARCO_PAGES).map((slug) => ({ slug }));
}

// next/font serves woff2, which next/og cannot read, so the share image loads the ttf files kept in assets/fonts
const FONTS_DIRECTORY = path.join(process.cwd(), "assets", "fonts");
const INK = "#121110";
const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

function dotTexture(dotColor: string): string {
    return `radial-gradient(circle, ${dotColor} 1.8px, transparent 2.8px)`;
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
    const page = MARCO_PAGES[slug];
    const [regularFont, boldFont] = await Promise.all([
        readFile(path.join(FONTS_DIRECTORY, "AtkinsonHyperlegibleNext-Regular.ttf")),
        readFile(path.join(FONTS_DIRECTORY, "AtkinsonHyperlegibleNext-Bold.ttf")),
    ]);
    const reviewedOn = page ? dateFormat.format(new Date(`${page.reviewedOn}T12:00:00-03:00`)) : null;
    const point = page ? projectToMap(page.location.latitude, page.location.longitude) : null;

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
                            alignItems: "center",
                            justifyContent: "center",
                            width: 440,
                            border: `6px solid ${INK}`,
                            backgroundColor: "#F5CD52",
                            backgroundImage: dotTexture("rgba(18, 17, 16, 0.12)"),
                            backgroundSize: "10px 10px",
                        }}
                    >
                        <svg width={400} height={412} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
                            {Object.entries(STATE_SHAPES).map(([code, shape]) => (
                                <path
                                    key={code}
                                    d={shape.path}
                                    fill={code === page?.location.stateCode ? "#154F5F" : "#FAF9F7"}
                                    stroke={code === page?.location.stateCode ? INK : "rgba(18, 17, 16, 0.45)"}
                                    strokeWidth={code === page?.location.stateCode ? 3 : 1.5}
                                />
                            ))}
                            {point && <circle cx={point.x} cy={point.y} r={13} fill="#E00000" stroke={INK} strokeWidth={5} />}
                        </svg>
                    </div>
                    <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>
                                {page?.kicker ?? "Marcos do Brasil"}
                            </div>
                            <div style={{ display: "flex", fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>{page?.name ?? "polar"}</div>
                            {page && <div style={{ display: "flex", fontSize: 30, lineHeight: 1.35 }}>{firstSentence(plainGlossaryText(page.summary))}</div>}
                        </div>
                        {page && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 24 }}>
                                {page.tags.map((tag) => (
                                    <div key={tag} style={{ display: "flex", padding: "4px 14px", border: `2px solid ${INK}` }}>
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
                            <div style={{ display: "flex" }}>polar · Marcos do Brasil</div>
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
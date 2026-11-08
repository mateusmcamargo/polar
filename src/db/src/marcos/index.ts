import { ITAIPU } from "./itaipu";
import type { MarcoGalleryEntry, MarcoGroup, MarcoPage } from "./types";

export * from "./types";

// pages written so far
export const MARCO_PAGES: Readonly<Record<string, MarcoPage>> = {
    [ITAIPU.slug]: ITAIPU,
};

function galleryEntry(page: MarcoPage, caption: string): MarcoGalleryEntry {
    return { slug: page.slug, name: page.name, kind: page.kind, caption, location: page.location };
}

// groups of the list, in the order of the page; a landmark appears only when it has a page
export const MARCO_GROUPS: readonly MarcoGroup[] = [
    {
        id: "obras",
        name: "Grandes obras",
        entries: [galleryEntry(ITAIPU, "Rio Paraná · 1974 a 1984")],
    },
];

export function findMarco(slug: string): MarcoPage | null {
    return MARCO_PAGES[slug] ?? null;
}
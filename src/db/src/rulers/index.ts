import { DILMA_ROUSSEFF } from "./dilmaRousseff";
import type { GalleryEntry, RulerPage } from "./types";
import { GALLERY_ACCESSED_ON, GALLERY_SOURCES, RULER_GALLERY } from "./gallery";

export * from "./types";
export { GALLERY_ACCESSED_ON, GALLERY_SOURCES, RULER_GALLERY };

// pages written so far; people without one show "Em breve" in the gallery
export const RULER_PAGES: Readonly<Record<string, RulerPage>> = {
    [DILMA_ROUSSEFF.slug]: DILMA_ROUSSEFF,
};

export function findGalleryEntry(slug: string): GalleryEntry | null {
    for (const era of RULER_GALLERY) {
        const entry = era.people.find((person) => person.slug === slug);
        if (entry) {
            return entry;
        }
    }
    return null;
}
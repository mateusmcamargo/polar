import type { TrailIconName } from "@/components/SnakeTrail/trailIcons";

// icon of each era in the trail, by the id of the era in RULER_GALLERY
export const ERA_ICONS: Readonly<Record<string, TrailIconName>> = {
    "nova-republica": "scroll",
    "ditadura-militar": "brickWallShield",
    "republica-de-1946": "vote",
    "era-vargas": "radio",
    "republica-velha": "flag",
    imperio: "crown",
    "corte-no-brasil": "ship",
};
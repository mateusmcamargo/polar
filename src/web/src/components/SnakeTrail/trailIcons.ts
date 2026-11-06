import { Crown, Flag, Radio, ScrollText, Ship, Shield, Vote, type LucideIcon } from "lucide-react";

// icons of the trail, by name, so a server page can pass them to the client components as plain strings
export const TRAIL_ICONS = {
    ship: Ship,
    crown: Crown,
    flag: Flag,
    radio: Radio,
    vote: Vote,
    shield: Shield,
    scroll: ScrollText,
} as const satisfies Record<string, LucideIcon>;

export type TrailIconName = keyof typeof TRAIL_ICONS;
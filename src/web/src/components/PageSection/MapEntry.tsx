"use client";

import { useEffect } from "react";
import type { SectionIconName } from "@/components/SectionIcon/SectionIcon";
import { useHeader } from "@/components/SiteHeader/HeaderProvider";

interface MapEntryProps {
    // id of the element in the page that the map entry jumps to
    id: string;
    label: string;
    icon: SectionIconName;
    // id of the section that contains this entry, for the questions of a summary
    parentId?: string;
}

// puts the element that renders it in the page map and takes it out when it leaves the page, so the map follows what the page
// really shows (a conditional section, or one made from data, needs no list of its own). Draws nothing
export function MapEntry({ id, label, icon, parentId }: Readonly<MapEntryProps>) {
    const { registerSection } = useHeader();

    useEffect(() => registerSection({ id, label, sectionIcon: icon, parentId }), [id, label, icon, parentId, registerSection]);

    return null;
}
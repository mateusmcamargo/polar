"use client";

import { useState } from "react";
import type { DeputyFrontRow } from "@polar/db";
import { ScrollSlider } from "@/components/ScrollSlider/ScrollSlider";
import { SkeletonRows } from "@/components/Skeleton/Skeleton";
import styles from "./FrontList.module.scss";

const SCROLL_HINT_MIN_ROWS = 8;

function normalize(text: string): string {
    return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

interface FrontListProps {
    fronts: DeputyFrontRow[];
    // a deputy out of office keeps the fronts of the legislature, described in the past tense
    isInOffice: boolean;
}

export function FrontList({ fronts, isInOffice }: Readonly<FrontListProps>) {
    const [query, setQuery] = useState("");
    const coordinated = fronts.filter((front) => front.isCoordinator);
    const words = normalize(query).split(/\s+/).filter(Boolean);
    const shown = fronts.filter((front) => words.every((word) => normalize(front.title).includes(word)));

    return (
        <div className={styles.fronts}>
            <p className={styles.count}>
                {isInOffice ? "Participa" : "Participou"} de <strong>{fronts.length}</strong> {fronts.length === 1 ? "frente" : "frentes"}.
                {coordinated.length > 0 &&
                    ` ${isInOffice ? "Coordena" : "Coordenou"} ${coordinated.length === 1 ? "1 delas" : `${coordinated.length} delas`}.`}
            </p>
            {coordinated.length > 0 && (
                <ul className={styles.rows}>
                    {coordinated.map((front) => (
                        <li key={front.id} data-reveal="rise">
                            <span>{front.title}</span>
                            <span className={styles.role}>Coordenação</span>
                        </li>
                    ))}
                </ul>
            )}
            <label className={styles.filter} htmlFor="front-filter">
                Procurar entre as {fronts.length} frentes
                <input
                    id="front-filter"
                    type="search"
                    value={query}
                    autoComplete="off"
                    placeholder="Ex.: saúde, agricultura"
                    onChange={(event) => setQuery(event.target.value)}
                />
            </label>
            <p className={styles.hint} aria-live="polite">
                {shown.length === 0
                    ? "Nenhuma frente com esse nome."
                    : shown.length >= SCROLL_HINT_MIN_ROWS
                      ? `${shown.length} frentes. Role a lista para ver todos os nomes.`
                      : `${shown.length} ${shown.length === 1 ? "frente" : "frentes"}.`}
            </p>
            {shown.length > 0 && (
                <ScrollSlider direction="vertical" className={styles.scroll} tabIndex={0} role="region" aria-label={isInOffice ? "Frentes de que participa" : "Frentes de que participou"}>
                    <ul className={styles.rows}>
                        {shown.map((front) => (
                            <li key={front.id} data-reveal="rise">
                                <span>{front.title}</span>
                            </li>
                        ))}
                    </ul>
                </ScrollSlider>
            )}
        </div>
    );
}

// parliamentary fronts while they load
export function FrontListSkeleton() {
    return <SkeletonRows count={5} hasValue />;
}
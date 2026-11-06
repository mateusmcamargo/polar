"use client";

import type { ReactNode } from "react";
import { SkeletonStatus } from "@/components/Skeleton/Skeleton";
import { useDataEnabled } from "./debugData";

interface DataGateProps {
    // the loading shape of the content, from the Skeleton pieces
    skeleton: ReactNode;
    children: ReactNode;
}

// shows the skeleton instead of a block of data while the debug switch turns the data off; outside debug mode it only renders
// the children, so server components keep rendering on the server and only pass through this boundary
export function DataGate({ skeleton, children }: Readonly<DataGateProps>) {
    const isEnabled = useDataEnabled();
    if (isEnabled) {
        return children;
    }
    return (
        <>
            <SkeletonStatus />
            {skeleton}
        </>
    );
}
"use client";

import { ReactNode } from "react";

interface BackgroundPathsProps {
    children?: ReactNode;
}

export function BackgroundPaths({ children }: BackgroundPathsProps) {
    return (
        <div className="min-h-screen w-full bg-white">
            {children}
        </div>
    );
}

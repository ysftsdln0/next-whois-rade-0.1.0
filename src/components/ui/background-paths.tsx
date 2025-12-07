"use client";

import { ReactNode } from "react";

function StaticLines() {
    // Statik çizgiler - animasyon yok, sadece görsel
    const lines = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x1: -50 + i * 25,
        y1: -20,
        x2: 100 + i * 25,
        y2: 350,
        opacity: 0.03 + (i % 5) * 0.015,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg
                className="w-full h-full"
                viewBox="0 0 900 350"
                fill="none"
                preserveAspectRatio="xMidYMid slice"
            >
                <title>Background Lines</title>
                {/* Dikey çapraz çizgiler */}
                {lines.map((line) => (
                    <line
                        key={line.id}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="white"
                        strokeWidth="1"
                        strokeOpacity={line.opacity}
                    />
                ))}
                {/* Yatay çizgiler */}
                {Array.from({ length: 15 }, (_, i) => (
                    <line
                        key={`h-${i}`}
                        x1="0"
                        y1={i * 25}
                        x2="900"
                        y2={i * 25}
                        stroke="white"
                        strokeWidth="1"
                        strokeOpacity={0.02 + (i % 3) * 0.01}
                    />
                ))}
            </svg>
        </div>
    );
}

interface BackgroundPathsProps {
    children?: ReactNode;
}

export function BackgroundPaths({ children }: BackgroundPathsProps) {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-black">
            {/* Static lines background */}
            <StaticLines />
            
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}

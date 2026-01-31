"use client";

import DataChartContainer from '@/components/interface/domains/home/dataChartContainer';
import RightInfoSection from '@/components/interface/domains/home/infoSector';
import React from 'react';

export default function Dashboard({ params }: { params: Promise<{ teamName: string; domainName: string }> }) {
    const resolvedParams = React.use(params);

    return (
        <div className="bg-neutral-950 text-neutral-200 font-sans antialiased selection:bg-neutral-800 selection:text-white">
            <div className="w-full mx-auto space-y-8">
                <header className="flex flex-col md:flex-row  justify-between items-start md:items-center gap-4">
                    <h1 className="text-3xl font-bold text-white tracking-tight">{resolvedParams.domainName}</h1>

                    <div className="flex flex-wrap gap-2 text-sm font-medium">
                        <button className="px-3 py-1.5 border border-neutral-800 rounded-lg bg-neutral-950 hover:bg-neutral-900 hover:border-neutral-700 transition-colors">Analytics</button>
                        <button className="px-3 py-1.5 border border-neutral-800 rounded-lg bg-neutral-950 hover:bg-neutral-900 hover:border-neutral-700 transition-colors">Reverse Proxy</button>
                        <button className="px-4 py-1.5 border border-neutral-800 bg-white text-neutral-950 hover:bg-neutral-200 transition-colors rounded-lg font-semibold">DNS</button>
                    </div>
                </header>

                <main className="space-y-6 flex gap-x-3 flex-row">
                    <DataChartContainer />
                    <RightInfoSection />
                </main>
            </div>
        </div>
    );
}
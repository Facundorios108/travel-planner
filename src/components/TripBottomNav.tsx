"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, FileText, Wallet, User } from "lucide-react";

interface TripBottomNavProps {
    tripId: string;
}

export default function TripBottomNav({ tripId }: TripBottomNavProps) {
    const pathname = usePathname();

    const tabs = [
        { id: "timeline", label: "Viaje", icon: Map, href: `/trip/${tripId}` },
        { id: "docs", label: "Docs", icon: FileText, href: `/trip/${tripId}/docs` },
        { id: "expenses", label: "Gastos", icon: Wallet, href: `/trip/${tripId}/expenses` },
        { id: "profile", label: "Perfil", icon: User, href: `/?tab=profile` },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-6 py-3 pb-safe-bottom z-40">
            <div className="max-w-md mx-auto flex justify-between items-center px-2">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href || (tab.id === 'timeline' && pathname === `/trip/${tripId}`);
                    const Icon = tab.icon;
                    return (
                        <Link key={tab.id} href={tab.href} className={`flex flex-col items-center gap-1 transition-colors ${isActive ? "text-primary" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"}`}>
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "fill-primary/10" : ""} />
                            <span className={`text-[10px] uppercase tracking-wider ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
                        </Link>
                    )
                })}
            </div>
            <div className="h-4 w-full bg-white/90 dark:bg-slate-900/90"></div>
        </nav>
    );
}

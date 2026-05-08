"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, FileText, Wallet, User } from "lucide-react";
import { hapticFeedback } from "@/utils/haptics";

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
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe-bottom pb-4 pointer-events-none">
            <nav className="mx-auto max-w-md pointer-events-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-slate-800/60 rounded-3xl p-2 flex justify-around items-center shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href || (tab.id === 'timeline' && pathname === `/trip/${tripId}`);
                    const Icon = tab.icon;
                    return (
                        <Link 
                            key={tab.id} 
                            href={tab.href} 
                            onClick={() => {
                                if (!isActive) hapticFeedback.light();
                            }}
                            className="relative flex flex-col items-center justify-center w-16 h-14 group z-10"
                        >
                            {/* Animated Background Pill */}
                            <div className={`absolute inset-0 bg-blue-500 rounded-2xl transition-all duration-500 ease-out ${isActive ? 'scale-100 opacity-100 shadow-[0_4px_16px_rgba(59,130,246,0.4)]' : 'scale-50 opacity-0 group-hover:scale-90 group-hover:opacity-10 group-hover:bg-blue-200'}`}></div>
                            
                            {/* Icon Wrapper */}
                            <div className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? "-translate-y-0.5 text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400"}`}>
                                <Icon size={isActive ? 22 : 24} strokeWidth={isActive ? 2.5 : 2} className={`transition-all duration-500 ${isActive ? 'scale-110 drop-shadow-md' : 'scale-100'}`} />
                                <span className={`text-[10px] tracking-wide transition-all duration-300 ${isActive ? 'font-bold opacity-100 scale-100' : 'font-medium opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100'}`}>
                                    {tab.label}
                                </span>
                            </div>
                        </Link>
                    )
                })}
            </nav>
        </div>
    );
}

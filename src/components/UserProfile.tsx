"use client";

import React from "react";
import { User } from "firebase/auth";
import { ThemeToggle } from "./ThemeToggle";
import { Trip } from "@/types/travel";
import { Settings, Edit2, Sliders, CreditCard, Bell, HelpCircle, LogOut } from "lucide-react";

interface UserProfileProps {
    user: User | null;
    trips: Trip[];
    onSignOut: () => void;
}

export default function UserProfile({ user, trips, onSignOut }: UserProfileProps) {
    // Derived stats
    const tripsCount = trips.length;
    // Mocked for now to match the design aesthetics
    const countriesVisited = 8;
    const docsSaved = 24;

    const userInitial = user?.email?.[0]?.toUpperCase() || "U";
    const userName = user?.displayName || user?.email?.split('@')[0] || "Viajero";

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md p-6 justify-between">
                <div className="w-10"></div>
                <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Perfil</h1>
                <div className="flex w-10 items-center justify-end">
                    <button className="flex items-center justify-center rounded-full h-10 w-10 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Settings size={22} className="text-slate-700 dark:text-slate-300" />
                    </button>
                </div>
            </header>

            {/* Profile Section */}
            <div className="flex flex-col items-center pt-2 pb-8 px-6">
                <div className="relative">
                    <div className="bg-[#1877F2]/10 aspect-square rounded-[2rem] w-32 h-32 border-[0.5rem] border-white dark:border-slate-950 shadow-sm flex items-center justify-center text-[#1877F2] text-5xl font-bold uppercase transition-transform hover:scale-105">
                        {userInitial}
                    </div>
                    <button className="absolute bottom-1 right-1 bg-[#1877F2] text-white p-2 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                        <Edit2 size={16} strokeWidth={2.5} />
                    </button>
                </div>
                <div className="mt-5 text-center">
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{userName}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">{user?.email}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 px-6 mb-8">
                <div className="flex flex-col items-center justify-center bg-[#1877F2]/5 dark:bg-[#1877F2]/10 rounded-2xl p-5 border border-[#1877F2]/10 transition-colors hover:bg-[#1877F2]/10 dark:hover:bg-[#1877F2]/20 cursor-pointer">
                    <p className="text-[#1877F2] text-2xl font-black">{tripsCount}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1 text-center leading-tight">Viajes<br />Planeados</p>
                </div>
                <div className="flex flex-col items-center justify-center bg-[#1877F2]/5 dark:bg-[#1877F2]/10 rounded-2xl p-5 border border-[#1877F2]/10 transition-colors hover:bg-[#1877F2]/10 dark:hover:bg-[#1877F2]/20 cursor-pointer">
                    <p className="text-[#1877F2] text-2xl font-black">{countriesVisited}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1 text-center leading-tight">Países<br />Visitados</p>
                </div>
                <div className="flex flex-col items-center justify-center bg-[#1877F2]/5 dark:bg-[#1877F2]/10 rounded-2xl p-5 border border-[#1877F2]/10 transition-colors hover:bg-[#1877F2]/10 dark:hover:bg-[#1877F2]/20 cursor-pointer">
                    <p className="text-[#1877F2] text-2xl font-black">{docsSaved}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1 text-center leading-tight">Docs<br />Guardados</p>
                </div>
            </div>

            {/* Menu List */}
            <div className="flex flex-col gap-3 px-6 mb-10">
                <button className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-4 rounded-[1.5rem] transition-colors group border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-center rounded-xl bg-[#1877F2]/10 dark:bg-[#1877F2]/20 text-[#1877F2] h-12 w-12 transition-transform group-hover:scale-110">
                        <Sliders size={20} strokeWidth={2.5} />
                    </div>
                    <span className="flex-1 text-left text-slate-900 dark:text-slate-100 font-bold text-sm">Preferencias de Viaje</span>
                    <span className="text-slate-400 group-hover:text-[#1877F2] transition-colors">➔</span>
                </button>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-4 rounded-[1.5rem] transition-colors group border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-center rounded-xl bg-[#1877F2]/10 dark:bg-[#1877F2]/20 text-[#1877F2] h-12 w-12 transition-transform group-hover:scale-110">
                        {/* We use an empty div for layout if theme toggle is inline */}
                        <Settings size={20} strokeWidth={2.5} />
                    </div>
                    <span className="flex-1 text-left text-slate-900 dark:text-slate-100 font-bold text-sm">Apariencia (Dark Mode)</span>
                    <ThemeToggle />
                </div>
                <button className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-4 rounded-[1.5rem] transition-colors group border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-center rounded-xl bg-[#1877F2]/10 dark:bg-[#1877F2]/20 text-[#1877F2] h-12 w-12 transition-transform group-hover:scale-110">
                        <CreditCard size={20} strokeWidth={2.5} />
                    </div>
                    <span className="flex-1 text-left text-slate-900 dark:text-slate-100 font-bold text-sm">Métodos de Pago</span>
                    <span className="text-slate-400 group-hover:text-[#1877F2] transition-colors">➔</span>
                </button>
                <button className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-4 rounded-[1.5rem] transition-colors group border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-center rounded-xl bg-[#1877F2]/10 dark:bg-[#1877F2]/20 text-[#1877F2] h-12 w-12 transition-transform group-hover:scale-110">
                        <HelpCircle size={20} strokeWidth={2.5} />
                    </div>
                    <span className="flex-1 text-left text-slate-900 dark:text-slate-100 font-bold text-sm">Ayuda & Soporte</span>
                    <span className="text-slate-400 group-hover:text-[#1877F2] transition-colors">➔</span>
                </button>
            </div>

            {/* Log Out Button */}
            <div className="px-6 pb-6 mt-auto">
                <button
                    onClick={onSignOut}
                    className="flex items-center justify-center gap-2 text-rose-500 dark:text-rose-400 font-bold text-base px-6 py-4 rounded-[1.5rem] bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-95 w-full border border-rose-100 dark:border-rose-500/20 shadow-sm"
                >
                    <LogOut size={20} strokeWidth={2.5} />
                    Cerrar Sesión
                </button>
            </div>

            <div className="h-6"></div> {/* Added padding for scroll safety near screen bottom before navbar */}
        </div>
    );
}

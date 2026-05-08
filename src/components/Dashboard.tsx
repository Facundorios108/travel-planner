"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { travelService } from "@/lib/services";
import { Trip } from "@/types/travel";
import { CalendarDays, Wallet, User, Plus, Loader2, Bell, Wand2 } from "lucide-react";
import EmptyState from "./EmptyState";
import TripList from "./TripList";
import AddTrip from "./AddTrip";
import { ThemeToggle } from "./ThemeToggle";
import UserProfile from "./UserProfile";
import AITripPlanner from "./AITripPlanner";

export default function Dashboard() {
    const { user, signOut } = useAuth();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"home" | "ai" | "docs" | "profile">("home");
    const [isAddingTrip, setIsAddingTrip] = useState(false);
    const [indexErrorLink, setIndexErrorLink] = useState<string | null>(null);

    const fetchTrips = async () => {
        if (!user) return;
        setLoading(true);
        setIndexErrorLink(null);
        try {
            const userTrips = await travelService.getUserTrips(user.uid, user.email);
            setTrips(userTrips);
        } catch (error: any) {
            console.error("Error fetching trips:", error);
            if (error.message && error.message.includes("requires an index")) {
                const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
                if (urlMatch) {
                    setIndexErrorLink(urlMatch[0]);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, [user]);

    // Handle deep links from TripBottomNav (e.g., coming back from /trip/[id]/docs)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const tabUrl = params.get("tab");
            if (tabUrl === "profile" || tabUrl === "docs" || tabUrl === "home" || tabUrl === "ai") {
                setActiveTab(tabUrl as any);
            }
        }
    }, []);

    // Error UI para íncides de Firebase
    if (indexErrorLink) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-8 rounded-3xl max-w-sm border border-red-100 dark:border-red-800 shadow-sm relative">
                    <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-6">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h2 className="text-xl font-bold mb-4 text-red-800">Conexión con Base de Datos</h2>
                    <p className="mb-6 font-medium text-sm text-red-700">
                        Firebase requiere crear un índice para cargar tus viajes. Haz clic en el botón abajo, y dale al bóton azul "Crear/Create" en la página que se abre. Toma ~2 minutos.
                    </p>
                    <a href={indexErrorLink} target="_blank" rel="noopener noreferrer" className="inline-block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition shadow-md">
                        Crear Índice en Firebase
                    </a>
                    <button onClick={() => fetchTrips()} className="mt-6 text-sm text-red-500 hover:text-red-800 font-bold underline">
                        Ya lo creé, intentar de nuevo
                    </button>
                </div>
            </div>
        );
    }

    if (isAddingTrip) {
        return (
            <AddTrip
                onBack={() => setIsAddingTrip(false)}
                onTripCreated={() => {
                    setIsAddingTrip(false);
                    fetchTrips();
                }}
            />
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative flex flex-col bg-slate-50 dark:bg-slate-950 mx-auto max-w-[430px]">
            {/* Stitch Minimal Header */}
            {activeTab !== "profile" && (
                <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                            SF
                        </div>
                        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">StayFinder</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button className="w-10 h-10 flex items-center justify-center rounded-2xl glass text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all">
                            <Bell size={20} />
                        </button>
                    </div>
                </header>
            )}

            <main className="flex-1 w-full pb-24">
                {activeTab === "home" && (
                    <div className="px-6">
                        {trips.length === 0 ? (
                            <div className="pt-2">
                                <EmptyState onAdd={() => setIsAddingTrip(true)} />
                            </div>
                        ) : (
                            <TripList trips={trips} />
                        )}

                        {/* Floating Action Button for Nuevo Viaje */}
                        {activeTab === "home" && (
                            <button
                                onClick={() => setIsAddingTrip(true)}
                                className="fixed bottom-24 right-4 sm:right-auto sm:ml-[350px] w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 z-40 group"
                            >
                                <Plus size={28} className="transition-transform group-hover:rotate-90" />
                            </button>
                        )}
                    </div>
                )}

                {activeTab === "ai" && (
                    <div className="px-6 pt-4 pb-12">
                        <AITripPlanner />
                    </div>
                )}

                {activeTab === "docs" && (
                    <div className="px-6 pt-4 pb-12">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-6">Carpetas de Documentos</h2>
                        {trips.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 mt-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                                <Wallet size={48} className="text-slate-200 dark:text-slate-700 mb-4" />
                                <p className="text-sm">No tienes viajes aún para organizar documentos.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {trips.map(trip => (
                                    <button
                                        key={trip.id}
                                        onClick={() => window.location.href = `/trip/${trip.id}/docs`}
                                        className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-95 group"
                                    >
                                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /></svg>
                                        </div>
                                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 text-center line-clamp-2 w-full">{trip.name}</h3>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "profile" && (
                    <UserProfile user={user} trips={trips} onSignOut={signOut} />
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[400px] z-50 glass rounded-3xl border border-white/20 dark:border-slate-800/50 shadow-2xl overflow-hidden">
                <div className="flex justify-around items-center px-1 py-3">
                    <button
                        onClick={() => setActiveTab("home")}
                        className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === "home" ? "text-blue-500 scale-110" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
                    >
                        <CalendarDays size={20} strokeWidth={activeTab === "home" ? 2.5 : 2} />
                        <span className="text-[9px] font-bold">Viajes</span>
                        {activeTab === "home" && <div className="w-1 h-1 bg-blue-500 rounded-full mt-0.5"></div>}
                    </button>

                    <button
                        onClick={() => setActiveTab("ai")}
                        className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === "ai" ? "text-indigo-500 scale-110" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
                    >
                        <Wand2 size={20} strokeWidth={activeTab === "ai" ? 2.5 : 2} />
                        <span className="text-[9px] font-bold">IA Planner</span>
                        {activeTab === "ai" && <div className="w-1 h-1 bg-indigo-500 rounded-full mt-0.5"></div>}
                    </button>

                    <button
                        onClick={() => setActiveTab("docs")}
                        className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === "docs" ? "text-blue-500 scale-110" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
                    >
                        <Wallet size={20} strokeWidth={activeTab === "docs" ? 2.5 : 2} />
                        <span className="text-[9px] font-bold">Docs</span>
                        {activeTab === "docs" && <div className="w-1 h-1 bg-blue-500 rounded-full mt-0.5"></div>}
                    </button>

                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === "profile" ? "text-blue-500 scale-110" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
                    >
                        <User size={20} strokeWidth={activeTab === "profile" ? 2.5 : 2} />
                        <span className="text-[9px] font-bold">Perfil</span>
                        {activeTab === "profile" && <div className="w-1 h-1 bg-blue-500 rounded-full mt-0.5"></div>}
                    </button>
                </div>
            </nav>
        </div>
    );
}

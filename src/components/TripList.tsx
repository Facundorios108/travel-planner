"use client";

import { Trip } from "@/types/travel";
import { format, differenceInMonths, differenceInWeeks, differenceInDays, differenceInHours, differenceInMinutes, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale/es";
import { Clock, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, memo, useCallback } from "react";

// Helper component for start date display
const StartDateDisplay = memo(function StartDateDisplay({ startDate }: { startDate: Date | undefined }) {
    const [statusText, setStatusText] = useState("");

    useEffect(() => {
        if (!startDate) {
            setStatusText("Sin fecha definida");
            return;
        }

        const now = new Date();
        const start = new Date(startDate);

        if (start < now && differenceInDays(now, start) > 0) {
            setStatusText("Viaje iniciado / Pasado");
        } else if (differenceInDays(start, now) === 0 && start.getDate() === now.getDate()) {
            setStatusText("¡Inicia hoy!");
        } else {
            // Refactored to just show days instead of months for a true "countdown" feel
            const daysLeft = differenceInCalendarDays(start, now);
            if (daysLeft > 0) {
                setStatusText(`Faltan ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}`);
            } else {
                const hoursLeft = differenceInHours(start, now);
                if (hoursLeft > 0) {
                    setStatusText(`Faltan ${hoursLeft} ${hoursLeft === 1 ? 'hora' : 'horas'}`);
                } else {
                    const minsLeft = differenceInMinutes(start, now);
                    setStatusText(`Faltan ${minsLeft > 0 ? minsLeft : 1} min`);
                }
            }
        }
    }, [startDate]);

    return (
        <span className="text-sm font-bold text-blue-500" suppressHydrationWarning>
            {statusText}
        </span>
    );
});

// Memoized trip card component
const TripCard = memo(function TripCard({ trip, onClick }: { trip: Trip; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none transition-all hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
        >
            {/* Upper Half: Image with Date Badge */}
            <div className="h-56 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                {/* Image with overlay gradient */}
                <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                    style={{ backgroundImage: `url('${trip.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop"}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

                {/* Date Badge */}
                <div className="absolute top-6 right-6 glass px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white border border-white/20" suppressHydrationWarning>
                    {typeof window !== "undefined"
                        ? format(trip.startDate || trip.createdAt, "dd MMM", { locale: es })
                        : ""}
                </div>
                
                {/* Destination Mini Label */}
                <div className="absolute bottom-6 left-6 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Destino</p>
                    <p className="text-sm font-bold truncate max-w-[200px]">{trip.destination}</p>
                </div>
            </div>

            {/* Lower Half: Info and Meta */}
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors">{trip.name}</h3>
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center transition-transform group-hover:rotate-12">
                        <ChevronRight size={20} />
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Clock size={14} className="text-blue-500" />
                        </div>
                        <StartDateDisplay startDate={trip.startDate} />
                    </div>
                </div>
            </div>
        </div>
    );
});

export default function TripList({ trips }: { trips: Trip[] }) {
    const router = useRouter();

    const handleTripClick = useCallback((tripId: string) => {
        router.push(`/trip/${tripId}`);
    }, [router]);

    return (
        <div className="w-full space-y-6 mt-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Próximos Viajes</h2>
            </div>

            <div className="space-y-6">
                {trips.map((trip) => (
                    <TripCard 
                        key={trip.id} 
                        trip={trip} 
                        onClick={() => handleTripClick(trip.id)} 
                    />
                ))}
            </div>
        </div>
    );
}

"use client";

import { Trip } from "@/types/travel";
import { format, differenceInMonths, differenceInWeeks, differenceInDays, differenceInHours, differenceInMinutes, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale/es";
import { Clock, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, memo, useCallback, useTransition } from "react";

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
        <span className="text-sm font-bold text-blue-600 dark:text-blue-400" suppressHydrationWarning>
            {statusText}
        </span>
    );
});

// Memoized trip card component
const TripCard = memo(function TripCard({ trip, onClick }: { trip: Trip; onClick: () => void }) {
    const [isPending, startTransition] = useTransition();
    
    const handleClick = () => {
        startTransition(() => {
            onClick();
        });
    };
    
    return (
        <div
            onClick={handleClick}
            className="group relative bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-200/40 dark:border-slate-800/40 shadow-lg shadow-slate-200/30 dark:shadow-black/30 transition-all duration-200 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 hover:border-blue-200/60 dark:hover:border-blue-800/60 cursor-pointer active:scale-[0.98]"
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
                <div className="absolute top-5 right-5 bg-white/20 backdrop-blur-xl px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/40 shadow-lg" suppressHydrationWarning>
                    {typeof window !== "undefined"
                        ? format(trip.startDate || trip.createdAt, "dd MMM", { locale: es })
                        : ""}
                </div>
                
                {/* Trip Name Label */}
                <div className="absolute bottom-6 left-6 text-white">
                    <p className="text-sm font-extrabold truncate max-w-[280px] drop-shadow-lg">{trip.name}</p>
                </div>
            </div>

            {/* Lower Half: Info and Meta */}
            <div className="p-5">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/30">
                            <Clock size={15} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <StartDateDisplay startDate={trip.startDate} />
                    </div>
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:rotate-12 shadow-lg shadow-blue-500/30">
                        <ChevronRight size={20} />
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

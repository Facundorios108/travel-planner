"use client";

import { Trip } from "@/types/travel";
import { format, differenceInMonths, differenceInWeeks, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale/es";
import { Clock, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Helper component for start date display
function StartDateDisplay({ startDate }: { startDate: Date | undefined }) {
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
            const monthsLeft = differenceInMonths(start, now);
            if (monthsLeft > 0) {
                setStatusText(`Faltan ${monthsLeft} ${monthsLeft === 1 ? 'mes' : 'meses'}`);
                return;
            }
            const weeksLeft = differenceInWeeks(start, now);
            if (weeksLeft > 0) {
                setStatusText(`Faltan ${weeksLeft} ${weeksLeft === 1 ? 'semana' : 'semanas'}`);
                return;
            }
            const daysLeft = differenceInDays(start, now);
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
        <span className="text-sm font-medium" suppressHydrationWarning>
            {statusText}
        </span>
    );
}

export default function TripList({ trips }: { trips: Trip[] }) {
    const router = useRouter();

    return (
        <div className="w-full space-y-6 mt-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Próximos Viajes</h2>
            </div>

            <div className="space-y-6">
                {trips.map((trip) => (
                    <div
                        key={trip.id}
                        onClick={() => router.push(`/trip/${trip.id}`)}
                        className="group relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md cursor-pointer"
                    >
                        {/* Upper Half: Image with Date Badge */}
                        <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                            {/* Image Placeholder (configurable per trip now) */}
                            <div
                                className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                                style={{ backgroundImage: `url('${trip.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop"}')` }}
                            />

                            {/* Date Badge */}
                            <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400" suppressHydrationWarning>
                                {typeof window !== "undefined"
                                    ? format(trip.startDate || trip.createdAt, "dd MMM", { locale: es })
                                    : ""}
                            </div>
                        </div>

                        {/* Lower Half: Info and Meta */}
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{trip.name}</h3>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <Clock size={16} />
                                    <StartDateDisplay startDate={trip.startDate} />
                                </div>
                                <button className="text-sm font-bold text-blue-500 dark:text-blue-400 flex items-center gap-1 group-hover:underline">
                                    Detalles
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

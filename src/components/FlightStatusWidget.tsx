"use client";

import { useEffect, useState } from "react";
import { Plane, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { travelService } from "@/lib/services";

interface FlightStatusWidgetProps {
    flightCode: string;
}

export default function FlightStatusWidget({ flightCode }: FlightStatusWidgetProps) {
    const { user } = useAuth();
    const [enabled, setEnabled] = useState(false);
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        let active = true;

        const loadPrefsAndStatus = async () => {
            const key = `catchme_prefs_${user.uid}`;
            const stored = localStorage.getItem(key);
            let isEnabled = true;

            if (stored) {
                try {
                    const prefs = JSON.parse(stored);
                    if (prefs.vueloAlerts === false) {
                        isEnabled = false;
                    }
                } catch (e) {}
            } else {
                try {
                    const fetchedPrefs = await travelService.getUserPreferences(user.uid);
                    if (fetchedPrefs && fetchedPrefs.vueloAlerts === false) {
                        isEnabled = false;
                    }
                    if (fetchedPrefs) {
                        localStorage.setItem(key, JSON.stringify(fetchedPrefs));
                    }
                } catch (e) {
                    console.error("Error fetching preferences in flight status widget", e);
                }
            }

            if (!active) return;

            if (isEnabled) {
                setEnabled(true);
                setLoading(true);
                try {
                    const res = await fetch(`/api/flight-status?flightCode=${encodeURIComponent(flightCode)}`);
                    const data = await res.json();
                    if (active) setStatus(data);
                } catch (e) {
                    console.error("Error fetching flight status:", e);
                } finally {
                    if (active) setLoading(false);
                }
            } else {
                setEnabled(false);
                setLoading(false);
            }
        };

        loadPrefsAndStatus();

        return () => {
            active = false;
        };
    }, [user, flightCode]);

    if (!enabled) return null;
    if (loading) return (
        <div className="mt-2 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 flex items-center gap-2 animate-pulse">
            <Plane size={14} className="text-blue-400" />
            <div className="h-3 bg-blue-200 dark:bg-blue-800 rounded w-24"></div>
        </div>
    );
    if (!status || status.error) return null;

    let StatusIcon = CheckCircle2;
    let statusColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800/50";
    
    if (status.status === "Demorado") {
        StatusIcon = Clock;
        statusColor = "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800/50";
    } else if (status.status === "Cancelado") {
        StatusIcon = AlertTriangle;
        statusColor = "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-800/50";
    } else if (status.status === "En vuelo") {
        StatusIcon = Plane;
        statusColor = "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800/50";
    }

    return (
        <div className={`mt-3 p-2.5 rounded-xl border flex items-center justify-between shadow-sm relative overflow-hidden ${statusColor}`}>
            {status.isMock ? (
                <div className="absolute top-0 right-0 bg-black/5 dark:bg-white/5 text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg uppercase tracking-wider opacity-70">
                    Simulado
                </div>
            ) : (
                <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                    En vivo
                </div>
            )}
            <div className="flex items-center gap-2.5 relative z-10">
                <StatusIcon size={16} className={status.status === "En vuelo" ? "animate-bounce" : ""} />
                <div>
                    <div className="text-[10px] uppercase font-black tracking-wider opacity-80">
                        Vuelo {status.flightCode} {status.airline && status.airline !== "Simulated Airline" && `• ${status.airline}`} {status.flightDate && `• ${status.flightDate.split('-').reverse().slice(0, 2).join('/')}`}
                    </div>
                    <div className="text-sm font-bold leading-none mt-0.5">
                        {status.status} {status.delayMinutes > 0 && `(+${status.delayMinutes} min)`}
                    </div>
                </div>
            </div>
            <div className="text-right relative z-10">
                <div className="text-xs font-black opacity-90">{status.departureTime} ➔ {status.arrivalTime}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mt-0.5">Terminal {status.terminal} • Puerta {status.gate}</div>
            </div>
        </div>
    );
}

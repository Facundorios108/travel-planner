"use client";

import { useState } from "react";
import { useToast } from "./Toast";
import { ArrowLeft, PlusCircle, Trash2, Loader2, Calendar, MapPin, PlaneTakeoff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { travelService } from "@/lib/services";

import LocationSearch from "./LocationSearch";

interface DestinationInput {
    id: string; // Temp ID for UI mapping
    country: string;
    city: string;
    startDate: string;
    endDate: string;
}

export default function AddTrip({ onBack, onTripCreated }: { onBack: () => void, onTripCreated: () => void }) {
    const { user } = useAuth();
    const { showToast, ToastComponent } = useToast();
    const [loading, setLoading] = useState(false);
    const [tripName, setTripName] = useState("");

    const [destinations, setDestinations] = useState<DestinationInput[]>([
        { id: "1", country: "", city: "", startDate: "", endDate: "" }
    ]);

    const handleAddDestination = () => {
        const lastDest = destinations[destinations.length - 1];
        setDestinations([
            ...destinations,
            {
                id: Date.now().toString(),
                country: lastDest.country || "",
                city: "",
                startDate: lastDest.endDate || "",
                endDate: lastDest.endDate || ""
            }
        ]);
    };

    const handleRemoveDestination = (id: string) => {
        if (destinations.length > 1) {
            setDestinations(destinations.filter(d => d.id !== id));
        }
    };

    const updateDestination = (id: string, field: keyof DestinationInput, value: string) => {
        setDestinations(destinations.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const updateLocation = (id: string, location: { country: string; city: string }) => {
        setDestinations(
            destinations.map(d => d.id === id ? { ...d, country: location.country, city: location.city } : d)
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Validación básica
        for (const dest of destinations) {
            if (!dest.city || !dest.country) {
                showToast("Por favor, completa ciudad y país para todos los destinos.", "warning");
                return;
            }
            if (!dest.startDate || !dest.endDate) {
                showToast("Por favor, ingresa las fechas para todos los destinos.", "warning");
                return;
            }
            // Parsear fechas en zona horaria local para validación
            const startLocal = new Date(dest.startDate + 'T00:00:00');
            const endLocal = new Date(dest.endDate + 'T00:00:00');
            if (endLocal < startLocal) {
                showToast(`La fecha de salida en ${dest.city} debe ser después de la llegada.`, "warning");
                return;
            }
        }

        setLoading(true);

        try {
            // Find the overall start and end dates from destinations
            // Parsear fechas en zona horaria local para evitar problemas de timezone
            const startDates = destinations.map(d => new Date(d.startDate + 'T00:00:00').getTime());
            const endDates = destinations.map(d => new Date(d.endDate + 'T00:00:00').getTime());

            const overallStartDate = new Date(Math.min(...startDates));
            const overallEndDate = new Date(Math.max(...endDates));

            const tripId = await travelService.createTrip(
                user.uid,
                tripName || "Mi Nuevo Viaje",
                overallStartDate,
                overallEndDate
            );

            for (let i = 0; i < destinations.length; i++) {
                const d = destinations[i];
                await travelService.addDestination(
                    tripId,
                    d.country,
                    d.city,
                    new Date(d.startDate + 'T00:00:00'),
                    new Date(d.endDate + 'T00:00:00'),
                    i // Orden
                );
            }

            onTripCreated();
        } catch (error) {
            console.error("Error saving trip:", error);
            showToast("Error al guardar el viaje. Intenta de nuevo.", "error");
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalDays = () => {
        let total = 0;
        destinations.forEach(dest => {
            if (dest.startDate && dest.endDate) {
                // Parsear fechas en zona horaria local para evitar problemas de timezone
                const start = new Date(dest.startDate + 'T00:00:00');
                const end = new Date(dest.endDate + 'T00:00:00');
                // Contar días inclusive: del 1 al 20 son 20 días
                const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                total += diffDays;
            }
        });
        return total;
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col max-w-3xl mx-auto overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
            {ToastComponent}
            {/* Custom Styles for Timeline Line */}
            <style jsx>{`
                .itinerary-line {
                    position: absolute;
                    left: 13px;
                    top: 32px;
                    bottom: -32px;
                    width: 2px;
                    background: repeating-linear-gradient(to bottom, #cbd5e1 0%, #cbd5e1 4px, transparent 4px, transparent 8px);
                }
                :global(.dark) .itinerary-line {
                    background: repeating-linear-gradient(to bottom, #334155 0%, #334155 4px, transparent 4px, transparent 8px);
                }
            `}</style>

            {/* Header */}
            <header className="sticky top-0 flex items-center justify-between p-4 pt-[calc(env(safe-area-inset-top)+16px)] bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl z-20 transition-colors border-b border-slate-200/50 dark:border-slate-800/50">
                <button 
                    onClick={onBack} 
                    className="flex items-center justify-center h-10 w-10 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm border border-slate-200/10 active:scale-95 animate-in fade-in slide-in-from-left-4 duration-300"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="text-center">
                    <h1 className="text-base font-black tracking-tight text-slate-950 dark:text-white">Nuevo Viaje</h1>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Planificador</p>
                </div>
                <div className="w-10"></div>
            </header>

            {/* Form */}
            <main className="flex-1 overflow-y-auto px-5 pt-5 space-y-6 pb-36">
                <form id="add-trip-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* Trip Name */}
                    <div className="space-y-3 bg-white dark:bg-slate-900/40 backdrop-blur-md p-5 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative group overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-full"></div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Nombre del Viaje
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={tripName}
                                onChange={(e) => setTripName(e.target.value)}
                                placeholder="Ej: Eurotrip 2024 o Escapada a la Playa"
                                className="w-full h-11 bg-transparent border-b border-slate-100 dark:border-slate-800/80 focus:border-blue-500 focus:ring-0 transition-colors text-base font-bold outline-none text-slate-950 dark:text-white placeholder:text-slate-400 pb-1"
                            />
                        </div>
                    </div>

                    {/* Itinerary Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Itinerario
                            </label>
                            <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
                                {calculateTotalDays()} Días en Total
                            </span>
                        </div>

                        <div className="space-y-5 relative">
                            {destinations.map((dest, index) => {
                                const isFirst = index === 0;
                                const isLast = index === destinations.length - 1;

                                // Calcular días locales (inclusive)
                                let diffDays = 0;
                                if (dest.startDate && dest.endDate) {
                                    const start = new Date(dest.startDate + 'T00:00:00');
                                    const end = new Date(dest.endDate + 'T00:00:00');
                                    diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                }

                                return (
                                    <div key={dest.id} className="relative pl-9 group">
                                        {/* Timeline Line */}
                                        {!isLast && <div className="itinerary-line"></div>}

                                        {/* Location Pin */}
                                        <div className={`absolute left-0 top-5 flex h-7.5 w-7.5 items-center justify-center rounded-full shadow-md transition-all group-hover:scale-110 z-10 ${
                                            isFirst 
                                                ? 'bg-blue-500 text-white border border-blue-400 shadow-blue-500/20' 
                                                : 'bg-white dark:bg-slate-900 border-2 border-blue-500 text-blue-500'
                                        }`}>
                                            <MapPin size={13} />
                                        </div>

                                        {/* Destination Card ("Boarding Pass" Style) */}
                                        <div className="flex-1 bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-[2.2rem] p-5 shadow-sm space-y-4 hover:shadow-md transition-all duration-300 relative group-hover:border-slate-300 dark:group-hover:border-slate-700">
                                            {/* Card Header */}
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full">
                                                        Parada {index + 1}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                                                        {isFirst ? "Inicio" : (isLast ? "Destino final" : "Escala")}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {diffDays > 0 && (
                                                        <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                            {diffDays} {diffDays === 1 ? 'Día' : 'Días'}
                                                        </span>
                                                    )}
                                                    {destinations.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveDestination(dest.id)}
                                                            className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition active:scale-95 shrink-0 animate-in fade-in duration-200"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Location Input */}
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-1 block">
                                                    Ciudad de Destino
                                                </label>
                                                <LocationSearch
                                                    placeholder="Ej: Barcelona, Londres, Madrid..."
                                                    value={dest.city ? (dest.country ? `${dest.city}, ${dest.country}` : dest.city) : ""}
                                                    onSelect={(loc) => updateLocation(dest.id, loc)}
                                                />
                                            </div>

                                            {/* Date Inputs */}
                                            <div className="grid grid-cols-2 gap-3 mt-3">
                                                <div className="relative bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-2.5 border border-slate-200/40 dark:border-slate-800/60 transition-all focus-within:border-blue-500/40">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <Calendar size={11} className="text-blue-500" />
                                                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Llegada</span>
                                                    </div>
                                                    <input
                                                        type="date"
                                                        required
                                                        value={dest.startDate}
                                                        onChange={(e) => {
                                                            const newStart = e.target.value;
                                                            updateDestination(dest.id, "startDate", newStart);
                                                            if (!dest.endDate || newStart > dest.endDate) {
                                                                updateDestination(dest.id, "endDate", newStart);
                                                            }
                                                        }}
                                                        className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-100 text-xs font-bold [color-scheme:light] dark:[color-scheme:dark]"
                                                    />
                                                </div>
                                                <div className="relative bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-2.5 border border-slate-200/40 dark:border-slate-800/60 transition-all focus-within:border-blue-500/40">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <Calendar size={11} className="text-blue-500" />
                                                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Salida</span>
                                                    </div>
                                                    <input
                                                        type="date"
                                                        required
                                                        value={dest.endDate}
                                                        min={dest.startDate}
                                                        onChange={(e) => updateDestination(dest.id, "endDate", e.target.value)}
                                                        className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-100 text-xs font-bold [color-scheme:light] dark:[color-scheme:dark]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Destination Button */}
                        <button
                            type="button"
                            onClick={handleAddDestination}
                            className="flex items-center gap-2 py-3 px-5 text-indigo-500 hover:text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-300 transition-all hover:scale-[1.01] active:scale-[0.98] rounded-2xl ml-9 font-bold text-xs shadow-sm shadow-indigo-500/5"
                        >
                            <PlusCircle size={16} />
                            <span>Añadir escala al viaje</span>
                        </button>
                    </div>
                </form>
            </main>

            {/* Fixed Bottom Footer */}
            <footer className="absolute bottom-0 left-0 right-0 p-5 pt-10 bg-gradient-to-t from-slate-50 via-slate-50/95 dark:from-slate-950 dark:via-slate-950/95 to-transparent z-20">
                <button
                    form="add-trip-form"
                    type="submit"
                    disabled={loading}
                    className="w-full h-13 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-indigo-500/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-indigo-500/30"
                >
                    {loading ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                        <>
                            <span>Crear Viaje</span>
                            <PlaneTakeoff size={18} className="animate-bounce" />
                        </>
                    )}
                </button>
            </footer>
        </div>
    );
}

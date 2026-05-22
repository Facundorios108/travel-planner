"use client";

import { useState } from "react";
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
                window.alert("Por favor, completa ciudad y país para todos los destinos.");
                return;
            }
            if (!dest.startDate || !dest.endDate) {
                window.alert("Por favor, ingresa las fechas para todos los destinos.");
                return;
            }
            // Parsear fechas en zona horaria local para validación
            const startLocal = new Date(dest.startDate + 'T00:00:00');
            const endLocal = new Date(dest.endDate + 'T00:00:00');
            if (endLocal < startLocal) {
                window.alert(`La fecha de salida en ${dest.city} debe ser después de la llegada.`);
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
                    new Date(d.endDate),
                    i // Orden
                );
            }

            onTripCreated();
        } catch (error) {
            console.error("Error saving trip:", error);
            window.alert("Error al guardar el viaje. Intenta de nuevo.");
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
        <div className="relative flex min-h-screen w-full flex-col max-w-[480px] mx-auto overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
            {/* Custom Styles for Timeline Line */}
            <style jsx>{`
                .itinerary-line {
                    position: absolute;
                    left: 20px;
                    top: 24px;
                    bottom: -24px;
                    width: 2px;
                    background: repeating-linear-gradient(to bottom, #cbd5e1 0%, #cbd5e1 4px, transparent 4px, transparent 8px);
                }
                :global(.dark) .itinerary-line {
                    background: repeating-linear-gradient(to bottom, #334155 0%, #334155 4px, transparent 4px, transparent 8px);
                }
            `}</style>

            {/* Header */}
            <header className="sticky top-0 flex items-center justify-between p-4 pt-6 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl z-20 transition-colors border-b border-slate-200/50 dark:border-slate-800/50">
                <button onClick={onBack} className="flex items-center justify-center h-11 w-11 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm">
                    <ArrowLeft size={20} />
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Nuevo Viaje</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Multi-destino</p>
                </div>
                <div className="w-11"></div>
            </header>

            {/* Form */}
            <main className="flex-1 overflow-y-auto px-6 pt-4 space-y-6 pb-32">
                <form id="add-trip-form" onSubmit={handleSubmit} className="space-y-8">
                    {/* Trip Name */}
                    <div className="space-y-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Nombre del Viaje
                        </label>
                        <div className="relative group">
                            <input
                                type="text"
                                required
                                value={tripName}
                                onChange={(e) => setTripName(e.target.value)}
                                placeholder="Ej: Eurotrip 2024"
                                className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base font-semibold outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Itinerary Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between ml-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Itinerario
                            </label>
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{calculateTotalDays()} Días en Total</span>
                        </div>

                        <div className="space-y-0 relative">
                            {destinations.map((dest, index) => {
                                const isFirst = index === 0;
                                const isLast = index === destinations.length - 1;

                                // Calcular días locales (inclusive)
                                let diffDays = 0;
                                if (dest.startDate && dest.endDate) {
                                    // Parsear fechas en zona horaria local para evitar problemas de timezone
                                    const start = new Date(dest.startDate + 'T00:00:00');
                                    const end = new Date(dest.endDate + 'T00:00:00');
                                    // Contar días inclusive: del 1 al 20 son 20 días
                                    diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                }

                                return (
                                    <div key={dest.id} className="relative flex flex-col gap-4 py-3 group">
                                        {/* Timeline Line (don't show on last item to prevent overflow) */}
                                        {!isLast && <div className="itinerary-line"></div>}

                                        <div className="flex gap-4">
                                            {/* Location Pin */}
                                            <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ${isFirst ? 'bg-blue-500 text-white' : 'bg-white border-2 border-blue-500 text-blue-500'}`}>
                                                <MapPin size={18} />
                                            </div>

                                            {/* Content Block */}
                                            <div className="flex flex-col flex-1 pb-4">
                                                <div className="flex flex-1 items-start justify-between">
                                                    <div className="flex flex-col flex-1 pr-2">
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                                                            {isFirst ? "Punto de inicio" : (isLast ? "Destino final" : "Siguiente parada")}
                                                        </span>
                                                        <div className="w-full">
                                                            <LocationSearch
                                                                placeholder="Buscar ciudad..."
                                                                value={dest.city ? (dest.country ? `${dest.city}, ${dest.country}` : dest.city) : ""}
                                                                onSelect={(loc) => updateLocation(dest.id, loc)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2 mt-4">
                                                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full whitespace-nowrap">
                                                            <span className="text-xs font-bold dark:text-slate-200">{diffDays}</span>
                                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">días</span>
                                                        </div>
                                                        {destinations.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveDestination(dest.id)}
                                                                className="text-slate-300 hover:text-red-500 transition px-2"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Date Inputs */}
                                                <div className="flex flex-col sm:flex-row gap-3 mt-3 w-full max-w-[280px]">
                                                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg p-2 border border-slate-200 dark:border-slate-800">
                                                        <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1">C/IN</label>
                                                        <input
                                                            type="date"
                                                            required
                                                            value={dest.startDate}
                                                            onChange={(e) => updateDestination(dest.id, "startDate", e.target.value)}
                                                            className="w-full bg-transparent outline-none text-slate-700 dark:text-slate-300 text-sm font-medium"
                                                        />
                                                    </div>
                                                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg p-2 border border-slate-200 dark:border-slate-800">
                                                        <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1">C/OUT</label>
                                                        <input
                                                            type="date"
                                                            required
                                                            value={dest.endDate}
                                                            min={dest.startDate}
                                                            onChange={(e) => updateDestination(dest.id, "endDate", e.target.value)}
                                                            className="w-full bg-transparent outline-none text-slate-700 dark:text-slate-300 text-sm font-medium"
                                                        />
                                                    </div>
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
                            className="flex items-center gap-2 py-3 px-5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all rounded-xl ml-8 font-bold text-sm"
                        >
                            <PlusCircle size={20} />
                            <span>Añadir Destino</span>
                        </button>
                    </div>

                    {/* Temporary Map Visualizer Placeholder */}
                    <div className="pt-4">
                        <div className="w-full aspect-[21/9] rounded-2xl bg-slate-100 dark:bg-slate-900 overflow-hidden relative border border-slate-200/50 dark:border-slate-800/50">
                            <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-60 grayscale dark:opacity-30" />
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent"></div>
                            <div className="absolute bottom-4 left-4">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Planeando ruta...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </main>

            {/* Fixed Bottom Footer */}
            <footer className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-slate-50 via-slate-50/95 dark:from-slate-950 dark:via-slate-950/95 to-transparent z-20">
                <button
                    form="add-trip-form"
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-blue-500 text-white rounded-full font-bold text-lg shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {loading ? (
                        <Loader2 className="animate-spin w-6 h-6" />
                    ) : (
                        <>
                            <span>Crear Viaje</span>
                            <PlaneTakeoff size={20} />
                        </>
                    )}
                </button>
            </footer>
        </div>
    );
}

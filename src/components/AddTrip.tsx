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
                alert("Por favor, selecciona una ciudad y país para todos los destinos.");
                return;
            }
            if (!dest.startDate || !dest.endDate) {
                alert("Por favor, selecciona las fechas de llegada y salida para todos los destinos.");
                return;
            }
            if (new Date(dest.endDate) < new Date(dest.startDate)) {
                alert(`La fecha de salida en ${dest.city} no puede ser anterior a la de llegada.`);
                return;
            }
        }

        setLoading(true);

        try {
            // Find the overall start and end dates from destinations
            const startDates = destinations.map(d => new Date(d.startDate).getTime());
            const endDates = destinations.map(d => new Date(d.endDate).getTime());

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
                    new Date(d.startDate),
                    new Date(d.endDate),
                    i // Orden
                );
            }

            onTripCreated();
        } catch (error) {
            console.error("Error saving trip:", error);
            alert("Hubo un error al guardar el viaje.");
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalDays = () => {
        let total = 0;
        destinations.forEach(dest => {
            if (dest.startDate && dest.endDate) {
                const start = new Date(dest.startDate).getTime();
                const end = new Date(dest.endDate).getTime();
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                total += diffDays;
            }
        });
        return total;
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col max-w-[480px] mx-auto overflow-hidden bg-slate-50">
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
            `}</style>

            {/* Header */}
            <header className="flex items-center justify-between p-4 pt-6 bg-slate-50 z-10">
                <button onClick={onBack} className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-200/50 text-slate-900 transition hover:bg-slate-300">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold tracking-tight text-slate-900">Nuevo Viaje Multi-Destino</h1>
                <div className="w-10"></div>
            </header>

            {/* Form */}
            <main className="flex-1 overflow-y-auto px-6 pt-4 space-y-6 pb-32">
                <form id="add-trip-form" onSubmit={handleSubmit} className="space-y-8">
                    {/* Trip Name */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                            Nombre del Viaje
                        </label>
                        <div className="relative group">
                            <input
                                type="text"
                                required
                                value={tripName}
                                onChange={(e) => setTripName(e.target.value)}
                                placeholder="Ej: Eurotrip 2024"
                                className="w-full h-14 px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base font-medium outline-none"
                            />
                        </div>
                    </div>

                    {/* Itinerary Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between ml-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                                Itinerario
                            </label>
                            <span className="text-xs font-medium text-slate-400">{calculateTotalDays()} Días en Total</span>
                        </div>

                        <div className="space-y-0 relative">
                            {destinations.map((dest, index) => {
                                const isFirst = index === 0;
                                const isLast = index === destinations.length - 1;

                                // Calcular días locales
                                let diffDays = 0;
                                if (dest.startDate && dest.endDate) {
                                    const start = new Date(dest.startDate).getTime();
                                    const end = new Date(dest.endDate).getTime();
                                    diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
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
                                                        <span className="text-xs text-slate-500 font-medium mb-1">
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
                                                        <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap">
                                                            <span className="text-xs font-bold">{diffDays}</span>
                                                            <span className="text-[10px] text-slate-500 uppercase font-bold">días</span>
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
                                                <div className="flex gap-3 mt-3 w-full max-w-[280px]">
                                                    <div className="flex-1 bg-white rounded-lg p-2 border border-slate-200">
                                                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">C/IN</label>
                                                        <input
                                                            type="date"
                                                            required
                                                            value={dest.startDate}
                                                            onChange={(e) => updateDestination(dest.id, "startDate", e.target.value)}
                                                            className="w-full bg-transparent outline-none text-slate-700 text-sm font-medium"
                                                        />
                                                    </div>
                                                    <div className="flex-1 bg-white rounded-lg p-2 border border-slate-200">
                                                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">C/OUT</label>
                                                        <input
                                                            type="date"
                                                            required
                                                            value={dest.endDate}
                                                            min={dest.startDate}
                                                            onChange={(e) => updateDestination(dest.id, "endDate", e.target.value)}
                                                            className="w-full bg-transparent outline-none text-slate-700 text-sm font-medium"
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
                            className="flex items-center gap-2 py-2 px-1 text-blue-500 hover:text-blue-600 transition-colors ml-12"
                        >
                            <PlusCircle size={20} />
                            <span className="text-sm font-bold">Añadir Destino</span>
                        </button>
                    </div>

                    {/* Temporary Map Visualizer Placeholder */}
                    <div className="pt-4">
                        <div className="w-full aspect-[21/9] rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-200/50">
                            <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-60 grayscale" />
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-transparent"></div>
                            <div className="absolute bottom-4 left-4">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Planeando ruta...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </main>

            {/* Fixed Bottom Footer */}
            <footer className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent z-20">
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

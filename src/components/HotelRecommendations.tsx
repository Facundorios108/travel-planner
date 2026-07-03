"use client";

import { useState, useEffect } from "react";
import { Sparkles, MapPin, Loader2, Hotel, Star, ArrowRight } from "lucide-react";
import { Trip, Destination } from "@/types/travel";

interface HotelRecommendationsProps {
    trips: Trip[];
}

export default function HotelRecommendations({ trips }: HotelRecommendationsProps) {
    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    
    // Simple mock logic - in a real app, we'd use Gemini API to analyze destinations
    useEffect(() => {
        if (!trips.length) return;
        
        // Find upcoming trips
        const now = new Date();
        const upcomingTrips = trips.filter(t => t.startDate && t.startDate > now).sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0));
        if (!upcomingTrips.length) return;

        const nextTrip = upcomingTrips[0];
        if (!nextTrip.destination) return;
        
        const firstDest = nextTrip.destination;

        setLoading(true);
        // Simulate AI thinking time
        setTimeout(() => {
            // Mock recommendations based on the city
            setRecommendations([
                {
                    id: 1,
                    name: `Gran Hotel ${firstDest}`,
                    rating: 4.8,
                    price: "$120",
                    description: `Excelente ubicación en el corazón de ${firstDest}, ideal para turistas.`,
                    aiNote: "Recomendado por su cercanía a las atracciones principales y su relación calidad-precio."
                },
                {
                    id: 2,
                    name: `Boutique ${firstDest} Suites`,
                    rating: 4.5,
                    price: "$95",
                    description: `Un ambiente acogedor con diseño moderno en ${firstDest}.`,
                    aiNote: "Elegido por sus excelentes reseñas de viajeros solos y parejas."
                }
            ]);
            setLoading(false);
        }, 1500);

    }, [trips]);

    if (!trips.length) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-3xl mt-4 border border-slate-100 dark:border-slate-800">
                <Hotel size={48} className="text-slate-200 dark:text-slate-700 mb-4" />
                <p className="text-slate-500 font-bold">Crea un viaje para obtener recomendaciones inteligentes de hoteles.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles size={100} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={20} className="text-indigo-200" />
                        <h2 className="text-lg font-black tracking-tight">Recomendaciones IA</h2>
                    </div>
                    <p className="text-indigo-100 text-sm max-w-[280px]">
                        Nuestra inteligencia artificial analiza tus próximos destinos para sugerirte el alojamiento perfecto.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 size={32} className="text-indigo-500 animate-spin" />
                    <p className="text-sm font-bold text-slate-500 animate-pulse">Buscando los mejores hoteles...</p>
                </div>
            ) : recommendations.length > 0 ? (
                <div className="space-y-4">
                    {recommendations.map(hotel => (
                        <div key={hotel.id} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition group">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight">{hotel.name}</h3>
                                    <div className="flex items-center gap-1 mt-1 text-amber-500">
                                        <Star size={14} className="fill-amber-500" />
                                        <span className="text-xs font-bold">{hotel.rating}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{hotel.price}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/ noche</span>
                                </div>
                            </div>
                            
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{hotel.description}</p>
                            
                            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3 mb-4 relative">
                                <Sparkles size={12} className="absolute top-3 left-3 text-indigo-400" />
                                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 pl-6">{hotel.aiNote}</p>
                            </div>

                            <button className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-500/20 dark:group-hover:text-indigo-400">
                                Ver disponibilidad <ArrowRight size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-slate-500 font-bold">No se encontraron viajes próximos con destinos asignados.</p>
                </div>
            )}
        </div>
    );
}

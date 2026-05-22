"use client";

import React, { useState } from "react";
import { MapPin, Calendar, Wallet, Send, ChevronRight, Loader2, Save, Wand2, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { travelService } from "@/lib/services";
import { useRouter } from "next/navigation";

interface AIResponse {
  tripTitle: string;
  description: string;
  itinerary: {
    day: number;
    title: string;
    activities: {
      time: string;
      activity: string;
      location: string;
      estimatedCost?: string;
    }[];
  }[];
  budgetBreakdown: {
    accommodation: string;
    food: string;
    activities: string;
    total: string;
  };
  tips: string[];
}

export default function AITripPlanner() {
  const { user } = useAuth();
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [preferences, setPreferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;

    setLoading(true);
    setResult(null);
    setSaved(false);

    try {
      const response = await fetch("/api/ai-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, startDate, endDate, budget, preferences }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (error) {
      console.error("AI Generation failed:", error);
      window.alert("Error al generar tu viaje. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user) return;
    
    setSaving(true);
    try {
      // 1. Create the trip
      const sDate = startDate ? new Date(startDate) : undefined;
      const eDate = endDate ? new Date(endDate) : undefined;
      
      const tripId = await travelService.createTrip(
        user.uid,
        result.tripTitle,
        sDate,
        eDate
      );

      // 2. Add description to trip
      await travelService.updateTrip(tripId, {
        description: result.description
      });

      // 3. Add activities from itinerary
      // We process each day
      for (const day of result.itinerary) {
        // We can use the start date + day number - 1 as the activity date
        const activityDate = sDate ? new Date(sDate) : new Date();
        activityDate.setDate(activityDate.getDate() + (day.day - 1));
        
        for (const act of day.activities) {
          await travelService.addActivity({
            tripId,
            title: act.activity,
            location: act.location,
            startDate: activityDate,
            category: 'other', // Default category
            notes: `Hora estimada: ${act.time}. Costo: ${act.estimatedCost || 'N/A'}`
          });
        }
      }

      setSaved(true);
      setTimeout(() => {
        router.push(`/trip/${tripId}`);
      }, 1500);
    } catch (error) {
      console.error("Error saving trip:", error);
      window.alert("Error al guardar el viaje. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 px-2">
      <div className="text-center space-y-3 mb-10">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
          <Wand2 size={28} className="text-white" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Planner con <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">IA</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto text-sm leading-relaxed">
          Dime a dónde quieres ir y yo armaré tu viaje ideal con inteligencia artificial.
        </p>
      </div>

      {!result ? (
        <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-900 backdrop-blur-xl p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none space-y-5">
          <div className="space-y-5">
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={20} />
              <input
                type="text"
                placeholder="¿A dónde quieres ir?"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="date"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-slate-100 text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="date"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-slate-100 text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="relative group">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Presupuesto aprox. (ej: $1500)"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>

            <textarea
              placeholder="Preferencias (ej. sin museos, mucho caminar...)"
              className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold placeholder:text-slate-400 text-slate-900 dark:text-slate-100 min-h-[100px] resize-none"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !destination}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 hover:from-blue-600 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Generando tu viaje...</span>
              </>
            ) : (
              <>
                <Wand2 size={20} />
                <span>Generar Itinerario con IA</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-6 pb-24 animate-in fade-in duration-500">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-8 rounded-3xl shadow-xl shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-3">{result.tripTitle}</h3>
              <p className="text-white/90 text-sm leading-relaxed mb-6">{result.description}</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleSave}
                  disabled={saving || saved}
                  className="flex-1 py-3 bg-white text-blue-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-all disabled:opacity-80 shadow-lg"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : saved ? (
                    <Check size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  {saved ? "¡Guardado!" : saving ? "Guardando..." : "Guardar Viaje"}
                </button>
                <button 
                  onClick={() => setResult(null)}
                  className="px-5 py-3 bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold hover:bg-white/30 transition-all"
                >
                  Nuevo
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-bold px-2 text-slate-800 dark:text-slate-200">Itinerario Paso a Paso</h4>
            {result.itinerary.map((day) => (
              <div key={day.day} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex items-center justify-center font-bold text-sm">
                    {day.day}
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-slate-100">{day.title}</h5>
                </div>

                <div className="space-y-4 pl-3">
                  {day.activities.map((act, i) => (
                    <div key={i} className="relative pl-5 border-l-2 border-slate-100 dark:border-slate-800 last:border-0 pb-2">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{act.time}</div>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{act.activity}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin size={12} />
                        <span>{act.location}</span>
                        {act.estimatedCost && (
                          <span className="ml-2 font-medium text-slate-400">• {act.estimatedCost}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
             <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
               <Wallet size={18} className="text-slate-400" />
               Desglose de Presupuesto
             </h4>
             <div className="grid grid-cols-2 gap-3">
               {Object.entries(result.budgetBreakdown).map(([key, val]) => (
                 <div key={key} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                   <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">{key === 'accommodation' ? 'Alojamiento' : key === 'food' ? 'Comida' : key === 'activities' ? 'Actividades' : 'Total'}</div>
                   <div className="font-bold text-slate-900 dark:text-slate-100">{val}</div>
                 </div>
               ))}
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
             <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
               <Wand2 size={18} className="text-slate-400" />
               Consejos de la IA
             </h4>
             <ul className="space-y-2">
               {result.tips.map((tip, i) => (
                 <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                   <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0"></div>
                   {tip}
                 </li>
               ))}
             </ul>
          </div>
        </div>
      )}
    </div>
  );
}

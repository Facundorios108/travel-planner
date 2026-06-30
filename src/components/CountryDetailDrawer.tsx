"use client";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";


import React, { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { geoCentroid, geoBounds } from "d3-geo";
import { X, Check, Home, Bookmark, Calendar, Briefcase, Trash2, CalendarDays, Plus } from "lucide-react";
import { CountryMetadata } from "@/utils/countriesData";
import { Trip } from "@/types/travel";

const geoUrl = "/world-countries.json";

const PASTEL_COLORS = [
  "#bbf7d0", // Emerald Green
  "#fef08a", // Soft Yellow
  "#fbcfe8", // Bubblegum Pink
  "#bfdbfe", // Sky Blue
  "#c084fc", // Lavender Purple
  "#fed7aa", // Peach Orange
  "#fca5a5", // Coral Red
  "#cbd5e1", // Slate Gray
];

interface CountryDetailDrawerProps {
  countryId: string; // ISO numeric code string
  englishName: string;
  metadata: CountryMetadata | undefined;
  trips: Trip[];
  existingRecord: {
    status: "visited" | "want_to_go" | "lived";
    color?: string;
    dates?: { startDate: string; endDate?: string }[];
    tripId?: string;
  } | null;
  onClose: () => void;
  onSave: (record: {
    status: "visited" | "want_to_go" | "lived";
    color?: string;
    dates?: { startDate: string; endDate?: string }[];
    tripId?: string;
  }) => void;
  onDelete: () => void;
}

export default function CountryDetailDrawer({
  countryId,
  englishName,
  metadata,
  trips,
  existingRecord,
  onClose,
  onSave,
  onDelete,
}: CountryDetailDrawerProps) {
  const [status, setStatus] = useState<"visited" | "want_to_go" | "lived">("visited");
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [linkedTripId, setLinkedTripId] = useState("");
  const [isAddingDates, setIsAddingDates] = useState(false);
  const [savedDates, setSavedDates] = useState<{ startDate: string; endDate?: string }[]>([]);

  // Bounding box calculations for SVG centering
  const [projectionConfig, setProjectionConfig] = useState<{
    center: [number, number];
    scale: number;
  } | null>(null);

  useEffect(() => {
    if (existingRecord) {
      setStatus(existingRecord.status);
      setSelectedColor(existingRecord.color || PASTEL_COLORS[0]);
      setLinkedTripId(existingRecord.tripId || "");
      setSavedDates(existingRecord.dates || []);
    } else {
      setStatus("visited");
      setSelectedColor(PASTEL_COLORS[0]);
      setLinkedTripId("");
      setSavedDates([]);
    }
    setIsAddingDates(false);
    setStartDate("");
    setEndDate("");
  }, [existingRecord, countryId]);

  const handleStatusChange = (newStatus: "visited" | "want_to_go" | "lived") => {
    setStatus(newStatus);
    // Auto color adjust if needed
    if (newStatus === "lived") {
      setSelectedColor("#fca5a5"); // Coral
    } else if (newStatus === "want_to_go") {
      setSelectedColor("#c084fc"); // Purple/Indigo
    } else {
      setSelectedColor(existingRecord?.color || PASTEL_COLORS[0]);
    }
  };

  const handleAddDates = () => {
    if (!startDate) return;
    setSavedDates([...savedDates, { startDate, endDate: endDate || undefined }]);
    setStartDate("");
    setEndDate("");
    setIsAddingDates(false);
  };

  const handleRemoveDate = (index: number) => {
    setSavedDates(savedDates.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      status,
      color: status === "visited" ? selectedColor : undefined,
      dates: savedDates,
      tripId: linkedTripId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Drawer content */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:fade-in duration-300 flex flex-col max-h-[85vh] z-10">
        
        {/* Drag handle line on mobile */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto my-3 block sm:hidden"></div>

        {/* Header */}
        <div className="flex justify-between items-center px-6 pb-2 pt-2 sm:pt-6">
          <div>
            <span className="text-3xl mr-2">{metadata?.flag || "🏳️"}</span>
            <span className="text-2xl font-black tracking-tight dark:text-white">
              {metadata?.spanishName || englishName}
            </span>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
              {englishName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Mini country map outline (centered and auto-zoomed!) */}
          <div className="w-full h-44 bg-slate-50 dark:bg-slate-950 rounded-2xl relative flex items-center justify-center border border-slate-150 dark:border-slate-800/40 overflow-hidden shadow-inner">
            <ComposableMap
              projection="geoMercator"
              className="w-full h-full"
            >
              <Geographies geography={geoUrl}>
                {({ geographies }: { geographies: any[] }) => {
                  const countryGeo = geographies.find((g: any) => g.id === countryId);
                  
                  if (!countryGeo) return null;

                  // Compute configuration once dynamically
                  let center: [number, number] = [0, 0];
                  let scale = 100;
                  try {
                    center = geoCentroid(countryGeo) as [number, number];
                    const bounds = geoBounds(countryGeo);
                    const dx = bounds[1][0] - bounds[0][0];
                    const dy = bounds[1][1] - bounds[0][1];
                    const maxDim = Math.max(Math.abs(dx), Math.abs(dy));
                    scale = Math.min(220, 190 / (maxDim || 1)) * 3;
                  } catch (e) {
                    console.error("Centroid error", e);
                  }

                  return (
                    <Geography
                      geography={countryGeo}
                      // Apply D3 centering configuration programmatically on this specific Geography projection
                      center={center}
                      style={{
                        default: {
                          fill: status === "visited" ? selectedColor : (status === "lived" ? "#fca5a5" : "#c084fc"),
                          stroke: "#475569",
                          strokeWidth: 1.5,
                          outline: "none",
                        },
                      }}
                    />
                  );
                }}
              </Geographies>
            </ComposableMap>

            {/* Glowing ambient ring */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none opacity-10 blur-2xl"
              style={{ backgroundColor: status === "visited" ? selectedColor : (status === "lived" ? "#fca5a5" : "#c084fc") }}
            ></div>
          </div>

          {/* Quick status selection buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleStatusChange("visited")}
              className={`flex flex-col items-center justify-center gap-1.5 py-3.5 px-3 rounded-2xl border text-xs font-bold transition-all duration-200 active:scale-95 ${
                status === "visited"
                  ? "bg-slate-900 border-transparent text-white dark:bg-white dark:text-slate-900 shadow-md"
                  : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              }`}
            >
              <Check size={18} strokeWidth={2.5} />
              Visitado
            </button>
            <button
              onClick={() => handleStatusChange("lived")}
              className={`flex flex-col items-center justify-center gap-1.5 py-3.5 px-3 rounded-2xl border text-xs font-bold transition-all duration-200 active:scale-95 ${
                status === "lived"
                  ? "bg-rose-500 border-transparent text-white shadow-md shadow-rose-500/20"
                  : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              }`}
            >
              <Home size={18} />
              Viví
            </button>
            <button
              onClick={() => handleStatusChange("want_to_go")}
              className={`flex flex-col items-center justify-center gap-1.5 py-3.5 px-3 rounded-2xl border text-xs font-bold transition-all duration-200 active:scale-95 ${
                status === "want_to_go"
                  ? "bg-indigo-500 border-transparent text-white shadow-md shadow-indigo-500/20"
                  : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              }`}
            >
              <Bookmark size={18} />
              Quiero ir
            </button>
          </div>

          {/* Color palette picker (only for Visited status) */}
          {status === "visited" && (
            <div className="space-y-3">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Pintar mapa con color
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {PASTEL_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-9 h-9 rounded-full relative transition-transform hover:scale-110 active:scale-90 shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center`}
                  >
                    {selectedColor === color && (
                      <div className="w-3.5 h-3.5 bg-slate-900/70 dark:bg-white/70 rounded-full flex items-center justify-center text-white dark:text-slate-900">
                        <Check size={8} strokeWidth={4} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dates Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Fechas de Visita
              </label>
              {!isAddingDates && (
                <button
                  onClick={() => setIsAddingDates(true)}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 hover:text-emerald-600"
                >
                  <Plus size={14} />
                  Añadir fechas
                </button>
              )}
            </div>

            {/* List of existing dates */}
            {savedDates.length > 0 && (
              <div className="space-y-2">
                {savedDates.map((date, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <CalendarDays size={14} className="text-slate-400" />
                      <span>{date.startDate}</span>
                      {date.endDate && (
                        <>
                          <span>➔</span>
                          <span>{date.endDate}</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveDate(index)}
                      className="text-rose-500 hover:text-rose-600 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Date Fields */}
            {isAddingDates && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-3 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Llegada</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Salida (Opcional)</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    onClick={() => setIsAddingDates(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-500 rounded-lg border hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddDates}
                    disabled={!startDate}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-500 disabled:opacity-50 rounded-lg shadow shadow-emerald-500/20"
                  >
                    Añadir
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Linked Trip Selector */}
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Vincular a viaje planificado
            </label>
            <div className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-850">
              <Briefcase size={16} className="text-slate-400 shrink-0" />
              <select
                value={linkedTripId}
                onChange={(e) => setLinkedTripId(e.target.value)}
                className="w-full bg-transparent text-sm font-bold focus:outline-none text-slate-900 dark:text-white"
              >
                <option value="">Ningún viaje vinculado</option>
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex gap-3.5 bg-white dark:bg-slate-900 select-none">
          {existingRecord && (
            <button
              onClick={onDelete}
              className="px-4 py-4 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors"
              title="Borrar Registro"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
          >
            Guardar en Pasaporte
          </button>
        </div>
      </div>
    </div>
  );
}

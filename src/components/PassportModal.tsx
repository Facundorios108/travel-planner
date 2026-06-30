"use client";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";


import React, { useState } from "react";
import { X, ChevronRight } from "lucide-react";
import { CountryMetadata } from "@/utils/countriesData";

interface PassportCountry {
  countryCode: string;
  status: "visited" | "want_to_go" | "lived";
  color?: string;
  dates?: { startDate: string; endDate?: string }[];
  tripId?: string;
}

interface PassportModalProps {
  passportCountries: Record<string, PassportCountry>;
  countriesLookup: Record<string, CountryMetadata>;
  onClose: () => void;
  onEditCountry: (countryId: string, englishName: string) => void;
}

export default function PassportModal({
  passportCountries,
  countriesLookup,
  onClose,
  onEditCountry,
}: PassportModalProps) {
  const [activeSegment, setActiveSegment] = useState<"visited" | "want_to_go" | "lived">("visited");

  const countriesList = Object.values(passportCountries).filter(
    (c) => c.status === activeSegment
  );

  const getCountryYearGroups = () => {
    const groups: Record<string, { country: PassportCountry; meta: CountryMetadata }[]> = {};

    countriesList.forEach((c) => {
      const meta = countriesLookup[c.countryCode];
      if (!meta) return;

      if (c.dates && c.dates.length > 0) {
        // Group by the year of the most recent start date
        const sortedDates = [...c.dates].sort((a, b) => b.startDate.localeCompare(a.startDate));
        const recentDate = sortedDates[0];
        const year = recentDate.startDate.split("-")[0] || "Sin fecha";
        if (!groups[year]) groups[year] = [];
        groups[year].push({ country: c, meta });
      } else {
        if (!groups["Sin fecha"]) groups["Sin fecha"] = [];
        groups["Sin fecha"].push({ country: c, meta });
      }
    });

    // Sort years descending, but keep "Sin fecha" at the top or bottom. Let's put "Sin fecha" at the top like in the screenshot
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Sin fecha") return -1;
      if (b === "Sin fecha") return 1;
      return b.localeCompare(a);
    });

    return { sortedKeys, groups };
  };

  const { sortedKeys, groups } = getCountryYearGroups();

  const countByStatus = (status: "visited" | "want_to_go" | "lived") => {
    return Object.values(passportCountries).filter((c) => c.status === status).length;
  };

  const getStatusDotColor = (c: PassportCountry) => {
    if (c.status === "lived") return "#fca5a5"; // Coral
    if (c.status === "want_to_go") return "#c084fc"; // Lavender/Indigo
    return c.color || "#86efac"; // User selected color or default green
  };

  const formatDateRange = (dates?: { startDate: string; endDate?: string }[]) => {
    if (!dates || dates.length === 0) return "Sin fecha";
    // Sort dates
    const sorted = [...dates].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const recent = sorted[0];
    if (recent.endDate) {
      return `${recent.startDate} / ${recent.endDate}`;
    }
    return recent.startDate;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/40 dark:bg-black/50 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="bg-slate-100 dark:bg-slate-950 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:fade-in duration-300 flex flex-col h-[90vh] sm:h-[80vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800/50">
          <button onClick={onClose} className="text-slate-400 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X size={20} />
          </button>
          <h3 className="text-base font-extrabold tracking-tight dark:text-white">
            Mi pasaporte de viaje
          </h3>
          <button
            onClick={onClose}
            className="text-slate-900 dark:text-white font-extrabold text-sm hover:underline"
          >
            Hecho
          </button>
        </div>

        {/* Status Segments */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200/40 dark:border-slate-800/40">
          <div className="flex bg-slate-100 dark:bg-slate-950 rounded-2xl p-1.5 justify-between">
            {(["visited", "want_to_go", "lived"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSegment(tab)}
                className={`flex-1 py-3 px-1 text-xs font-black rounded-xl text-center transition-all duration-200 ${
                  activeSegment === tab
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-450 dark:text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab === "visited" && `Visitado ${countByStatus("visited")}`}
                {tab === "want_to_go" && `Quiero ir ${countByStatus("want_to_go") || ""}`}
                {tab === "lived" && `Viví ${countByStatus("lived") || ""}`}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {countriesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 dark:text-slate-650">
              <span className="text-4xl mb-3">🛂</span>
              <p className="text-sm font-bold">Aún no tienes registros aquí.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Toca países en el mapa para colorearlos y sumarlos a tu pasaporte.</p>
            </div>
          ) : (
            sortedKeys.map((key) => (
              <div key={key} className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">
                  {key}
                </h4>
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/30 dark:border-slate-800/30 overflow-hidden shadow-sm">
                  {groups[key].map(({ country, meta }, index) => (
                    <div
                      key={country.countryCode}
                      onClick={() => onEditCountry(country.countryCode, meta.name)}
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 active:scale-[0.99] transition-all ${
                        index < groups[key].length - 1 ? "border-b border-slate-100 dark:border-slate-800/50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="text-2xl leading-none">{meta.flag}</span>
                        <div>
                          <span className="block font-black text-sm text-slate-900 dark:text-white leading-snug">
                            {meta.spanishName}
                          </span>
                          <span className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase mt-0.5 tracking-wide">
                            {formatDateRange(country.dates)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white dark:border-slate-950 shadow-sm shrink-0"
                          style={{ backgroundColor: getStatusDotColor(country) }}
                        ></div>
                        <ChevronRight size={16} className="text-slate-350 dark:text-slate-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

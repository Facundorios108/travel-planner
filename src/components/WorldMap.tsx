"use client";

import React, { useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { CountryMetadata } from "@/utils/countriesData";

// Path to TopoJSON in the public folder
const geoUrl = "/world-countries.json";

interface WorldMapProps {
  passportCountries: Record<string, { status: string; color?: string }>;
  countriesLookup: Record<string, CountryMetadata>;
  onSelectCountry: (countryId: string, englishName: string) => void;
}

export default function WorldMap({
  passportCountries,
  countriesLookup,
  onSelectCountry,
}: WorldMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<{ flag: string; spanishName: string } | null>(null);

  const [position, setPosition] = useState({ center: [0, 0] as [number, number], zoom: 1 });

  const handleMoveEnd = (newPosition: { center: [number, number]; zoom: number }) => {
    setPosition(newPosition);
  };

  const getCountryColor = (geoId: string) => {
    const record = passportCountries[geoId];
    if (!record) return ""; // No status

    if (record.status === "visited") {
      return record.color || "#4ade80"; // Default green for visited
    }
    if (record.status === "lived") {
      return "#f43f5e"; // Rose for Lived
    }
    if (record.status === "want_to_go") {
      return "#6366f1"; // Indigo for Want to go
    }
    return "";
  };

  return (
    <div 
      className="relative w-full h-[320px] bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] overflow-hidden shadow-inner animate-in fade-in zoom-in-95 duration-500 select-none"
      style={{ touchAction: 'none' }}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 110 }}
        className="w-full h-full"
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.center}
          onMoveEnd={handleMoveEnd}
          maxZoom={8}
          minZoom={1}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const geoId = geo.id; // ISO numeric code string (e.g. "032")
                const englishName = geo.properties?.name || "";
                const isSelected = !!passportCountries[geoId];
                const countryColor = getCountryColor(geoId);

                // Default fill colors based on theme
                const defaultFill = countryColor || "#e2e8f0"; // Light gray
                const defaultStroke = "#ffffff";
                const darkDefaultFill = countryColor || "#1e293b"; // Dark slate
                const darkDefaultStroke = "#0f172a";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => onSelectCountry(geoId, englishName)}
                    onMouseEnter={() => {
                      const meta = countriesLookup[geoId];
                      if (meta) {
                        setHoveredCountry({ flag: meta.flag, spanishName: meta.spanishName });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredCountry(null);
                    }}
                    className="transition-colors duration-200 focus:outline-none"
                    style={{
                      default: {
                        fill: typeof window !== "undefined" && document.documentElement.classList.contains("dark")
                          ? darkDefaultFill
                          : defaultFill,
                        stroke: typeof window !== "undefined" && document.documentElement.classList.contains("dark")
                          ? darkDefaultStroke
                          : defaultStroke,
                        strokeWidth: 0.5,
                        outline: "none",
                      },
                      hover: {
                        fill: countryColor ? countryColor : "#94a3b8",
                        stroke: "#64748b",
                        strokeWidth: 1,
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: {
                        fill: "#475569",
                        stroke: "#334155",
                        strokeWidth: 1,
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Floating Instructions */}
      <div className="absolute top-4 left-4 bg-slate-900/60 dark:bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wider shadow pointer-events-none">
        🗺️ Arrastra y haz zoom en el mapa
      </div>

      {/* Floating Hovered Country Info */}
      {hoveredCountry && (
        <div className="absolute top-4 right-4 bg-slate-900/90 dark:bg-black/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black text-white flex items-center gap-2 shadow border border-slate-700/30 pointer-events-none z-20 animate-in fade-in zoom-in-95 duration-100">
          <span className="text-sm">{hoveredCountry.flag}</span>
          <span>{hoveredCountry.spanishName}</span>
        </div>
      )}
    </div>
  );
}

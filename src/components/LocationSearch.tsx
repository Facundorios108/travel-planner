"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, MapPin } from "lucide-react";

interface SearchResult {
    place_id: string;
    display_name: string;
    city: string;
    country: string;
}

interface LocationSearchProps {
    placeholder: string;
    value: string;
    onSelect: (locationInfo: { country: string; city: string }) => void;
    required?: boolean;
    className?: string;
}

export default function LocationSearch({ placeholder, value, onSelect, required = true, className }: LocationSearchProps) {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchLocations = async () => {
            if (query.length < 3) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                // Usando Komoot Photon API (basada en OpenStreetMap, optimizada para autocomplete)
                // Con bias de ubicación para Buenos Aires, Argentina para favorecer búsquedas locales precisas.
                const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lat=-34.6037&lon=-58.3816`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data && data.features) {
                    const formatted = data.features.map((feature: any) => {
                        const props = feature.properties;
                        const name = props.name || "";
                        const street = props.street ? `${props.street}${props.housenumber ? " " + props.housenumber : ""}` : "";
                        const city = props.city || props.town || props.village || "";
                        const state = props.state || "";
                        const country = props.country || "";

                        const parts = [];
                        // Si el nombre de la propiedad no es idéntico a otros datos geográficos, lo agregamos al inicio
                        if (name && name !== street && name !== city && name !== state && name !== country) {
                            parts.push(name);
                        }
                        if (street) parts.push(street);
                        if (city) parts.push(city);
                        if (state && state !== city) parts.push(state);
                        if (country) parts.push(country);

                        const displayName = parts.join(", ");

                        return {
                            place_id: `${props.osm_type || "N"}-${props.osm_id}`,
                            display_name: displayName,
                            city: city || name || "Lugar",
                            country: country
                        };
                    });
                    setResults(formatted);
                } else {
                    setResults([]);
                }
                setIsOpen(true);
            } catch (error) {
                console.error("Error fetching locations:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            // Solo buscar si el input fue editado por el usuario, no por selección
            if (query !== value) {
                fetchLocations();
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [query, value]);

    const handleSelect = (result: SearchResult) => {
        setQuery(result.display_name);
        setIsOpen(false);
        onSelect({ city: result.city, country: result.country });
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <input
                type="text"
                required={required}
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => {
                    if (results.length > 0) setIsOpen(true);
                }}
                placeholder={placeholder}
                className={className || "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium rounded-xl outline-none border border-transparent focus:border-slate-200 dark:focus:border-slate-700 transition-colors"}
            />
            {loading && (
                <div className="absolute right-3 top-3.5 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                </div>
            )}

            {/* Dropdown de resultados */}
            {isOpen && results.length > 0 && (
                <div className="absolute left-0 w-full mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 z-50 max-h-60 overflow-y-auto">
                    {results.map((result) => (
                        <button
                            key={result.place_id}
                            type="button"
                            onClick={() => handleSelect(result)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-3 transition-colors border-b last:border-0 border-slate-100 dark:border-slate-800"
                        >
                            <MapPin className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                                    {result.display_name.split(",")[0]}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                    {result.display_name}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

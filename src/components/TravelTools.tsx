"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Trip, Destination } from "@/types/travel";
import { travelService } from "@/lib/services";
import { ConfirmDialog } from "./ConfirmDialog";
import { Toast, useToast } from "./Toast";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { hapticFeedback } from "@/utils/haptics";
import {
    Briefcase, CheckSquare, Square, Plus, Trash2,
    Sparkles, RefreshCw, DollarSign, CloudSun,
    MapPin, Clock, CheckCircle, Archive, PlusCircle,
    Loader2, CloudRain, Cloud, Sun, CloudSnow, CloudLightning,
    Wind, Droplets, Thermometer, Globe, ArrowRightLeft
} from "lucide-react";

interface PackingItem {
    id: string;
    text: string;
    checked: boolean;
    category: string;
}

interface PackingData {
    items: PackingItem[];
    activeProfile: string;
    isFinalized: boolean;
    finalizedAt?: string;
}

interface WeatherDay {
    date: string;
    tempMax: number;
    tempMin: number;
    weatherCode: number;
}

interface WeatherData {
    current: {
        temp: number;
        humidity: number;
        windSpeed: number;
        weatherCode: number;
    };
    daily: WeatherDay[];
    timezone: string;
    cityName: string;
    fetchedAt: number;
}

interface CurrencyRates {
    rates: Record<string, number>;
    base: string;
    lastUpdate: string;
    fetchedAt: number;
}

interface TravelToolsProps {
    trips: Trip[];
}

const DEFAULT_PROFILES: Record<string, Record<string, string[]>> = {
    playa: {
        Ropa: ["Malla / Bañador", "Remeras / Camisetas", "Bermudas / Shorts", "Gorra / Sombrero", "Lentes de sol", "Sandalias / Ojotas"],
        Aseo: ["Protector solar", "Crema hidratante", "Repelente de insectos", "Cepillo de dientes", "Shampoo y acondicionador"],
        Tecnología: ["Cargador de celular", "Auriculares", "Parlante bluetooth", "Powerbank"],
        Documentos: ["Pasaporte / DNI", "Reserva de hotel", "Pasajes aéreos", "Seguro de viaje"],
        Otros: ["Lona / Toalla de playa", "Botella de agua térmica", "Bolso impermeable"]
    },
    frio: {
        Ropa: ["Campera abrigada / Térmica", "Guantes de abrigo", "Gorro de lana", "Bufanda / Cuello", "Calzas / Camiseta térmica", "Medias gruesas"],
        Aseo: ["Protector labial (manteca cacao)", "Crema para manos", "Cepillo de dientes", "Desodorante"],
        Tecnología: ["Cargador de celular", "Cámara de fotos", "Pilas/baterías de repuesto (se gastan rápido en frío)"],
        Documentos: ["Pasaporte / DNI", "Seguro médico de montaña", "Reservas impresas"],
        Otros: ["Termo para mate/café", "Calentadores de manos", "Botiquín básico"]
    },
    aventura: {
        Ropa: ["Zapatillas de trekking", "Pantalón desmontable", "Campera rompeviento", "Remeras deportivas (dry-fit)", "Gorra / Sombrero"],
        Aseo: ["Jabón biodegradable", "Toallitas húmedas", "Repelente fuerte", "Protector solar", "Cepillo de dientes"],
        Tecnología: ["Linterna de cabeza", "Powerbank de alta capacidad", "GPS / Brújula", "Cargador solar"],
        Documentos: ["Pasaporte / DNI", "Permisos de parques/senderismo", "Mapa físico"],
        Otros: ["Navaja multiuso", "Mochila de ataque", "Pastillas potabilizadoras", "Cinta de embalar / Duct tape"]
    },
    ciudad: {
        Ropa: ["Saco / Blazer", "Zapatos cómodos para caminar", "Jeans casuales", "Camisas / Blusas", "Paraguas piloto / Piloto"],
        Aseo: ["Perfume", "Maquillaje / Cera para pelo", "Cepillo de dientes", "Kit de afeitado"],
        Tecnología: ["Cargador de celular y laptop", "Adaptador de enchufe internacional", "Auriculares con cancelación de ruido"],
        Documentos: ["Pasaporte / DNI", "Tarjetas de crédito de respaldo", "Pase de transporte público / Metrocard"],
        Otros: ["Guía turística digital", "Bolsa de compras plegable", "Antifaz para dormir"]
    }
};

const CURRENCIES = [
    { code: "USD", name: "Dólar Estadounidense", flag: "🇺🇸" },
    { code: "EUR", name: "Euro", flag: "🇪🇺" },
    { code: "GBP", name: "Libra Esterlina", flag: "🇬🇧" },
    { code: "BRL", name: "Real Brasileño", flag: "🇧🇷" },
    { code: "ARS", name: "Peso Argentino", flag: "🇦🇷" },
    { code: "CLP", name: "Peso Chileno", flag: "🇨🇱" },
    { code: "MXN", name: "Peso Mexicano", flag: "🇲🇽" },
    { code: "COP", name: "Peso Colombiano", flag: "🇨🇴" },
    { code: "PEN", name: "Sol Peruano", flag: "🇵🇪" },
    { code: "UYU", name: "Peso Uruguayo", flag: "🇺🇾" },
    { code: "JPY", name: "Yen Japonés", flag: "🇯🇵" },
];

function getWeatherIcon(code: number, size = 24) {
    if (code === 0 || code === 1) return <Sun size={size} className="text-amber-400" />;
    if (code === 2 || code === 3) return <Cloud size={size} className="text-slate-400" />;
    if (code >= 45 && code <= 48) return <Cloud size={size} className="text-slate-500" />;
    if (code >= 51 && code <= 67) return <CloudRain size={size} className="text-blue-400" />;
    if (code >= 71 && code <= 77) return <CloudSnow size={size} className="text-sky-300" />;
    if (code >= 80 && code <= 82) return <CloudRain size={size} className="text-blue-500" />;
    if (code >= 85 && code <= 86) return <CloudSnow size={size} className="text-sky-400" />;
    if (code >= 95) return <CloudLightning size={size} className="text-yellow-500" />;
    return <CloudSun size={size} className="text-amber-300" />;
}

function getWeatherLabel(code: number): string {
    if (code === 0) return "Despejado";
    if (code === 1) return "Mayormente despejado";
    if (code === 2) return "Parcialmente nublado";
    if (code === 3) return "Nublado";
    if (code >= 45 && code <= 48) return "Neblina";
    if (code >= 51 && code <= 55) return "Llovizna";
    if (code >= 56 && code <= 57) return "Llovizna helada";
    if (code >= 61 && code <= 65) return "Lluvia";
    if (code >= 66 && code <= 67) return "Lluvia helada";
    if (code >= 71 && code <= 75) return "Nieve";
    if (code === 77) return "Granizo";
    if (code >= 80 && code <= 82) return "Chaparrones";
    if (code >= 85 && code <= 86) return "Chaparrones de nieve";
    if (code >= 95) return "Tormenta eléctrica";
    return "Variable";
}

function formatDayName(dateStr: string): string {
    const date = new Date(dateStr + "T12:00:00");
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    return days[date.getDay()];
}

function formatDayMonth(dateStr: string): string {
    const date = new Date(dateStr + "T12:00:00");
    return `${date.getDate()}/${date.getMonth() + 1}`;
}

interface PackingListItemProps {
    item: PackingItem;
    isFinalized: boolean;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

function PackingListItem({ item, isFinalized, onToggle, onDelete }: PackingListItemProps) {
    const { swipeOffset, isSwiping, onTouchStart, onTouchMove, onTouchEnd, resetSwipe } = useSwipeGesture({ threshold: 75 });

    return (
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 first:rounded-t-3xl last:rounded-b-3xl">
            {/* Background Action (revealed on swipe) */}
            <div 
                onClick={(e) => {
                    e.stopPropagation();
                    hapticFeedback.medium();
                    onDelete(item.id);
                }}
                className="absolute inset-y-0 right-0 w-[75px] bg-red-500 dark:bg-red-600 flex items-center justify-center text-white cursor-pointer active:bg-red-600 dark:active:bg-red-700 transition-colors"
            >
                <Trash2 size={18} className="animate-in fade-in zoom-in duration-200" />
            </div>

            {/* Main Item Container */}
            <div
                onTouchStart={!isFinalized ? onTouchStart : undefined}
                onTouchMove={!isFinalized ? onTouchMove : undefined}
                onTouchEnd={!isFinalized ? onTouchEnd : undefined}
                onClick={() => {
                    if (swipeOffset !== 0) {
                        resetSwipe();
                    } else if (!isFinalized) {
                        onToggle(item.id);
                    }
                }}
                style={{
                    transform: `translateX(${swipeOffset}px)`,
                    transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Spring physics
                }}
                className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/50 last:border-0 transition-colors group cursor-pointer select-none"
            >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className={`shrink-0 transition-colors ${item.checked ? "text-indigo-500" : "text-slate-400"}`}>
                        {item.checked ? (
                            <CheckSquare size={20} strokeWidth={2.5} />
                        ) : (
                            <Square size={20} strokeWidth={2} />
                        )}
                    </div>
                    <span className={`text-sm truncate select-none transition-all ${item.checked ? "text-slate-400 line-through decoration-indigo-400" : "text-slate-800 dark:text-slate-200 font-medium"}`}>
                        {item.text}
                    </span>
                </div>
                {!isFinalized && (
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            hapticFeedback.medium();
                            onDelete(item.id);
                        }}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition"
                    >
                        <Trash2 size={15} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TravelTools({ trips }: TravelToolsProps) {
    const { user } = useAuth();
    const { showToast, ToastComponent } = useToast();
    const [subTab, setSubTab] = useState<"packing" | "destination" | "currency">("packing");

    // ─── Packing States ───
    const [packingList, setPackingList] = useState<PackingItem[]>([]);
    const [newItemText, setNewItemText] = useState("");
    const [newItemCategory, setNewItemCategory] = useState("Ropa");
    const [activeProfile, setActiveProfile] = useState<string>("");
    const [selectedTripId, setSelectedTripId] = useState<string>("");
    const [isFinalized, setIsFinalized] = useState(false);
    const [finalizedAt, setFinalizedAt] = useState<string>("");

    // ─── Weather/Timezone States ───
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [destinationTime, setDestinationTime] = useState<string>("");
    const [localTime, setLocalTime] = useState<string>("");
    const [timeDiff, setTimeDiff] = useState<string>("");
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [destinationsLoading, setDestinationsLoading] = useState(false);

    // ─── Currency States ───
    const [currencyRates, setCurrencyRates] = useState<CurrencyRates | null>(null);
    const [currencyLoading, setCurrencyLoading] = useState(false);
    const [baseCurrency, setBaseCurrency] = useState("USD");
    const [currencyAmount, setCurrencyAmount] = useState<string>("100");

    // ─── Confirm Dialog State ───
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title?: string;
        message: string;
        variant?: "danger" | "warning" | "info";
        onConfirm: () => void;
    }>({ isOpen: false, message: "", onConfirm: () => {} });

    // ─── Extract all destination cities from trips ───
    const allCities = useMemo(() => {
        const cities: { city: string; tripName: string }[] = [];
        trips.forEach(trip => {
            if (trip.destination) {
                // destination might be "City, Country" or just a city
                const cityName = trip.destination.split(",")[0].trim();
                if (cityName) cities.push({ city: cityName, tripName: trip.name });
            }
        });
        return cities;
    }, [trips]);

    // ═══════════════════════════════════════════════
    // PACKING LIST LOGIC
    // ═══════════════════════════════════════════════

    // Auto-select first trip
    useEffect(() => {
        if (trips.length > 0 && !selectedTripId) {
            setSelectedTripId(trips[0].id);
        }
    }, [trips, selectedTripId]);

    // Load packing list when trip changes
    useEffect(() => {
        if (!user || !selectedTripId) return;
        const key = `stayfinder_packing_${user.uid}_${selectedTripId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                const data: PackingData = JSON.parse(stored);
                setPackingList(data.items || []);
                setActiveProfile(data.activeProfile || "");
                setIsFinalized(data.isFinalized || false);
                setFinalizedAt(data.finalizedAt || "");
            } catch {
                setPackingList([]);
                setActiveProfile("");
                setIsFinalized(false);
                setFinalizedAt("");
            }
        } else {
            setPackingList([]);
            setActiveProfile("");
            setIsFinalized(false);
            setFinalizedAt("");
        }
    }, [user, selectedTripId]);

    const saveList = useCallback((list: PackingItem[], profile?: string, finalized?: boolean, finAt?: string) => {
        setPackingList(list);
        if (profile !== undefined) setActiveProfile(profile);
        const fin = finalized !== undefined ? finalized : isFinalized;
        const fat = finAt !== undefined ? finAt : finalizedAt;
        if (finalized !== undefined) setIsFinalized(fin);
        if (finAt !== undefined) setFinalizedAt(fat);

        if (user && selectedTripId) {
            const data: PackingData = {
                items: list,
                activeProfile: profile !== undefined ? profile : activeProfile,
                isFinalized: fin,
                finalizedAt: fat,
            };
            localStorage.setItem(`stayfinder_packing_${user.uid}_${selectedTripId}`, JSON.stringify(data));
        }
    }, [user, selectedTripId, activeProfile, isFinalized, finalizedAt]);

    const applyProfilePreset = (profileKey: string) => {
        if (packingList.length > 0) {
            setConfirmDialog({
                isOpen: true,
                title: "Cambiar perfil de equipaje",
                message: "¿Deseas reemplazar tu lista actual con el nuevo perfil de equipaje?",
                variant: "warning",
                onConfirm: () => doApplyProfile(profileKey),
            });
        } else {
            doApplyProfile(profileKey);
        }
    };

    const doApplyProfile = (profileKey: string) => {
        const profile = DEFAULT_PROFILES[profileKey];
        const newItems: PackingItem[] = [];
        Object.entries(profile).forEach(([category, items]) => {
            items.forEach((itemText) => {
                newItems.push({
                    id: `${Date.now()}_${Math.random().toString(36).substring(5)}`,
                    text: itemText,
                    checked: false,
                    category,
                });
            });
        });
        saveList(newItems, profileKey, false, "");
    };

    const toggleItem = (itemId: string) => {
        const updated = packingList.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        saveList(updated);
    };

    const deleteItem = (itemId: string) => {
        const updated = packingList.filter(item => item.id !== itemId);
        saveList(updated);
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim()) return;
        const item: PackingItem = {
            id: `${Date.now()}_${Math.random().toString(36).substring(5)}`,
            text: newItemText.trim(),
            checked: false,
            category: newItemCategory,
        };
        saveList([...packingList, item]);
        setNewItemText("");
    };

    const clearAllItems = () => {
        setConfirmDialog({
            isOpen: true,
            title: "Limpiar lista",
            message: "¿Seguro que deseas vaciar tu lista de equipaje? Esta acción no se puede deshacer.",
            variant: "danger",
            onConfirm: () => {
                saveList([], "", false, "");
            },
        });
    };

    const finalizeList = () => {
        const now = new Date().toISOString();
        saveList(packingList, undefined, true, now);
        showToast("✅ Lista finalizada y guardada para consulta", "success");
    };

    const createNewList = () => {
        setConfirmDialog({
            isOpen: true,
            title: "Crear nueva lista",
            message: "Se creará una nueva lista vacía. La lista finalizada anterior quedará reemplazada.",
            variant: "info",
            onConfirm: () => {
                saveList([], "", false, "");
            },
        });
    };

    const totalItems = packingList.length;
    const checkedItems = packingList.filter(i => i.checked).length;
    const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    // ═══════════════════════════════════════════════
    // WEATHER + TIMEZONE LOGIC
    // ═══════════════════════════════════════════════

    const fetchWeather = useCallback(async (cityName: string) => {
        // Check cache first (1 hour)
        const cacheKey = `stayfinder_weather_${cityName}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed: WeatherData = JSON.parse(cached);
                if (Date.now() - parsed.fetchedAt < 3600000) {
                    setWeatherData(parsed);
                    return;
                }
            } catch { /* ignore */ }
        }

        setWeatherLoading(true);
        try {
            // 1. Geocode city
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=es`);
            const geoData = await geoRes.json();
            if (!geoData.results || geoData.results.length === 0) {
                showToast(`No se encontró la ciudad "${cityName}"`, "error");
                setWeatherLoading(false);
                return;
            }
            const { latitude, longitude, timezone } = geoData.results[0];

            // 2. Fetch weather
            const wxRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(timezone)}&forecast_days=6`
            );
            const wxData = await wxRes.json();

            const data: WeatherData = {
                current: {
                    temp: Math.round(wxData.current.temperature_2m),
                    humidity: wxData.current.relative_humidity_2m,
                    windSpeed: Math.round(wxData.current.wind_speed_10m),
                    weatherCode: wxData.current.weather_code,
                },
                daily: wxData.daily.time.slice(1, 6).map((date: string, i: number) => ({
                    date,
                    tempMax: Math.round(wxData.daily.temperature_2m_max[i + 1]),
                    tempMin: Math.round(wxData.daily.temperature_2m_min[i + 1]),
                    weatherCode: wxData.daily.weather_code[i + 1],
                })),
                timezone,
                cityName,
                fetchedAt: Date.now(),
            };

            setWeatherData(data);
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (err) {
            console.error("Weather fetch error:", err);
            showToast("Error al cargar el clima. Verificá tu conexión.", "error");
        } finally {
            setWeatherLoading(false);
        }
    }, [showToast]);

    // Auto-fetch weather when city changes
    useEffect(() => {
        if (selectedCity) {
            fetchWeather(selectedCity);
        }
    }, [selectedCity, fetchWeather]);

    // Load destinations for the selected trip
    useEffect(() => {
        if (!selectedTripId) {
            setDestinations([]);
            return;
        }
        
        const loadDestinations = async () => {
            setDestinationsLoading(true);
            try {
                const list = await travelService.getTripDestinations(selectedTripId);
                setDestinations(list);
                
                if (list.length > 0) {
                    setSelectedCity(list[0].city);
                } else {
                    const trip = trips.find(t => t.id === selectedTripId);
                    if (trip?.destination) {
                        const cityName = trip.destination.split(",")[0].trim();
                        if (cityName) {
                            setSelectedCity(cityName);
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading destinations:", err);
            } finally {
                setDestinationsLoading(false);
            }
        };
        
        loadDestinations();
    }, [selectedTripId, trips]);

    // Live clock for destination timezone
    useEffect(() => {
        if (!weatherData?.timezone) return;

        const updateClocks = () => {
            try {
                const now = new Date();
                const localTimeStr = now.toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                });
                setLocalTime(localTimeStr);

                const destTimeStr = now.toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                    timeZone: weatherData.timezone,
                });
                setDestinationTime(destTimeStr);

                // Calculate difference
                const localOffset = now.getTimezoneOffset();
                const destFormatter = new Intl.DateTimeFormat("en-US", {
                    timeZone: weatherData.timezone,
                    hour: "numeric",
                    hour12: false,
                });
                const localFormatter = new Intl.DateTimeFormat("en-US", {
                    hour: "numeric",
                    hour12: false,
                });
                const destHour = parseInt(destFormatter.format(now));
                const localHour = parseInt(localFormatter.format(now));
                const diff = destHour - localHour;
                if (diff === 0) {
                    setTimeDiff("Misma hora");
                } else if (diff > 0) {
                    setTimeDiff(`+${diff}h`);
                } else {
                    setTimeDiff(`${diff}h`);
                }
            } catch {
                setDestinationTime("--:--:--");
                setTimeDiff("--");
            }
        };

        updateClocks();
        const interval = setInterval(updateClocks, 1000);
        return () => clearInterval(interval);
    }, [weatherData?.timezone]);

    // ═══════════════════════════════════════════════
    // CURRENCY LOGIC
    // ═══════════════════════════════════════════════

    const fetchRates = useCallback(async (base: string, force = false) => {
        const cacheKey = `stayfinder_rates_${base}`;
        if (!force) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const parsed: CurrencyRates = JSON.parse(cached);
                    if (Date.now() - parsed.fetchedAt < 86400000) { // 24hrs
                        setCurrencyRates(parsed);
                        return;
                    }
                } catch { /* ignore */ }
            }
        }

        setCurrencyLoading(true);
        try {
            const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
            const data = await res.json();
            if (data.result === "success") {
                const ratesData: CurrencyRates = {
                    rates: data.rates,
                    base: data.base_code,
                    lastUpdate: data.time_last_update_utc,
                    fetchedAt: Date.now(),
                };
                setCurrencyRates(ratesData);
                localStorage.setItem(cacheKey, JSON.stringify(ratesData));
                if (force) showToast("Cotizaciones actualizadas", "success");
            } else {
                showToast("Error al cargar cotizaciones", "error");
            }
        } catch (err) {
            console.error("Currency fetch error:", err);
            showToast("Error de conexión al cargar cotizaciones", "error");
        } finally {
            setCurrencyLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (subTab === "currency") {
            fetchRates(baseCurrency);
        }
    }, [subTab, baseCurrency, fetchRates]);

    const currencyAmountNum = parseFloat(currencyAmount) || 0;

    const getTimeSinceUpdate = () => {
        if (!currencyRates) return "";
        const hoursAgo = Math.round((Date.now() - currencyRates.fetchedAt) / 3600000);
        if (hoursAgo < 1) return "Hace menos de 1 hora";
        if (hoursAgo === 1) return "Hace 1 hora";
        return `Hace ${hoursAgo} horas`;
    };

    // ═══════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            {ToastComponent}

            {/* Compact Header */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                        Herramientas
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                        Equipaje, clima y cotizaciones.
                    </p>
                </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/20 dark:border-slate-800/40">
                <button
                    onClick={() => setSubTab("packing")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${subTab === "packing" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                >
                    <Briefcase size={14} /> Equipaje
                </button>
                <button
                    onClick={() => setSubTab("destination")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${subTab === "destination" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                >
                    <CloudSun size={14} /> Destino
                </button>
                <button
                    onClick={() => setSubTab("currency")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${subTab === "currency" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                >
                    <DollarSign size={14} /> Moneda
                </button>
            </div>

            {/* ═══════════════════════════════════════ */}
            {/* TAB: PACKING CHECKLIST */}
            {/* ═══════════════════════════════════════ */}
            {subTab === "packing" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                    {/* Trip Selector */}
                    {trips.length > 0 && (
                        <div className="space-y-2">
                            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                Viaje
                            </label>
                            <select
                                value={selectedTripId}
                                onChange={(e) => setSelectedTripId(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 shadow-sm"
                            >
                                {trips.map(trip => (
                                    <option key={trip.id} value={trip.id}>{trip.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Finalized Badge */}
                    {isFinalized && (
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                    <CheckCircle size={20} className="text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Lista Finalizada ✓</p>
                                    {finalizedAt && (
                                        <p className="text-[10px] text-emerald-500 dark:text-emerald-400 font-medium">
                                            {new Date(finalizedAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={createNewList}
                                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-600 transition active:scale-95"
                            >
                                <PlusCircle size={14} /> Nueva
                            </button>
                        </div>
                    )}

                    {/* Profile Presets */}
                    {!isFinalized && (
                        <div className="space-y-2">
                            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">¿Qué tipo de viaje es?</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { key: "playa", label: "Playa 🏖️" },
                                    { key: "frio", label: "Frío 🏔️" },
                                    { key: "aventura", label: "Aventura 🥾" },
                                    { key: "ciudad", label: "Ciudad 🏙️" }
                                ].map((prof) => (
                                    <button
                                        key={prof.key}
                                        onClick={() => applyProfilePreset(prof.key)}
                                        className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${activeProfile === prof.key
                                            ? "bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-500/25 scale-[1.03]"
                                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                            }`}
                                    >
                                        {prof.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {totalItems > 0 && (
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-2.5">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Progreso del Equipaje</span>
                                <span className={`text-xs font-black ${progressPercent === 100 ? "text-emerald-500" : "text-indigo-500"}`}>
                                    {progressPercent}% completado
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${progressPercent === 100 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-indigo-500 to-blue-500"}`}
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase pt-1">
                                <span>{checkedItems} empacados</span>
                                <span>{totalItems} total</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                                {progressPercent === 100 && !isFinalized && (
                                    <button
                                        onClick={finalizeList}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/25 hover:bg-emerald-600 transition active:scale-95"
                                    >
                                        <Archive size={14} /> Finalizar Lista
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Add Item Form */}
                    <form onSubmit={handleAddItem} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex gap-2">
                        <input
                            type="text"
                            placeholder="Añadir artículo..."
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-950 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                        <select
                            value={newItemCategory}
                            onChange={(e) => setNewItemCategory(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-2 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                            <option value="Ropa">Ropa</option>
                            <option value="Aseo">Aseo</option>
                            <option value="Tecnología">Tech</option>
                            <option value="Documentos">Docs</option>
                            <option value="Otros">Otros</option>
                        </select>
                        <button
                            type="submit"
                            className="w-10 h-10 shrink-0 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all"
                        >
                            <Plus size={20} />
                        </button>
                    </form>

                    {/* Packing List */}
                    {totalItems === 0 ? (
                        <div className="flex flex-col items-center justify-center p-10 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-2xl flex items-center justify-center mb-4">
                                <Briefcase size={28} />
                            </div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Equipaje Vacío</h4>
                            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px]">Selecciona uno de los perfiles arriba o añade artículos personalizados.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {["Ropa", "Aseo", "Tecnología", "Documentos", "Otros"].map((category) => {
                                const categoryItems = packingList.filter(i => i.category === category);
                                if (categoryItems.length === 0) return null;

                                return (
                                    <div key={category} className="space-y-2">
                                        <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider px-2">{category}</h3>
                                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                                            {categoryItems.map((item) => (
                                                <PackingListItem
                                                    key={item.id}
                                                    item={item}
                                                    isFinalized={isFinalized}
                                                    onToggle={toggleItem}
                                                    onDelete={deleteItem}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Bottom Actions */}
                            <div className="flex justify-center gap-3 pt-2">
                                <button
                                    onClick={clearAllItems}
                                    className="text-xs text-red-500 hover:text-red-600 font-bold bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/25 px-5 py-2.5 rounded-full transition-all active:scale-95"
                                >
                                    Limpiar Lista
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* TAB: DESTINATION (WEATHER + TIMEZONE) */}
            {/* ═══════════════════════════════════════ */}
            {subTab === "destination" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                    {/* Trip Selector */}
                    {trips.length > 0 && (
                        <div className="space-y-2">
                            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                Seleccionar viaje
                            </label>
                            <select
                                value={selectedTripId}
                                onChange={(e) => setSelectedTripId(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 shadow-sm"
                            >
                                {trips.map(trip => (
                                    <option key={trip.id} value={trip.id}>{trip.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Saved Destinations Quick Tap */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            Destinos guardados en este viaje
                        </label>
                        {destinationsLoading ? (
                            <div className="flex items-center gap-2 py-2">
                                <Loader2 size={14} className="text-indigo-500 animate-spin" />
                                <span className="text-xs text-slate-400 font-bold">Cargando destinos...</span>
                            </div>
                        ) : destinations.length > 0 ? (
                            <div className="flex gap-2 flex-wrap">
                                {destinations.map((dest) => (
                                    <button
                                        key={dest.id}
                                        onClick={() => setSelectedCity(dest.city)}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${selectedCity.toLowerCase() === dest.city.toLowerCase()
                                            ? "bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-500/25 scale-[1.03]"
                                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}
                                    >
                                        <MapPin size={12} />
                                        <span>{dest.city}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium italic py-1">
                                No hay destinos guardados en el itinerario de este viaje.
                            </p>
                        )}
                    </div>

                    {/* Manual Search Bar */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            Búsqueda manual de otra ciudad
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="manual-city-input"
                                type="text"
                                placeholder="Ej: París, Tokio, Cancún..."
                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 shadow-sm"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        const val = (e.target as HTMLInputElement).value.trim();
                                        if (val) {
                                            setSelectedCity(val);
                                            (e.target as HTMLInputElement).value = "";
                                        }
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    const input = document.getElementById("manual-city-input") as HTMLInputElement;
                                    if (input?.value.trim()) {
                                        setSelectedCity(input.value.trim());
                                        input.value = "";
                                    }
                                }}
                                className="px-5 py-3 bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md hover:bg-indigo-600 transition active:scale-95 flex items-center justify-center gap-1.5"
                            >
                                Buscar
                            </button>
                        </div>
                    </div>

                    {/* Loading State */}
                    {weatherLoading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 size={32} className="text-indigo-500 animate-spin mb-3" />
                            <p className="text-xs font-bold text-slate-400">Cargando clima...</p>
                        </div>
                    )}

                    {/* No city selected */}
                    {!selectedCity && !weatherLoading && (
                        <div className="flex flex-col items-center justify-center p-10 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
                            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-4">
                                <Globe size={28} />
                            </div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Elegí un destino</h4>
                            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[220px]">
                                {allCities.length > 0 ? "Seleccioná una ciudad de tus viajes para ver el clima y la hora local." : "Escribí el nombre de una ciudad para consultar el clima y la zona horaria."}
                            </p>
                        </div>
                    )}

                    {/* Weather Data */}
                    {weatherData && !weatherLoading && selectedCity && (
                        <>
                            {/* Current Weather Card */}
                            <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 text-white rounded-[2rem] p-6 shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                                <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                <div className="absolute left-[-10px] bottom-[-10px] w-20 h-20 bg-white/5 rounded-full blur-xl"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <MapPin size={14} className="text-indigo-200" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">{weatherData.cityName}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-6xl font-black tracking-tighter">{weatherData.current.temp}°</p>
                                            <p className="text-sm font-bold text-indigo-100 mt-1">{getWeatherLabel(weatherData.current.weatherCode)}</p>
                                        </div>
                                        <div className="scale-[2] mr-4">
                                            {getWeatherIcon(weatherData.current.weatherCode, 32)}
                                        </div>
                                    </div>

                                    <div className="flex gap-6 mt-5 pt-4 border-t border-white/20">
                                        <div className="flex items-center gap-2">
                                            <Droplets size={14} className="text-indigo-200" />
                                            <span className="text-xs font-bold">{weatherData.current.humidity}%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Wind size={14} className="text-indigo-200" />
                                            <span className="text-xs font-bold">{weatherData.current.windSpeed} km/h</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Thermometer size={14} className="text-indigo-200" />
                                            <span className="text-xs font-bold">Actual</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5-Day Forecast */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider px-1">Pronóstico 5 días</h3>
                                <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                                    {weatherData.daily.map((day) => (
                                        <div key={day.date} className="shrink-0 bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-1.5 min-w-[76px]">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">{formatDayName(day.date)}</span>
                                            <span className="text-[10px] font-bold text-slate-500">{formatDayMonth(day.date)}</span>
                                            {getWeatherIcon(day.weatherCode, 22)}
                                            <div className="flex gap-1 text-[11px] font-bold">
                                                <span className="text-slate-800 dark:text-slate-200">{day.tempMax}°</span>
                                                <span className="text-slate-400">{day.tempMin}°</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Timezone Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2 mb-5">
                                    <Clock size={16} className="text-indigo-500" />
                                    <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Zona Horaria</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Local Time */}
                                    <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Tu hora</p>
                                        <p className="text-2xl font-black text-slate-800 dark:text-slate-200 tabular-nums" suppressHydrationWarning>
                                            {localTime || "--:--:--"}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1">Local</p>
                                    </div>

                                    {/* Destination Time */}
                                    <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-4 text-center border border-indigo-100 dark:border-indigo-800/40">
                                        <p className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider mb-2">{weatherData.cityName}</p>
                                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-300 tabular-nums" suppressHydrationWarning>
                                            {destinationTime || "--:--:--"}
                                        </p>
                                        <p className="text-[10px] font-bold text-indigo-400 mt-1">{timeDiff}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400">
                                    <Globe size={12} />
                                    <span>{weatherData.timezone.replace(/_/g, " ")}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* TAB: CURRENCY CONVERTER */}
            {/* ═══════════════════════════════════════ */}
            {subTab === "currency" && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-4">
                        {/* Base Currency Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                                Moneda de origen
                            </label>
                            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                                {["USD", "EUR", "ARS", "BRL", "GBP"].map(code => (
                                    <button
                                        key={code}
                                        onClick={() => setBaseCurrency(code)}
                                        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${baseCurrency === code
                                            ? "bg-indigo-600 text-white border-transparent shadow-md"
                                            : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100"}`}
                                    >
                                        {CURRENCIES.find(c => c.code === code)?.flag} {code}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                                Importe ({baseCurrency})
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 font-extrabold text-lg">
                                    {CURRENCIES.find(c => c.code === baseCurrency)?.flag}
                                </div>
                                <input
                                    type="number"
                                    value={currencyAmount}
                                    onChange={(e) => setCurrencyAmount(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-xl font-black focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                                    placeholder="100"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Update info + refresh */}
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-bold text-slate-400">
                                {currencyLoading ? "Actualizando..." : getTimeSinceUpdate()}
                            </span>
                            <button
                                onClick={() => fetchRates(baseCurrency, true)}
                                disabled={currencyLoading}
                                className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition disabled:opacity-50"
                            >
                                <RefreshCw size={12} className={currencyLoading ? "animate-spin" : ""} />
                                Actualizar
                            </button>
                        </div>

                        {/* Conversion Results */}
                        <div className="space-y-3 pt-2">
                            <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider block px-1">
                                Cotizaciones en tiempo real
                            </label>

                            {currencyLoading && !currencyRates ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 size={24} className="text-indigo-500 animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {CURRENCIES.filter(c => c.code !== baseCurrency).map((conv) => {
                                        const rate = currencyRates?.rates?.[conv.code] || 0;
                                        const value = currencyAmountNum * rate;
                                        const formattedVal = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(value);
                                        const formattedRate = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 4 }).format(rate);

                                        return (
                                            <div key={conv.code} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl hover:border-indigo-500/30 transition">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{conv.flag}</span>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900 dark:text-white leading-none">{conv.code}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1">{conv.name}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-base text-slate-900 dark:text-white">{formattedVal}</p>
                                                    <p className="text-[9px] font-extrabold text-slate-400 mt-0.5">1 {baseCurrency} = {formattedRate} {conv.code}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                variant={confirmDialog.variant || "warning"}
            />
        </div>
    );
}

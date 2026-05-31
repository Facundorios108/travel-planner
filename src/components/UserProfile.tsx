"use client";

import React, { useState } from "react";
import { User } from "firebase/auth";
import { ThemeToggle } from "./ThemeToggle";
import { Trip } from "@/types/travel";
import { Settings, Edit2, Sliders, CreditCard, HelpCircle, LogOut, X, Check, Mail, MessageSquare, AlertTriangle, ShieldCheck, BookOpen, Calendar, User as UserIcon } from "lucide-react";

interface UserProfileProps {
    user: User | null;
    trips: Trip[];
    onSignOut: () => void;
}

export default function UserProfile({ user, trips, onSignOut }: UserProfileProps) {
    // Derived stats
    const tripsCount = trips.length;
    const countriesVisited = Array.from(new Set(trips.map(t => t.destination?.split(',').pop()?.trim()).filter(Boolean))).length;
    const docsSaved = trips.reduce((acc, trip) => acc + (trip.collaborators?.length || 0), 0) + (tripsCount * 3);

    const [displayName, setDisplayName] = useState(user?.displayName || user?.email?.split('@')[0] || "Viajero");
    const userInitial = displayName[0]?.toUpperCase() || "U";

    // Sheets & Modal states
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [tempName, setTempName] = useState(displayName);

    // Passport States & Private Storage
    const [isPassportOpen, setIsPassportOpen] = useState(false);
    const [passportState, setPassportState] = useState<"cover" | "details" | "edit">("cover");
    const [passportData, setPassportData] = useState({
        passportNo: "",
        surname: "",
        givenNames: "",
        nationality: "ARGENTINA",
        birthDate: "",
        sex: "M",
        issueDate: "",
        expiryDate: "",
        countryCode: "ARG",
        authority: "R.N.P."
    });

    React.useEffect(() => {
        if (user) {
            const key = `stayfinder_passport_${user.uid}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    setPassportData(JSON.parse(stored));
                } catch (e) {
                    console.error("Error loading passport data:", e);
                }
            }
        }
    }, [user]);

    const handleSavePassport = (newData: typeof passportData) => {
        setPassportData(newData);
        if (user) {
            const key = `stayfinder_passport_${user.uid}`;
            localStorage.setItem(key, JSON.stringify(newData));
        }
    };

    const generateMRZ = () => {
        const cleanStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
        
        const rawSurname = cleanStr(passportData.surname || user?.displayName?.split(" ").pop() || "TRAVELER");
        const rawGivenNames = cleanStr(passportData.givenNames || user?.displayName?.split(" ").slice(0, -1).join(" ") || "JOHN");
        const rawPassportNo = (passportData.passportNo || "AB123456").toUpperCase().padEnd(9, "<");
        const rawCountryCode = (passportData.countryCode || "ARG").toUpperCase().padEnd(3, "<").substring(0, 3);
        const rawNationality = (passportData.countryCode || "ARG").toUpperCase().padEnd(3, "<").substring(0, 3);
        
        // Format birthDate (YYMMDD)
        let rawBirthDate = "900101";
        if (passportData.birthDate) {
            const parts = passportData.birthDate.split("-"); // YYYY-MM-DD
            if (parts.length === 3) {
                rawBirthDate = parts[0].substring(2) + parts[1] + parts[2];
            }
        }
        
        // Format expiryDate (YYMMDD)
        let rawExpiryDate = "300101";
        if (passportData.expiryDate) {
            const parts = passportData.expiryDate.split("-"); // YYYY-MM-DD
            if (parts.length === 3) {
                rawExpiryDate = parts[0].substring(2) + parts[1] + parts[2];
            }
        }
        
        const rawSex = (passportData.sex || "M").toUpperCase().substring(0, 1);
        
        // Line 1: P<[countryCode][surname]<<[givenNames] (fill with < to 44)
        const line1Base = `P<${rawCountryCode}${rawSurname}<<${rawGivenNames}`;
        const line1 = line1Base.padEnd(44, "<").substring(0, 44);
        
        // Line 2: [passportNo][checkDigit][nationality][birthDate][checkDigit][sex][expiryDate][checkDigit]... (fill with < to 44)
        const line2Base = `${rawPassportNo}8${rawNationality}${rawBirthDate}4${rawSex}${rawExpiryDate}6`;
        const line2 = line2Base.padEnd(44, "<").substring(0, 44);
        
        return `${line1}\n${line2}`;
    };

    const [isPrefsOpen, setIsPrefsOpen] = useState(false);
    const [prefs, setPrefs] = useState({
        vueloAlerts: true,
        hotelRecs: false,
        budgetAlerts: true
    });

    const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Support Modal state
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [feedbackType, setFeedbackType] = useState<"queja" | "sugerencia" | "bug">("sugerencia");
    const [feedbackMsg, setFeedbackMsg] = useState("");

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (tempName.trim()) {
            setDisplayName(tempName.trim());
            setIsEditProfileOpen(false);
        }
    };

    const handleSendSupport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackMsg.trim()) return;

        const typeLabel = feedbackType === "queja" ? "Queja" : feedbackType === "bug" ? "Reportar Bug" : "Sugerencia de Mejora";
        const email = "facundomatiasrios108@gmail.com";
        const subject = encodeURIComponent(`StayFinder - Soporte (${typeLabel})`);
        
        const bodyText = `Hola Facundo,

Tengo una consulta/comentario sobre StayFinder:

Tipo: ${typeLabel}
Usuario: ${displayName} (${user?.email || "Sin email"})
Mensaje:
${feedbackMsg}

Saludos!`;

        const body = encodeURIComponent(bodyText);
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

        setFeedbackMsg("");
        setIsSupportOpen(false);
    };

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md p-6 justify-between">
                <div className="w-10"></div>
                <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Perfil</h1>
                <div className="flex w-10 items-center justify-end">
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center justify-center rounded-full h-10 w-10 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Settings size={22} className="text-slate-700 dark:text-slate-300" />
                    </button>
                </div>
            </header>

            {/* Profile Section */}
            <div className="flex flex-col items-center pt-2 pb-8 px-6">
                <div className="relative">
                    <div className="bg-[#1877F2]/10 aspect-square rounded-[2rem] w-32 h-32 border-[0.5rem] border-white dark:border-slate-950 shadow-sm flex items-center justify-center text-[#1877F2] text-5xl font-bold uppercase transition-transform hover:scale-105">
                        {userInitial}
                    </div>
                    <button 
                        onClick={() => { setTempName(displayName); setIsEditProfileOpen(true); }}
                        className="absolute bottom-1 right-1 bg-[#1877F2] text-white p-2 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                    >
                        <Edit2 size={16} strokeWidth={2.5} />
                    </button>
                </div>
                <div className="mt-5 text-center">
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{displayName}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">{user?.email}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 px-6 mb-8">
                <div className="flex flex-col items-center justify-center bg-[#1877F2]/5 dark:bg-[#1877F2]/10 rounded-2xl p-5 border border-[#1877F2]/10 transition-colors hover:bg-[#1877F2]/10 dark:hover:bg-[#1877F2]/20 cursor-pointer">
                    <p className="text-[#1877F2] text-2xl font-black">{tripsCount}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1 text-center leading-tight">Viajes<br />Planeados</p>
                </div>
                <div className="flex flex-col items-center justify-center bg-[#1877F2]/5 dark:bg-[#1877F2]/10 rounded-2xl p-5 border border-[#1877F2]/10 transition-colors hover:bg-[#1877F2]/10 dark:hover:bg-[#1877F2]/20 cursor-pointer">
                    <p className="text-[#1877F2] text-2xl font-black">{countriesVisited}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1 text-center leading-tight">Países<br />Visitados</p>
                </div>
                <div className="flex flex-col items-center justify-center bg-[#1877F2]/5 dark:bg-[#1877F2]/10 rounded-2xl p-5 border border-[#1877F2]/10 transition-colors hover:bg-[#1877F2]/10 dark:hover:bg-[#1877F2]/20 cursor-pointer">
                    <p className="text-[#1877F2] text-2xl font-black">{docsSaved}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1 text-center leading-tight">Docs<br />Guardados</p>
                </div>
            </div>

            {/* Menu List */}
            <div className="flex flex-col gap-3 px-6 mb-10">
                {/* Mi Pasaporte Digital */}
                <button 
                    onClick={() => {
                        setPassportState(passportData.passportNo ? "details" : "cover");
                        setIsPassportOpen(true);
                    }}
                    className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-4 rounded-[1.5rem] transition-colors group border border-slate-100 dark:border-slate-800"
                >
                    <div className="flex items-center justify-center rounded-xl bg-[#1877F2]/10 dark:bg-[#1877F2]/20 text-[#1877F2] h-12 w-12 transition-transform group-hover:scale-110">
                        <BookOpen size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 text-left">
                        <span className="block text-slate-900 dark:text-slate-100 font-bold text-sm">Mi Pasaporte Digital</span>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase mt-0.5">Datos para emergencias 🗺️</span>
                    </div>
                    <span className="text-slate-400 group-hover:text-[#1877F2] transition-colors">➔</span>
                </button>

                {/* Preferencias de Viaje */}
                <button 
                    onClick={() => setIsPrefsOpen(true)}
                    className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-4 rounded-[1.5rem] transition-colors group border border-slate-100 dark:border-slate-800"
                >
                    <div className="flex items-center justify-center rounded-xl bg-[#1877F2]/10 dark:bg-[#1877F2]/20 text-[#1877F2] h-12 w-12 transition-transform group-hover:scale-110">
                        <Sliders size={20} strokeWidth={2.5} />
                    </div>
                    <span className="flex-1 text-left text-slate-900 dark:text-slate-100 font-bold text-sm">Preferencias de Viaje</span>
                    <span className="text-slate-400 group-hover:text-[#1877F2] transition-colors">➔</span>
                </button>

                {/* Apariencia Toggle */}
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-center rounded-xl bg-[#1877F2]/10 dark:bg-[#1877F2]/20 text-[#1877F2] h-12 w-12">
                        <Settings size={20} strokeWidth={2.5} />
                    </div>
                    <span className="flex-1 text-left text-slate-900 dark:text-slate-100 font-bold text-sm">Apariencia (Dark Mode)</span>
                    <ThemeToggle />
                </div>

                {/* Métodos de Pago */}
                <button 
                    onClick={() => setIsPaymentsOpen(true)}
                    className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-4 rounded-[1.5rem] transition-colors group border border-slate-100 dark:border-slate-800"
                >
                    <div className="flex items-center justify-center rounded-xl bg-[#1877F2]/10 dark:bg-[#1877F2]/20 text-[#1877F2] h-12 w-12 transition-transform group-hover:scale-110">
                        <CreditCard size={20} strokeWidth={2.5} />
                    </div>
                    <span className="flex-1 text-left text-slate-900 dark:text-slate-100 font-bold text-sm">Métodos de Pago</span>
                    <span className="text-slate-400 group-hover:text-[#1877F2] transition-colors">➔</span>
                </button>

                {/* Ayuda & Soporte */}
                <button 
                    onClick={() => setIsSupportOpen(true)}
                    className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-4 rounded-[1.5rem] transition-colors group border border-slate-100 dark:border-slate-800"
                >
                    <div className="flex items-center justify-center rounded-xl bg-[#1877F2]/10 dark:bg-[#1877F2]/20 text-[#1877F2] h-12 w-12 transition-transform group-hover:scale-110">
                        <HelpCircle size={20} strokeWidth={2.5} />
                    </div>
                    <span className="flex-1 text-left text-slate-900 dark:text-slate-100 font-bold text-sm">Ayuda & Soporte</span>
                    <span className="text-slate-400 group-hover:text-[#1877F2] transition-colors">➔</span>
                </button>
            </div>

            {/* Log Out Button */}
            <div className="px-6 pb-6 mt-auto">
                <button
                    onClick={onSignOut}
                    className="flex items-center justify-center gap-2 text-rose-500 dark:text-rose-400 font-bold text-base px-6 py-4 rounded-[1.5rem] bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-95 w-full border border-rose-100 dark:border-rose-500/20 shadow-sm"
                >
                    <LogOut size={20} strokeWidth={2.5} />
                    Cerrar Sesión
                </button>
            </div>

            {/* MODAL 1: EDIT PROFILE */}
            {isEditProfileOpen && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
                    <form 
                        onSubmit={handleSaveProfile}
                        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden p-6 animate-in slide-in-from-bottom-6 sm:fade-in duration-300"
                    >
                        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-black">Editar Perfil</h3>
                            <button type="button" onClick={() => setIsEditProfileOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nombre de Usuario</label>
                                <input
                                    type="text"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button type="button" onClick={() => setIsEditProfileOpen(false)} className="flex-1 py-3 font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 font-bold rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">Guardar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL 2: PREFERENCIAS DE VIAJE */}
            {isPrefsOpen && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden p-6 animate-in slide-in-from-bottom-6 sm:fade-in duration-300">
                        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-black">Preferencias de Viaje</h3>
                            <button onClick={() => setIsPrefsOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X size={18} /></button>
                        </div>
                        <div className="space-y-4 py-2">
                            {[
                                { key: "vueloAlerts", label: "Alertas de Estado de Vuelo", desc: "Recibir notificaciones en tiempo real sobre demoras de vuelos." },
                                { key: "hotelRecs", label: "Recomendaciones Inteligentes", desc: "Sugerir alojamientos cercanos basados en tu historial." },
                                { key: "budgetAlerts", label: "Control de Presupuesto", desc: "Avisar cuando se supere el 80% del presupuesto de gastos." }
                            ].map((prefItem) => (
                                <div key={prefItem.key} className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{prefItem.label}</p>
                                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{prefItem.desc}</p>
                                    </div>
                                    <button 
                                        onClick={() => setPrefs(prev => ({ ...prev, [prefItem.key]: !prev[prefItem.key as keyof typeof prev] }))}
                                        className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${prefs[prefItem.key as keyof typeof prefs] ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-800"}`}
                                    >
                                        <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${prefs[prefItem.key as keyof typeof prefs] ? "translate-x-5" : ""}`}></span>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setIsPrefsOpen(false)} className="w-full mt-6 py-3 font-bold rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/25">Aceptar</button>
                    </div>
                </div>
            )}

            {/* MODAL 3: METODOS DE PAGO */}
            {isPaymentsOpen && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden p-6 animate-in slide-in-from-bottom-6 sm:fade-in duration-300">
                        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-black">Métodos de Pago</h3>
                            <button onClick={() => setIsPaymentsOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-5 rounded-2xl border border-slate-700/50 shadow-md relative overflow-hidden">
                                <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white/5 rounded-full"></div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Tarjeta Virtual / Visa</p>
                                <h4 className="text-xl font-bold mt-4 tracking-wider">•••• •••• •••• 4892</h4>
                                <div className="flex justify-between items-center mt-6">
                                    <span className="text-xs font-medium text-slate-400">StayFinder Premium</span>
                                    <span className="text-xs font-bold">12/29</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2 p-4 bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-sm font-bold cursor-pointer hover:border-blue-500 hover:text-blue-500 transition-colors">
                                <span>+ Agregar Tarjeta de Crédito</span>
                            </div>
                        </div>
                        <button onClick={() => setIsPaymentsOpen(false)} className="w-full mt-6 py-3 font-bold rounded-xl bg-blue-500 text-white">Listo</button>
                    </div>
                </div>
            )}

            {/* MODAL 4: SETTINGS */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden p-6 animate-in slide-in-from-bottom-6 sm:fade-in duration-300">
                        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-black">Ajustes del Sistema</h3>
                            <button onClick={() => setIsSettingsOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X size={18} /></button>
                        </div>
                        <div className="space-y-4 py-2">
                            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                                <div>
                                    <h4 className="text-sm font-bold">Versión de App</h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5">StayFinder v2.4.1 Premium</p>
                                </div>
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-md border border-blue-200/50">Actualizado</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 text-slate-600 dark:text-slate-400">
                                <ShieldCheck size={18} className="text-emerald-500" />
                                <span className="text-xs font-bold">Seguridad y Encriptación Extrema ✓</span>
                            </div>
                        </div>
                        <button onClick={() => setIsSettingsOpen(false)} className="w-full mt-6 py-3 font-bold rounded-xl bg-blue-500 text-white">Entendido</button>
                    </div>
                </div>
            )}

            {/* MODAL 5: HELP & SUPPORT MODAL (WITH MAILTO COMPILATION) */}
            {isSupportOpen && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
                    <form 
                        onSubmit={handleSendSupport}
                        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden p-6 animate-in slide-in-from-bottom-6 sm:fade-in duration-300"
                    >
                        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-black flex items-center gap-2">
                                <Mail className="text-blue-500" size={20} />
                                Ayuda & Soporte
                            </h3>
                            <button type="button" onClick={() => setIsSupportOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X size={18} /></button>
                        </div>
                        
                        <div className="space-y-5">
                            {/* Feedback Type Selection */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">¿En qué te podemos ayudar?</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: "sugerencia", label: "Sugerencia 💡" },
                                        { value: "queja", label: "Queja 😠" },
                                        { value: "bug", label: "Bug / Error 🐛" }
                                    ].map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setFeedbackType(type.value as any)}
                                            className={`py-2 rounded-xl text-xs font-bold border transition ${feedbackType === type.value
                                                ? "bg-blue-500 border-transparent text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                                                : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                                                }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message Box */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Detalles del mensaje</label>
                                <textarea
                                    required
                                    placeholder="Hola Facundo, encontré un bug / me gustaría proponer..."
                                    value={feedbackMsg}
                                    onChange={(e) => setFeedbackMsg(e.target.value)}
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 min-h-[120px] resize-none text-slate-950 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button type="button" onClick={() => setIsSupportOpen(false)} className="flex-1 py-3 font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 font-bold rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">Enviar Email</button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL 6: PASAPORTE DIGITAL */}
            {isPassportOpen && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-md p-0 sm:p-4">
                    <div className="bg-slate-100 dark:bg-slate-950 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:fade-in duration-300 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                {passportState === "cover" ? "Pasaporte Digital" : (passportState === "edit" ? "Editar Pasaporte" : "Detalles del Pasaporte")}
                            </h3>
                            <button 
                                onClick={() => setIsPassportOpen(false)} 
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body / Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center items-center">
                            
                            {/* ESTADO 1: TAPA DEL PASAPORTE (COVER) */}
                            {passportState === "cover" && (
                                <div 
                                    onClick={() => setPassportState("details")}
                                    className="passport-cover w-[260px] h-[370px] rounded-[1.8rem] p-6 flex flex-col justify-between items-center text-center cursor-pointer hover:scale-[1.03] transition-all duration-300 relative select-none animate-in zoom-in-95 duration-200"
                                >
                                    {/* Gold borders/details */}
                                    <div className="border border-[#E2C275]/30 rounded-2xl w-full h-full p-4 flex flex-col justify-between items-center">
                                        <div className="space-y-1">
                                            <p className="passport-gold-emboss text-[10px] font-black tracking-[0.25em] uppercase opacity-90">República Argentina</p>
                                            <h4 className="passport-gold-emboss text-xl font-black tracking-[0.15em] uppercase mt-2">Pasaporte</h4>
                                        </div>

                                        {/* Golden Globe Emblem */}
                                        <div className="relative w-28 h-28 flex items-center justify-center my-6">
                                            <div className="absolute inset-0 rounded-full border border-[#E2C275]/40 flex items-center justify-center">
                                                <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#E2C275]/80 fill-none stroke-current" strokeWidth="1.5">
                                                    <circle cx="50" cy="50" r="45" />
                                                    <ellipse cx="50" cy="50" rx="45" ry="18" />
                                                    <ellipse cx="50" cy="50" rx="18" ry="45" />
                                                    <line x1="5" y1="50" x2="95" y2="50" />
                                                    <line x1="50" y1="5" x2="50" y2="95" />
                                                </svg>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Biometric symbol */}
                                            <div className="w-7 h-5 border border-[#E2C275]/70 rounded-md mx-auto flex items-center justify-center relative overflow-hidden">
                                                <div className="w-2.5 h-2.5 bg-[#E2C275]/70 rounded-full"></div>
                                                <div className="absolute left-0 right-0 h-[1.5px] bg-[#E2C275]/70 top-1/2 -translate-y-1/2"></div>
                                            </div>

                                            <button 
                                                className="px-6 py-2.5 bg-[#E2C275]/10 hover:bg-[#E2C275]/20 text-[#E2C275] border border-[#E2C275]/40 text-xs font-black uppercase tracking-widest rounded-full transition active:scale-95 shadow-lg shadow-black/20"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPassportState("details");
                                                }}
                                            >
                                                Abrir Pasaporte
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ESTADO 2: VISTA INTERIOR DE ALTA FIDELIDAD */}
                            {passportState === "details" && (
                                <div className="passport-inner w-full max-w-sm rounded-[2.2rem] p-5 shadow-xl border border-white/20 relative flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-200 overflow-hidden select-none">
                                    
                                    {/* Security grid lines / watermark effect */}
                                    <div className="flex justify-between items-start border-b-2 border-dashed border-slate-300 dark:border-slate-800/80 pb-3">
                                        <div className="flex gap-2 items-center">
                                            <span className="text-xl">🇦🇷</span>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none">PASAPORTE / PASSPORT</p>
                                                <p className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">ARGENTINA</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-none">Número / No.</p>
                                            <p className="text-sm font-black text-rose-600 dark:text-rose-500 tracking-wider font-mono mt-0.5">
                                                {passportData.passportNo || "AB123456"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Main info panel */}
                                    <div className="flex gap-4">
                                        {/* Left Col: Photo & Signature */}
                                        <div className="flex flex-col gap-3 items-center w-24 shrink-0">
                                            {/* Photo Placeholder */}
                                            <div className="w-24 h-28 bg-slate-300/60 dark:bg-slate-800/80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner flex items-center justify-center relative">
                                                {user?.photoURL ? (
                                                    <img src={user.photoURL} alt="Passport Photo" className="w-full h-full object-cover grayscale opacity-85" />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 select-none">
                                                        <UserIcon size={40} strokeWidth={1.5} />
                                                        <span className="text-[8px] font-bold uppercase mt-1">PHOTO</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-blue-500/5 mix-blend-color"></div>
                                            </div>

                                            {/* Signature */}
                                            <div className="w-full text-center border-t border-slate-300 dark:border-slate-800 pt-1">
                                                <p className="text-[6px] font-bold text-slate-400 uppercase tracking-wider mb-1">Holder's signature</p>
                                                <p className="font-signature text-base text-blue-750 dark:text-blue-400 tracking-wide rotate-[-3deg] select-none h-6 flex items-center justify-center">
                                                    {passportData.givenNames && passportData.surname 
                                                        ? `${passportData.givenNames} ${passportData.surname}`
                                                        : displayName
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right Col: Personal Details */}
                                        <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-2.5 text-slate-700 dark:text-slate-300">
                                            <div className="col-span-2">
                                                <span className="text-[7px] font-black uppercase text-slate-450 dark:text-slate-500 block leading-none">Apellidos / Surname</span>
                                                <span className="text-xs font-black uppercase text-slate-900 dark:text-white mt-0.5 block leading-tight">
                                                    {passportData.surname || "TRAVELER"}
                                                </span>
                                            </div>
                                            
                                            <div className="col-span-2">
                                                <span className="text-[7px] font-black uppercase text-slate-450 dark:text-slate-500 block leading-none">Nombres / Given Names</span>
                                                <span className="text-xs font-black uppercase text-slate-900 dark:text-white mt-0.5 block leading-tight">
                                                    {passportData.givenNames || "JOHN"}
                                                </span>
                                            </div>

                                            <div>
                                                <span className="text-[7px] font-black uppercase text-slate-450 dark:text-slate-500 block leading-none">Nacionalidad / Nationality</span>
                                                <span className="text-[10px] font-extrabold uppercase text-slate-900 dark:text-white mt-0.5 block">
                                                    {passportData.nationality || "ARGENTINA"}
                                                </span>
                                            </div>

                                            <div>
                                                <span className="text-[7px] font-black uppercase text-slate-450 dark:text-slate-500 block leading-none">Sexo / Sex</span>
                                                <span className="text-[10px] font-extrabold uppercase text-slate-900 dark:text-white mt-0.5 block">
                                                    {passportData.sex || "M"}
                                                </span>
                                            </div>

                                            <div className="col-span-2">
                                                <span className="text-[7px] font-black uppercase text-slate-450 dark:text-slate-500 block leading-none">Fecha Nac. / Date of birth</span>
                                                <span className="text-[10px] font-extrabold uppercase text-slate-900 dark:text-white mt-0.5 block">
                                                    {passportData.birthDate 
                                                        ? new Date(passportData.birthDate + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()
                                                        : "01 ENE 1990"
                                                    }
                                                </span>
                                            </div>

                                            <div>
                                                <span className="text-[7px] font-black uppercase text-slate-450 dark:text-slate-500 block leading-none">Emisión / Date of issue</span>
                                                <span className="text-[9px] font-extrabold uppercase text-slate-900 dark:text-white mt-0.5 block">
                                                    {passportData.issueDate 
                                                        ? new Date(passportData.issueDate + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()
                                                        : "01 ENE 2020"
                                                    }
                                                </span>
                                            </div>

                                            <div>
                                                <span className="text-[7px] font-black uppercase text-slate-450 dark:text-slate-500 block leading-none">Expiración / Expiry date</span>
                                                <span className="text-[9px] font-extrabold uppercase text-rose-600 dark:text-rose-400 mt-0.5 block">
                                                    {passportData.expiryDate 
                                                        ? new Date(passportData.expiryDate + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()
                                                        : "01 ENE 2030"
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Machine Readable Zone (MRZ) */}
                                    <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-800/80 pt-3 mt-1">
                                        <pre className="font-mrz text-[9px] leading-relaxed text-slate-500 dark:text-slate-450 bg-slate-200/30 dark:bg-slate-950/45 p-2 rounded-xl text-center select-all whitespace-pre">
                                            {generateMRZ()}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {/* ESTADO 3: FORMULARIO DE EDICIÓN */}
                            {passportState === "edit" && (
                                <div className="w-full max-w-sm space-y-4 animate-in slide-in-from-bottom-4 duration-200">
                                    <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1 text-left">
                                                <label className="text-[9px] font-black uppercase text-slate-400 pl-1 block">Apellidos</label>
                                                <input
                                                    type="text"
                                                    value={passportData.surname}
                                                    onChange={(e) => handleSavePassport({ ...passportData, surname: e.target.value })}
                                                    placeholder="Ej: RIOS"
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250/20 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1 text-left">
                                                <label className="text-[9px] font-black uppercase text-slate-400 pl-1 block">Nombres</label>
                                                <input
                                                    type="text"
                                                    value={passportData.givenNames}
                                                    onChange={(e) => handleSavePassport({ ...passportData, givenNames: e.target.value })}
                                                    placeholder="Ej: FACUNDO"
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250/20 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1 text-left">
                                                <label className="text-[9px] font-black uppercase text-slate-400 pl-1 block">N° de Pasaporte</label>
                                                <input
                                                    type="text"
                                                    value={passportData.passportNo}
                                                    onChange={(e) => handleSavePassport({ ...passportData, passportNo: e.target.value })}
                                                    placeholder="Ej: AB123456"
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250/20 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1 text-left">
                                                <label className="text-[9px] font-black uppercase text-slate-400 pl-1 block">Sexo</label>
                                                <select
                                                    value={passportData.sex}
                                                    onChange={(e) => handleSavePassport({ ...passportData, sex: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250/20 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
                                                >
                                                    <option value="M">M (Masculino)</option>
                                                    <option value="F">F (Femenino)</option>
                                                    <option value="X">X (No Binario)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-1 text-left">
                                            <label className="text-[9px] font-black uppercase text-slate-400 pl-1 block">Fecha de Nacimiento</label>
                                            <input
                                                type="date"
                                                value={passportData.birthDate}
                                                onChange={(e) => handleSavePassport({ ...passportData, birthDate: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250/20 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-left">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase text-slate-400 pl-1 block">Fecha Emisión</label>
                                                <input
                                                    type="date"
                                                    value={passportData.issueDate}
                                                    onChange={(e) => handleSavePassport({ ...passportData, issueDate: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250/20 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1 text-left">
                                                <label className="text-[9px] font-black uppercase text-slate-400 pl-1 block">Fecha Expiración</label>
                                                <input
                                                    type="date"
                                                    value={passportData.expiryDate}
                                                    onChange={(e) => handleSavePassport({ ...passportData, expiryDate: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250/20 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer / Actions */}
                        <div className="px-6 py-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 flex gap-3">
                            {passportState === "cover" && (
                                <button 
                                    onClick={() => setPassportState("details")} 
                                    className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition active:scale-95"
                                >
                                    Abrir
                                </button>
                            )}

                            {passportState === "details" && (
                                <>
                                    <button 
                                        onClick={() => setPassportState("edit")} 
                                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm rounded-xl transition active:scale-95 border border-slate-200/20"
                                    >
                                        Editar Datos
                                    </button>
                                    <button 
                                        onClick={() => setPassportState("cover")} 
                                        className="py-3 px-5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition active:scale-95 shadow-md shadow-blue-500/10"
                                    >
                                        Cerrar Tapa
                                    </button>
                                </>
                            )}

                            {passportState === "edit" && (
                                <button 
                                    onClick={() => setPassportState("details")} 
                                    className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition active:scale-95"
                                >
                                    Guardar y Ver
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

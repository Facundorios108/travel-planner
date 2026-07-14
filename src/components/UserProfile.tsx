"use client";

import React, { useState } from "react";
import { User, updateProfile } from "firebase/auth";
import { ThemeToggle } from "./ThemeToggle";
import { Trip } from "@/types/travel";
import { Settings, Edit2, Sliders, CreditCard, HelpCircle, LogOut, X, Check, Mail, MessageSquare, AlertTriangle, ShieldCheck, BookOpen, Calendar, User as UserIcon, FileText, Globe, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import { travelService } from "@/lib/services";
import { countriesList } from "@/utils/countriesData";

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
    const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [photoError, setPhotoError] = useState("");
    const userInitial = displayName[0]?.toUpperCase() || "U";

    // Load photo from Firestore on mount (fallback when Firebase Auth photoURL is empty)
    React.useEffect(() => {
        if (!user || photoURL) return;
        travelService.getUserPhoto(user.uid).then(p => {
            if (p) setPhotoURL(p);
        }).catch(console.error);
    }, [user]);

    // Compress image client-side using Canvas API (max 400×400, JPEG 88%)
    const compressImage = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                const MAX = 400;
                let w = img.width, h = img.height;
                if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
                else       { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg", 0.88));
            };
            img.onerror = reject;
            img.src = objectUrl;
        });

    // Sheets & Modal states
    const [activeStatDetail, setActiveStatDetail] = useState<"trips" | "countries" | "docs" | null>(null);
    const [passportCountries, setPassportCountries] = useState<any[]>([]);
    const [savedDocuments, setSavedDocuments] = useState<any[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);

    // Fetch stats data on load
    React.useEffect(() => {
        if (!user) return;
        async function fetchStatsData() {
            try {
                // 1. Fetch passport countries
                const passport = await travelService.getUserPassport(user!.uid);
                const visited: any[] = [];
                if (passport && passport.countries) {
                    for (const [code, details] of Object.entries(passport.countries)) {
                        if (details.status === "visited") {
                            visited.push({ code, ...details });
                        }
                    }
                }
                setPassportCountries(visited);

                // 2. Fetch documents for all trips
                const docsList: any[] = [];
                await Promise.all(
                    trips.map(async (trip) => {
                        try {
                            const docs = await travelService.getTripDocuments(trip.id);
                            docs.forEach(d => docsList.push({ ...d, tripName: trip.name }));
                        } catch (e) {
                            console.error(`Error loading docs for trip ${trip.id}:`, e);
                        }
                    })
                );
                setSavedDocuments(docsList);
            } catch (err) {
                console.error("Error fetching user profile stats:", err);
            } finally {
                setLoadingStats(false);
            }
        }
        fetchStatsData();
    }, [user, trips]);

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
            const key = `catchme_passport_${user.uid}`;
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
            const key = `catchme_passport_${user.uid}`;
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

    React.useEffect(() => {
        if (user) {
            travelService.getUserPreferences(user.uid).then(fetchedPrefs => {
                if (fetchedPrefs) {
                    setPrefs(fetchedPrefs);
                    localStorage.setItem(`catchme_prefs_${user.uid}`, JSON.stringify(fetchedPrefs));
                }
            }).catch(console.error);
        }
    }, [user]);

    const handleSavePrefs = async (newPrefs: typeof prefs) => {
        setPrefs(newPrefs);
        if (user) {
            try {
                localStorage.setItem(`catchme_prefs_${user.uid}`, JSON.stringify(newPrefs));
                await travelService.saveUserPreferences(user.uid, newPrefs);
            } catch (error) {
                console.error("Error saving preferences", error);
            }
        }
    };

    const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Payment card state
    const [savedCards, setSavedCards] = useState<Array<{
        id: string;
        fullNumber: string;   // full masked display number e.g. "4111111111111111"
        lastFour: string;
        holderName: string;
        expiry: string;
        network: string;
        type: "credit" | "debit";
    }>>(() => {
        try {
            const stored = typeof window !== "undefined" ? localStorage.getItem("catchme_cards") : null;
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [editingCardId, setEditingCardId] = useState<string | null>(null);
    const [revealedCardId, setRevealedCardId] = useState<string | null>(null);
    const [confirmDeleteCard, setConfirmDeleteCard] = useState<string | null>(null); // holds card.id to delete
    const [newCardNumber, setNewCardNumber] = useState("");
    const [newCardHolder, setNewCardHolder] = useState("");
    const [newCardExpiry, setNewCardExpiry] = useState("");
    const [newCardType, setNewCardType] = useState<"credit" | "debit">("credit");
    const [cardError, setCardError] = useState("");

    // Helper: format card number for display (AMEX: 4-6-5, others: 4-4-4-4)
    const formatCardDisplay = (num: string, reveal: boolean) => {
        const raw = num.replace(/\s/g, "");
        const isAmex = raw.startsWith("3");
        if (!reveal) {
            if (isAmex) return `•••• •••••• ${raw.slice(-5)}`;
            return `•••• •••• •••• ${raw.slice(-4)}`;
        }
        if (isAmex) {
            return `${raw.slice(0, 4)} ${raw.slice(4, 10)} ${raw.slice(10)}`;
        }
        return raw.replace(/(.{4})/g, "$1 ").trim();
    };

    // Helper: format input while typing (AMEX: 4-6-5, others: 4-4-4-4)
    const formatCardInput = (raw: string) => {
        const isAmex = raw.startsWith("3");
        const max = isAmex ? 15 : 16;
        const digits = raw.replace(/\D/g, "").slice(0, max);
        if (isAmex) {
            if (digits.length <= 4) return digits;
            if (digits.length <= 10) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
            return `${digits.slice(0, 4)} ${digits.slice(4, 10)} ${digits.slice(10)}`;
        }
        return digits.replace(/(.{4})/g, "$1 ").trim();
    };

    const resetCardForm = () => {
        setIsAddingCard(false);
        setEditingCardId(null);
        setNewCardNumber("");
        setNewCardHolder("");
        setNewCardExpiry("");
        setNewCardType("credit");
        setCardError("");
    };

    const handleCardSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const rawNum = newCardNumber.replace(/\s/g, "");
        const isAmex = rawNum.startsWith("3");
        const expectedLength = isAmex ? 15 : 16;
        if (rawNum.length !== expectedLength) {
            setCardError(`Las tarjetas ${isAmex ? "Amex" : "Visa/Mastercard"} tienen ${expectedLength} dígitos.`);
            return;
        }
        if (!/^\d{2}\/\d{2}$/.test(newCardExpiry)) {
            setCardError("La expiración debe tener formato MM/AA.");
            return;
        }
        if (!newCardHolder.trim()) {
            setCardError("Ingresa el nombre del titular.");
            return;
        }
        const lastFour = rawNum.slice(-4);
        const firstDigit = rawNum[0];
        const network = firstDigit === "4" ? "visa" : firstDigit === "5" ? "mastercard" : firstDigit === "3" ? "amex" : "other";
        let updated;
        if (editingCardId) {
            updated = savedCards.map(c => c.id === editingCardId
                ? { ...c, fullNumber: rawNum, lastFour, holderName: newCardHolder.trim().toUpperCase(), expiry: newCardExpiry, network, type: newCardType }
                : c
            );
        } else {
            const newCard = { id: Date.now().toString(), fullNumber: rawNum, lastFour, holderName: newCardHolder.trim().toUpperCase(), expiry: newCardExpiry, network, type: newCardType };
            updated = [...savedCards, newCard];
        }
        setSavedCards(updated);
        try { localStorage.setItem("catchme_cards", JSON.stringify(updated)); } catch {}
        resetCardForm();
    };

    // Support Modal state
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [feedbackType, setFeedbackType] = useState<"queja" | "sugerencia" | "bug">("sugerencia");
    const [feedbackMsg, setFeedbackMsg] = useState("");

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (tempName.trim()) {
            setDisplayName(tempName.trim());
            if (user) updateProfile(user, { displayName: tempName.trim() }).catch(console.error);
            setIsEditProfileOpen(false);
        }
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (!file.type.startsWith("image/")) {
            setPhotoError("El archivo debe ser una imagen.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setPhotoError("La imagen debe pesar menos de 10MB.");
            return;
        }

        setPhotoError("");
        setIsUploadingPhoto(true);
        try {
            const compressed = await compressImage(file);
            await travelService.saveUserPhoto(user.uid, compressed);
            setPhotoURL(compressed);
        } catch (err: any) {
            console.error("Error saving photo:", err);
            setPhotoError("Error al guardar la foto. Intentá de nuevo.");
        } finally {
            setIsUploadingPhoto(false);
            e.target.value = "";
        }
    };

    const handleSendSupport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackMsg.trim()) return;

        const typeLabel = feedbackType === "queja" ? "Queja" : feedbackType === "bug" ? "Reportar Bug" : "Sugerencia de Mejora";
        const email = "facundomatiasrios108@gmail.com";
        const subject = encodeURIComponent(`CatchMe - Soporte (${typeLabel})`);
        
        const bodyText = `Hola Facundo,

Tengo una consulta/comentario sobre CatchMe:

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
                    {/* Use label+id so file picker works reliably on iOS/PWA */}
                    <input
                        id="profile-photo-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                        disabled={isUploadingPhoto}
                    />
                    <label
                        htmlFor="profile-photo-input"
                        className="block bg-[#1877F2]/10 aspect-square rounded-[2rem] w-32 h-32 border-[0.5rem] border-white dark:border-slate-950 shadow-sm flex items-center justify-center text-[#1877F2] text-5xl font-bold uppercase overflow-hidden cursor-pointer relative"
                    >
                        {photoURL ? (
                            <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                            userInitial
                        )}
                        {isUploadingPhoto && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-[1.5rem]">
                                <Loader2 size={28} className="text-white animate-spin" />
                            </div>
                        )}
                    </label>
                    <label
                        htmlFor="profile-photo-input"
                        className="absolute bottom-1 right-1 bg-[#1877F2] text-white p-2 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                    >
                        <Edit2 size={16} strokeWidth={2.5} />
                    </label>
                </div>
                {photoError && (
                    <p className="mt-2 text-xs text-red-500 font-medium text-center max-w-[200px]">{photoError}</p>
                )}
                <div className="mt-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{displayName}</h2>
                        <button
                            onClick={() => { setTempName(displayName); setIsEditProfileOpen(true); }}
                            className="text-slate-400 hover:text-blue-500 transition-colors"
                        >
                            <Edit2 size={14} />
                        </button>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">{user?.email}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 px-6 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div 
                    onClick={() => setActiveStatDetail("trips")}
                    className="flex flex-col items-center justify-center bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl p-5 border border-blue-500/10 transition-all hover:bg-blue-500/10 dark:hover:bg-blue-500/20 active:scale-95 cursor-pointer shadow-sm"
                >
                    <div className="text-blue-500 dark:text-blue-400 text-2xl font-black h-8 flex items-center justify-center">
                        {tripsCount}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1 text-center leading-tight">Viajes<br />Planeados</p>
                </div>
                <div 
                    onClick={() => setActiveStatDetail("countries")}
                    className="flex flex-col items-center justify-center bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl p-5 border border-emerald-500/10 transition-all hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 active:scale-95 cursor-pointer shadow-sm"
                >
                    <div className="text-emerald-500 dark:text-emerald-400 text-2xl font-black h-8 flex items-center justify-center">
                        {loadingStats ? <Loader2 size={20} className="animate-spin opacity-50" /> : passportCountries.length}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1 text-center leading-tight">Países<br />Visitados</p>
                </div>
                <div 
                    onClick={() => setActiveStatDetail("docs")}
                    className="flex flex-col items-center justify-center bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl p-5 border border-indigo-500/10 transition-all hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 active:scale-95 cursor-pointer shadow-sm"
                >
                    <div className="text-indigo-500 dark:text-indigo-400 text-2xl font-black h-8 flex items-center justify-center">
                        {loadingStats ? <Loader2 size={20} className="animate-spin opacity-50" /> : savedDocuments.length}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1 text-center leading-tight">Docs<br />Guardados</p>
                </div>
            </div>

            {/* Menu List */}
            <div className="flex flex-col gap-3 px-6 mb-10">
                {/* Mi Pasaporte Digital */}
                <button 
                    onClick={() => {
                        setPassportState("cover");
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
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Alertas de Estado de Vuelo</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Notificaciones de demoras (Próximamente)</p>
                                    </div>
                                    <button 
                                        onClick={() => handleSavePrefs({ ...prefs, vueloAlerts: !prefs.vueloAlerts })}
                                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${prefs.vueloAlerts ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute shadow-sm transition-transform duration-200 ${prefs.vueloAlerts ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recomendaciones Inteligentes</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Hoteles para tus destinos con IA</p>
                                    </div>
                                    <button 
                                        onClick={() => handleSavePrefs({ ...prefs, hotelRecs: !prefs.hotelRecs })}
                                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${prefs.hotelRecs ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute shadow-sm transition-transform duration-200 ${prefs.hotelRecs ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Control de Presupuesto</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Alerta cuando gastes más del 80%</p>
                                    </div>
                                    <button 
                                        onClick={() => handleSavePrefs({ ...prefs, budgetAlerts: !prefs.budgetAlerts })}
                                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${prefs.budgetAlerts ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute shadow-sm transition-transform duration-200 ${prefs.budgetAlerts ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                        </div>
                        <button onClick={() => setIsPrefsOpen(false)} className="w-full mt-6 py-3 font-bold rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/25">Aceptar</button>
                    </div>
                </div>
            )}

            {/* MODAL 3: METODOS DE PAGO */}
            {isPaymentsOpen && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:fade-in duration-300">
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-black">
                                {(isAddingCard || editingCardId) ? (editingCardId ? "Editar Tarjeta" : "Nueva Tarjeta") : "Métodos de Pago"}
                            </h3>
                            <button
                                onClick={() => { setIsPaymentsOpen(false); resetCardForm(); setRevealedCardId(null); }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-6 pb-6 max-h-[75vh] overflow-y-auto">
                            {/* ── CARD LIST VIEW ── */}
                            {!isAddingCard && !editingCardId && (<>
                                {savedCards.length > 0 && (
                                    <div className="space-y-3 mt-5">
                                        {savedCards.map((card) => {
                                            const isRevealed = revealedCardId === card.id;
                                            // Legacy cards (saved before fullNumber was stored) only have lastFour
                                            const hasFullNumber = card.fullNumber && card.fullNumber.length > 4;
                                            const displayNum = hasFullNumber
                                                ? (isRevealed
                                                    ? formatCardDisplay(card.fullNumber, true)
                                                    : formatCardDisplay(card.fullNumber, false))
                                                : (card.network === "amex"
                                                    ? `•••• •••••• ${card.lastFour.slice(-5)}`
                                                    : `•••• •••• •••• ${card.lastFour}`);
                                            return (
                                                <div key={card.id}>
                                                    {/* Card face */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!hasFullNumber) return;
                                                            setRevealedCardId(isRevealed ? null : card.id);
                                                        }}
                                                        className={`w-full text-left bg-gradient-to-br from-slate-800 to-slate-950 text-white p-5 rounded-2xl border border-slate-700/50 shadow-lg overflow-hidden transition-transform ${hasFullNumber ? "active:scale-[0.98] cursor-pointer" : "cursor-default"}`}
                                                    >
                                                        {/* Network watermark — bottom-right, not a circle */}
                                                        <span className="absolute right-5 bottom-3 opacity-10 text-6xl font-black italic pointer-events-none select-none">
                                                            {card.network === "visa" ? "VISA" : card.network === "mastercard" ? "MC" : card.network === "amex" ? "AMEX" : ""}
                                                        </span>
                                                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                                            {card.network.toUpperCase()} • {card.type === "credit" ? "Crédito" : "Débito"}
                                                        </p>
                                                        <h4 className="text-lg font-bold mt-3 tracking-[0.12em] font-mono transition-all duration-200">
                                                            {displayNum}
                                                        </h4>
                                                        <div className="flex justify-between items-center mt-5">
                                                            <span className="text-xs font-semibold text-slate-300">{card.holderName}</span>
                                                            <span className="text-xs font-bold">{card.expiry}</span>
                                                        </div>
                                                        {/* Reveal hint */}
                                                        {hasFullNumber && (
                                                            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                                {isRevealed ? "Toca para ocultar" : "Toca para ver número completo"}
                                                            </p>
                                                        )}
                                                        {!hasFullNumber && (
                                                            <p className="mt-2 text-[10px] font-medium text-slate-600">
                                                                Editá la tarjeta para guardar el número completo
                                                            </p>
                                                        )}
                                                    </button>

                                                    {/* Edit / Delete buttons */}
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingCardId(card.id);
                                                                setNewCardNumber(hasFullNumber ? formatCardDisplay(card.fullNumber, true) : "");
                                                                setNewCardHolder(card.holderName);
                                                                setNewCardExpiry(card.expiry);
                                                                setNewCardType(card.type);
                                                                setCardError("");
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition active:scale-95"
                                                        >
                                                            <Edit2 size={13} /> Editar
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDeleteCard(card.id)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 dark:hover:text-rose-400 transition active:scale-95"
                                                        >
                                                            <Trash2 size={13} /> Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Empty state */}
                                {savedCards.length === 0 && (
                                    <div className="mt-6 text-center py-8 text-slate-400 dark:text-slate-500">
                                        <div className="text-4xl mb-3">💳</div>
                                        <p className="text-sm font-semibold">No tienes tarjetas guardadas</p>
                                        <p className="text-xs mt-1 opacity-70">Agrega una para comenzar</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => { setIsAddingCard(true); setEditingCardId(null); }}
                                    className="mt-4 flex items-center justify-center gap-2 w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-sm font-bold cursor-pointer hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors active:scale-[0.98]"
                                >
                                    <span className="text-lg">+</span>
                                    <span>Agregar Tarjeta</span>
                                </button>
                            </>)}

                            {/* ── ADD / EDIT FORM ── */}
                            {(isAddingCard || editingCardId) && (
                                <form onSubmit={handleCardSubmit} className="mt-5 space-y-4">
                                    {/* Live card preview */}
                                    <div className="bg-gradient-to-br from-slate-800 to-slate-950 text-white p-5 rounded-2xl border border-slate-700/50 shadow-lg overflow-hidden relative">
                                        <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
                                        <div className="absolute right-5 bottom-4 opacity-20 text-5xl font-black italic pointer-events-none select-none">
                                            {(() => {
                                                const d = newCardNumber.replace(/\s/g, "")[0];
                                                return d === "4" ? "VISA" : d === "5" ? "MC" : d === "3" ? "AMEX" : "💳";
                                            })()}
                                        </div>
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                            {(() => {
                                                const d = newCardNumber.replace(/\s/g, "")[0];
                                                const net = d === "4" ? "VISA" : d === "5" ? "MASTERCARD" : d === "3" ? "AMEX" : "TARJETA";
                                                const t = newCardType === "credit" ? "Crédito" : "Débito";
                                                return `${net} • ${t}`;
                                            })()}
                                        </p>
                                        <h4 className="text-lg font-bold mt-3 tracking-[0.12em] font-mono min-h-[28px]">
                                            {newCardNumber || "•••• •••• •••• ••••"}
                                        </h4>
                                        <div className="flex justify-between items-center mt-5">
                                            <span className="text-xs font-semibold text-slate-300">{newCardHolder || "TITULAR"}</span>
                                            <span className="text-xs font-bold">{newCardExpiry || "MM/AA"}</span>
                                        </div>
                                    </div>

                                    {/* Card number */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Número de Tarjeta</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={19}
                                            placeholder="1234 5678 9012 3456"
                                            value={newCardNumber}
                                            onChange={(e) => {
                                                setNewCardNumber(formatCardInput(e.target.value));
                                                setCardError("");
                                            }}
                                            required
                                            className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold tracking-widest focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition text-slate-900 dark:text-white placeholder:font-normal placeholder:tracking-normal"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1 ml-1">
                                            {newCardNumber.replace(/\s/g, "").startsWith("3") ? "AMEX: 15 dígitos (4-6-5)" : "Visa / Mastercard: 16 dígitos (4-4-4-4)"}
                                        </p>
                                    </div>

                                    {/* Holder name */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Titular</label>
                                        <input
                                            type="text"
                                            placeholder="JUAN PEREZ"
                                            value={newCardHolder}
                                            onChange={(e) => { setNewCardHolder(e.target.value.toUpperCase()); setCardError(""); }}
                                            required
                                            className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold tracking-widest focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition text-slate-900 dark:text-white placeholder:font-normal placeholder:tracking-normal"
                                        />
                                    </div>

                                    {/* Expiry + type */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Vencimiento</label>
                                            <input
                                                type="text"
                                                placeholder="MM/AA"
                                                maxLength={5}
                                                value={newCardExpiry}
                                                onChange={(e) => {
                                                    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                                                    if (val.length >= 3) val = val.slice(0, 2) + "/" + val.slice(2);
                                                    setNewCardExpiry(val);
                                                    setCardError("");
                                                }}
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition text-slate-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Tipo</label>
                                            <select
                                                value={newCardType}
                                                onChange={(e) => setNewCardType(e.target.value as "credit" | "debit")}
                                                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition text-slate-900 dark:text-white"
                                            >
                                                <option value="credit">Crédito</option>
                                                <option value="debit">Débito</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Error */}
                                    {cardError && (
                                        <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                                            <span>⚠️</span> {cardError}
                                        </p>
                                    )}

                                    {/* Form actions */}
                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <button
                                            type="button"
                                            onClick={resetCardForm}
                                            className="py-3 font-bold rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm active:scale-95"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="py-3 font-bold rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:from-blue-600 hover:to-indigo-700 transition text-sm active:scale-95"
                                        >
                                            {editingCardId ? "Actualizar" : "Guardar"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Footer */}
                        {!isAddingCard && !editingCardId && (
                            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => { setIsPaymentsOpen(false); setRevealedCardId(null); }}
                                    className="w-full py-3 font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition active:scale-95"
                                >
                                    Listo
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* CONFIRM DELETE CARD */}
            <ConfirmDialog
                isOpen={!!confirmDeleteCard}
                onClose={() => setConfirmDeleteCard(null)}
                onConfirm={() => {
                    if (!confirmDeleteCard) return;
                    if (revealedCardId === confirmDeleteCard) setRevealedCardId(null);
                    const updated = savedCards.filter(c => c.id !== confirmDeleteCard);
                    setSavedCards(updated);
                    try { localStorage.setItem("catchme_cards", JSON.stringify(updated)); } catch {}
                    setConfirmDeleteCard(null);
                }}
                title="Eliminar tarjeta"
                message={`¿Seguro que quieres eliminar la tarjeta terminada en ${savedCards.find(c => c.id === confirmDeleteCard)?.lastFour ?? ""}? Esta acción no se puede deshacer.`}
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                variant="danger"
            />

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
                                    <p className="text-[10px] text-slate-400 mt-0.5">CatchMe v2.4.1 Premium</p>
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

            {/* Stats Detail Modal */}
            {activeStatDetail && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:fade-in duration-300">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                                {activeStatDetail === "trips" && <Calendar className="text-blue-500" size={20} />}
                                {activeStatDetail === "countries" && <Globe className="text-emerald-500" size={20} />}
                                {activeStatDetail === "docs" && <FileText className="text-indigo-500" size={20} />}
                                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                                    {activeStatDetail === "trips" && "Viajes Planeados"}
                                    {activeStatDetail === "countries" && "Países Visitados"}
                                    {activeStatDetail === "docs" && "Documentos Guardados"}
                                </h3>
                            </div>
                            <button
                                onClick={() => setActiveStatDetail(null)}
                                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* List Content */}
                        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3 scrollbar-thin">
                            {activeStatDetail === "trips" && (
                                trips.length === 0 ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No tienes viajes planeados aún.</p>
                                ) : (
                                    trips.map(trip => (
                                        <div 
                                            key={trip.id} 
                                            onClick={() => { window.location.href = `/trip/${trip.id}`; }}
                                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-850 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 cursor-pointer transition-all active:scale-[0.98] group"
                                        >
                                            <div className="flex flex-col min-w-0 pr-4">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{trip.name}</span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{trip.destination}</span>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                    ))
                                )
                            )}

                            {activeStatDetail === "countries" && (
                                loadingStats ? (
                                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /></div>
                                ) : passportCountries.length === 0 ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No has marcado países visitados en tu mapa.</p>
                                ) : (
                                    passportCountries.map(pc => {
                                        const cMeta = countriesList.find(c => c.id === pc.code);
                                        return (
                                            <div 
                                                key={pc.code} 
                                                className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-850"
                                            >
                                                <span className="text-2xl">{cMeta?.flag || "🏳️"}</span>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{cMeta?.spanishName || pc.code}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}

                            {activeStatDetail === "docs" && (
                                loadingStats ? (
                                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>
                                ) : savedDocuments.length === 0 ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No tienes documentos guardados.</p>
                                ) : (
                                    savedDocuments.map(doc => (
                                        <div 
                                            key={doc.id} 
                                            onClick={() => {
                                                // If it's a real external URL, open it directly
                                                if (doc.url && !doc.url.startsWith("localcache_") && (doc.url.startsWith("http") || doc.url.startsWith("data:"))) {
                                                    window.open(doc.url, "_blank");
                                                } else {
                                                    // For local-cached or Firestore docs, navigate to the trip's docs page
                                                    window.location.href = `/trip/${doc.tripId}/docs`;
                                                }
                                            }}
                                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-850 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 cursor-pointer transition-all active:scale-[0.98] group"
                                        >
                                            <div className="flex flex-col min-w-0 pr-4">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{doc.title}</span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{doc.type} • Viaje: {doc.tripName}</span>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                    ))
                                )
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
                            <button
                                onClick={() => setActiveStatDetail(null)}
                                className="font-bold px-5 py-2.5 rounded-full text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 text-xs"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

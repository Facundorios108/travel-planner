"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Briefcase, CheckSquare, Square, Plus, Trash2, ShieldAlert, Sparkles, HelpCircle, RefreshCw, Calculator, DollarSign, Users, Award, Percent } from "lucide-react";

interface PackingItem {
    id: string;
    text: string;
    checked: boolean;
    category: string;
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

export default function TravelTools() {
    const { user } = useAuth();
    const [subTab, setSubTab] = useState<"packing" | "calculator" | "currency">("packing");

    // Packing Checklist States
    const [packingList, setPackingList] = useState<PackingItem[]>([]);
    const [newItemText, setNewItemText] = useState("");
    const [newItemCategory, setNewItemCategory] = useState("Ropa");
    const [activeProfile, setActiveProfile] = useState<string>("");

    // Tip Calculator States
    const [billAmount, setBillAmount] = useState<string>("");
    const [tipPercent, setTipPercent] = useState<number>(10);
    const [splitPeople, setSplitPeople] = useState<number>(1);

    // Currency States
    const [usdAmount, setUsdAmount] = useState<string>("100");

    // Load packing list from LocalStorage
    useEffect(() => {
        if (!user) return;
        const stored = localStorage.getItem(`stayfinder_packing_${user.uid}`);
        if (stored) {
            try {
                setPackingList(JSON.parse(stored));
            } catch (e) {
                console.error("Error parsing packing list", e);
            }
        } else {
            // Prefill with a small default
            applyProfilePreset("playa", false);
        }
    }, [user]);

    // Save packing list
    const saveList = (list: PackingItem[]) => {
        setPackingList(list);
        if (user) {
            localStorage.setItem(`stayfinder_packing_${user.uid}`, JSON.stringify(list));
        }
    };

    const applyProfilePreset = (profileKey: string, confirm = true) => {
        if (confirm && packingList.length > 0) {
            const accept = window.confirm("¿Deseas reemplazar tu lista actual con el nuevo perfil de equipaje?");
            if (!accept) return;
        }

        const profile = DEFAULT_PROFILES[profileKey];
        const newItems: PackingItem[] = [];
        
        Object.entries(profile).forEach(([category, items]) => {
            items.forEach((itemText) => {
                newItems.push({
                    id: `${Date.now()}_${Math.random().toString(36).substring(5)}`,
                    text: itemText,
                    checked: false,
                    category
                });
            });
        });

        saveList(newItems);
        setActiveProfile(profileKey);
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
            category: newItemCategory
        };

        saveList([...packingList, item]);
        setNewItemText("");
    };

    const clearAllItems = () => {
        const accept = window.confirm("¿Seguro que deseas vaciar tu lista de equipaje?");
        if (accept) {
            saveList([]);
            setActiveProfile("");
        }
    };

    // Calculate packing progress
    const totalItems = packingList.length;
    const checkedItems = packingList.filter(i => i.checked).length;
    const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    // Tip Calculator Math
    const bill = parseFloat(billAmount) || 0;
    const totalTip = bill * (tipPercent / 100);
    const totalBill = bill + totalTip;
    const tipPerPerson = totalTip / (splitPeople || 1);
    const billPerPerson = totalBill / (splitPeople || 1);

    // Currency Rates (Mocked static rates for premium presentation)
    const usd = parseFloat(usdAmount) || 0;
    const conversions = [
        { code: "EUR", name: "Euro", rate: 0.92, flag: "🇪🇺" },
        { code: "ARS", name: "Peso Argentino", rate: 900.0, flag: "🇦🇷" },
        { code: "BRL", name: "Real Brasileño", rate: 5.15, flag: "🇧🇷" },
        { code: "CLP", name: "Peso Chileno", rate: 890.0, flag: "🇨🇱" },
        { code: "MXN", name: "Peso Mexicano", rate: 16.7, flag: "🇲🇽" }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Branded Header */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-6 rounded-[2rem] border border-indigo-500/10 flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                <div className="space-y-1 relative z-10">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Sparkles className="text-indigo-500 animate-pulse" size={22} />
                        Herramientas
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Equipaje, propinas y conversiones rápidas.</p>
                </div>
                <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl flex items-center justify-center text-indigo-500 shadow-md">
                    <Briefcase size={22} />
                </div>
            </div>

            {/* Sub-tabs selectors */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/20 dark:border-slate-800/40">
                <button
                    onClick={() => setSubTab("packing")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${subTab === "packing" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                >
                    Equipaje
                </button>
                <button
                    onClick={() => setSubTab("calculator")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${subTab === "calculator" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                >
                    Propinas
                </button>
                <button
                    onClick={() => setSubTab("currency")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${subTab === "currency" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                >
                    Moneda
                </button>
            </div>

            {/* TAB CONTENT: PACKING CHECKLIST */}
            {subTab === "packing" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Destination profile presets */}
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

                    {/* Progress Bar */}
                    {totalItems > 0 && (
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-2.5">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Progreso del Equipaje</span>
                                <span className="text-xs font-black text-indigo-500">{progressPercent}% completado</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase pt-1">
                                <span>{checkedItems} empacados</span>
                                <span>{totalItems} total</span>
                            </div>
                        </div>
                    )}

                    {/* Form to add item */}
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

                    {/* Packing list items grouped by category */}
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
                                                <div 
                                                    key={item.id} 
                                                    onClick={() => toggleItem(item.id)}
                                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition group"
                                                >
                                                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                        <div className={`shrink-0 transition-colors ${item.checked ? "text-indigo-500" : "text-slate-400"}`}>
                                                            {item.checked ? (
                                                                <CheckSquare size={20} strokeWidth={2.5} />
                                                            ) : (
                                                                <Square size={20} strokeWidth={2} />
                                                            )}
                                                        </div>
                                                        <span className={`text-sm truncate select-none transition-all ${item.checked ? "text-slate-400 line-through decoration-indigo-400" : "text-slate-850 dark:text-slate-200 font-medium"}`}>
                                                            {item.text}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="flex justify-center pt-2">
                                <button 
                                    onClick={clearAllItems}
                                    className="text-xs text-red-500 hover:text-red-600 font-bold bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/25 px-5 py-2.5 rounded-full transition-all active:scale-95"
                                >
                                    Vaciar Todo
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: TIP CALCULATOR */}
            {subTab === "calculator" && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-4">
                        {/* Bill Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                                <DollarSign size={14} className="text-indigo-500" />
                                Importe de la Cuenta ($)
                            </label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={billAmount}
                                onChange={(e) => setBillAmount(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-xl font-black focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                                min="0"
                                step="any"
                            />
                        </div>

                        {/* Tip selection */}
                        <div className="space-y-3">
                            <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                                <Percent size={14} className="text-indigo-500" />
                                Porcentaje de Propina ({tipPercent}%)
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[5, 10, 15, 20].map((percentVal) => (
                                    <button
                                        key={percentVal}
                                        onClick={() => setTipPercent(percentVal)}
                                        className={`py-3 rounded-xl text-sm font-bold border transition ${tipPercent === percentVal
                                            ? "bg-indigo-500 text-white border-transparent shadow-md shadow-indigo-500/20"
                                            : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                                            }`}
                                    >
                                        {percentVal}%
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Split People */}
                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                                <Users size={14} className="text-indigo-500" />
                                Dividir en Personas
                            </label>
                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                                <button 
                                    type="button" 
                                    onClick={() => setSplitPeople(Math.max(1, splitPeople - 1))}
                                    className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex items-center justify-center font-black text-xl shadow-sm border border-slate-100 dark:border-slate-800 active:scale-95 transition"
                                >
                                    -
                                </button>
                                <span className="flex-1 text-center font-black text-lg text-slate-800 dark:text-slate-200">{splitPeople} {splitPeople === 1 ? "persona" : "personas"}</span>
                                <button 
                                    type="button" 
                                    onClick={() => setSplitPeople(splitPeople + 1)}
                                    className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex items-center justify-center font-black text-xl shadow-sm border border-slate-100 dark:border-slate-800 active:scale-95 transition"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Split results box */}
                    <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 text-white rounded-[2rem] p-6 shadow-xl shadow-indigo-500/20 space-y-5 relative overflow-hidden">
                        <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                        <h4 className="text-xs uppercase font-extrabold tracking-widest text-indigo-200 flex items-center gap-2">
                            <Award size={14} /> Resumen de la División
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4 divide-x divide-white/20">
                            <div className="space-y-1 pl-1">
                                <p className="text-[10px] uppercase font-bold text-indigo-100">Propina p/persona</p>
                                <p className="text-2xl font-black">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tipPerPerson)}</p>
                            </div>
                            <div className="space-y-1 pl-4">
                                <p className="text-[10px] uppercase font-bold text-indigo-100">Total p/persona</p>
                                <p className="text-2xl font-black">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(billPerPerson)}</p>
                            </div>
                        </div>

                        <div className="h-[1px] bg-white/20 w-full pt-1"></div>

                        <div className="flex justify-between items-center text-xs font-bold pt-1 text-indigo-100">
                            <span>Total Cuenta: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(bill)}</span>
                            <span>Total Propina: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalTip)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: CURRENCY CONVERTER */}
            {subTab === "currency" && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                                Importe de origen (Dólares USD 🇺🇸)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 font-extrabold text-lg">$</div>
                                <input
                                    type="number"
                                    value={usdAmount}
                                    onChange={(e) => setUsdAmount(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-5 py-4 text-xl font-black focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                                    placeholder="100"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider block px-1">Tipos de cambio de destino</label>
                            
                            <div className="space-y-3">
                                {conversions.map((conv) => {
                                    const value = usd * conv.rate;
                                    const formattedVal = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(value);

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
                                                <p className="font-black text-base text-slate-900 dark:text-white">{formattedVal} {conv.code}</p>
                                                <p className="text-[9px] font-extrabold text-slate-400 mt-0.5">1 USD = {conv.rate} {conv.code}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

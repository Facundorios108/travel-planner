"use client";

import React, { useState } from "react";
import { useToast } from "./Toast";
import { format } from "date-fns";
import { ExpenseCategory } from "@/types/travel";
import { Plane, Bed, Utensils, CarTaxiFront, ShoppingBag, Ticket, MoreHorizontal, X } from "lucide-react";
import { hapticFeedback } from "@/utils/haptics";

interface AddExpenseModalProps {
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

export default function AddExpenseModal({ onClose, onSave }: AddExpenseModalProps) {
    const { showToast, ToastComponent } = useToast();
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [category, setCategory] = useState<ExpenseCategory>("other");
    const [date, setDate] = useState<Date>(new Date());
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const categories: { value: ExpenseCategory, label: string, icon: React.ElementType }[] = [
        { value: "flight", label: "Vuelo", icon: Plane },
        { value: "accommodation", label: "Alojamiento", icon: Bed },
        { value: "food", label: "Comida", icon: Utensils },
        { value: "transport", label: "Transporte", icon: CarTaxiFront },
        { value: "activities", label: "Actividades", icon: Ticket },
        { value: "shopping", label: "Compras", icon: ShoppingBag },
        { value: "other", label: "Otros", icon: MoreHorizontal },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !amount || isNaN(Number(amount))) {
            showToast("Por favor completa el título y monto.", "warning");
            return;
        }

        setIsSaving(true);
        try {
            await onSave({
                title,
                amount: Number(amount),
                currency,
                category,
                date
            });
            setIsSuccess(true);
            hapticFeedback.success();
            setTimeout(() => {
                onClose();
            }, 1300);
        } catch (error) {
            console.error("Error saving expense:", error);
            showToast("Error al guardar el gasto.", "error");
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
            {ToastComponent}
            <div className="bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:fade-in duration-300">
                {isSuccess ? (
                    <div className="px-8 py-16 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                        <style>{`
                            @keyframes draw-circle {
                                to { stroke-dashoffset: 0; }
                            }
                            @keyframes draw-check {
                                to { stroke-dashoffset: 0; }
                            }
                            @keyframes scale-up {
                                0% { transform: scale(0.6); opacity: 0; }
                                50% { transform: scale(1.1); }
                                100% { transform: scale(1); opacity: 1; }
                            }
                        `}</style>
                        <div className="relative mb-6">
                            <svg 
                                className="w-24 h-24 text-emerald-500 stroke-current" 
                                viewBox="0 0 52 52"
                                style={{
                                    animation: "scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
                                }}
                            >
                                <circle 
                                    cx="26" 
                                    cy="26" 
                                    r="23" 
                                    fill="none" 
                                    strokeWidth="3.5"
                                    style={{
                                        strokeDasharray: 150,
                                        strokeDashoffset: 150,
                                        animation: "draw-circle 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards"
                                    }}
                                />
                                <path 
                                    fill="none" 
                                    strokeWidth="4" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    d="M16 26l7 7 14-14"
                                    style={{
                                        strokeDasharray: 50,
                                        strokeDashoffset: 50,
                                        animation: "draw-check 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.7s forwards"
                                    }}
                                />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">¡Gasto Guardado!</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Se ha registrado exitosamente.</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="px-8 py-6 flex justify-between items-center">
                            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Añadir Gasto</h2>
                            <button
                                onClick={onClose}
                                className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-8 pb-8">
                            <form onSubmit={handleSubmit} className="space-y-7">
                                {/* Title */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                                        Título del Gasto
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-100 text-base font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        placeholder="Ej. Cena restaurante"
                                        autoFocus
                                    />
                                </div>

                                {/* Amount & Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                                            Monto
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-100 text-lg font-bold placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                                            Fecha
                                        </label>
                                        <input
                                            type="date"
                                            value={format(date, "yyyy-MM-dd")}
                                            onChange={(e) => {
                                                if (e.target.value) setDate(new Date(e.target.value));
                                            }}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Categoría */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                                        Categoría
                                    </label>
                                    <div className="flex flex-wrap gap-2.5">
                                        {categories.map((cat) => {
                                            const Icon = cat.icon;
                                            return (
                                                <button
                                                    key={cat.value}
                                                    type="button"
                                                    onClick={() => setCategory(cat.value)}
                                                    className={`flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold transition-all duration-200 ${category === cat.value
                                                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105"
                                                        }`}
                                                >
                                                    <Icon size={16} />
                                                    {cat.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-6 grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="w-full font-bold px-6 py-4 rounded-full border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 active:scale-95"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full font-bold px-6 py-4 rounded-full text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-xl shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? "Guardando..." : "Guardar Gasto"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

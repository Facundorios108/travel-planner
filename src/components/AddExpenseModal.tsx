"use client";

import React, { useState } from "react";
import { useToast } from "./Toast";
import { format } from "date-fns";
import { ExpenseCategory } from "@/types/travel";
import { Plane, Bed, Utensils, CarTaxiFront, ShoppingBag, Ticket, MoreHorizontal, X } from "lucide-react";

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
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
            {ToastComponent}
            <div className="bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:fade-in duration-300">
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
            </div>
        </div>
    );
}

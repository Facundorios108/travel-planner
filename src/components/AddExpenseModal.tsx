"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { ExpenseCategory } from "@/types/travel";
import { Plane, Bed, Utensils, CarTaxiFront, ShoppingBag, Ticket, MoreHorizontal, X } from "lucide-react";

interface AddExpenseModalProps {
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

export default function AddExpenseModal({ onClose, onSave }: AddExpenseModalProps) {
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
            alert("Por favor completa el título y el monto validamente.");
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Añadir Gasto</h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Title & Amount inline */}
                        <div className="flex gap-4">
                            <div className="flex-[2]">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Título
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full text-slate-900 bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Ej. Cena restaurante"
                                />
                            </div>
                            <div className="flex-[1]">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Monto
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full text-slate-900 bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Fecha
                            </label>
                            <input
                                type="date"
                                value={format(date, "yyyy-MM-dd")}
                                onChange={(e) => {
                                    if (e.target.value) setDate(new Date(e.target.value));
                                }}
                                className="w-full text-slate-900 bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        {/* Chips / Categories */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Categoría
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => setCategory(cat.value)}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${category === cat.value
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                                            }`}
                                    >
                                        <cat.icon size={16} />
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full font-bold px-6 py-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full font-bold px-6 py-4 rounded-xl text-white bg-[#1877F2] hover:bg-blue-600 border border-blue-400 shadow-[0_4px_12px_rgba(24,119,242,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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

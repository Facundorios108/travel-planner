"use client";

import React, { useState } from "react";
import { useToast } from "./Toast";
import { format } from "date-fns";
import { Expense, ExpenseCategory } from "@/types/travel";
import { Plane, Bed, Utensils, CarTaxiFront, ShoppingBag, Ticket, MoreHorizontal, X, Trash2 } from "lucide-react";
import { hapticFeedback } from "@/utils/haptics";
import { useAuth } from "@/context/AuthContext";

interface AddExpenseModalProps {
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    participants?: string[];
    defaultPaidBy?: string;
    expense?: Expense;
    onDelete?: () => Promise<void>;
}

export default function AddExpenseModal({ 
    onClose, 
    onSave,
    participants = [],
    defaultPaidBy,
    expense,
    onDelete
}: AddExpenseModalProps) {
    const { user } = useAuth();
    const { showToast, ToastComponent } = useToast();
    const [title, setTitle] = useState(expense?.title || "");
    const [amount, setAmount] = useState(expense?.amount?.toString() || "");
    const [currency, setCurrency] = useState(expense?.currency || "USD");
    const [category, setCategory] = useState<ExpenseCategory>(expense?.category || "other");
    const [date, setDate] = useState<Date>(expense?.date || new Date());
    const [paidBy, setPaidBy] = useState(expense?.paidBy || defaultPaidBy || user?.email || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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
                date,
                paidBy: paidBy || user?.email || ""
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

    const handleDelete = async () => {
        if (!onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete();
            setIsSuccess(true);
            hapticFeedback.success();
            setTimeout(() => {
                onClose();
            }, 1300);
        } catch (error) {
            console.error("Error deleting expense:", error);
            showToast("Error al eliminar el gasto.", "error");
            setIsDeleting(false);
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
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                            {isDeleting ? "¡Gasto Eliminado!" : expense ? "¡Gasto Guardado!" : "¡Gasto Guardado!"}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                            {isDeleting ? "Se ha eliminado exitosamente." : "Se ha registrado exitosamente."}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="px-8 py-6 flex justify-between items-center">
                            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{expense ? "Editar Gasto" : "Añadir Gasto"}</h2>
                            <button
                                onClick={onClose}
                                className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body & Form */}
                        <form onSubmit={handleSubmit}>
                            {/* Scrollable inputs wrapper */}
                            <div className="px-8 pb-4 max-h-[calc(85vh-200px)] overflow-y-auto space-y-5 pr-4 scrollbar-thin">
                                {/* Title */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                                        Título del Gasto
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 rounded-2xl px-5 py-3 text-slate-900 dark:text-slate-100 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        placeholder="Ej. Cena restaurante"
                                        autoFocus
                                    />
                                </div>

                                {/* Amount & Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                                            Monto
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 rounded-2xl px-5 py-3 text-slate-900 dark:text-slate-100 text-base font-bold placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                                            Fecha
                                        </label>
                                        <input
                                            type="date"
                                            value={format(date, "yyyy-MM-dd")}
                                            onChange={(e) => {
                                                if (e.target.value) setDate(new Date(e.target.value));
                                            }}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 rounded-2xl px-4 py-3 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* ¿Quién pagó? */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                                        ¿Quién pagó?
                                    </label>
                                    <select
                                        value={paidBy}
                                        onChange={(e) => setPaidBy(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 rounded-2xl px-5 py-3 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    >
                                        {participants && participants.length > 0 ? (
                                            participants.map((participant) => (
                                                <option key={participant} value={participant}>
                                                    {participant === user?.email ? `${participant} (Tú)` : participant}
                                                </option>
                                            ))
                                        ) : (
                                            <option value={user?.email || ""}>{user?.email || "Cargando..."}</option>
                                        )}
                                    </select>
                                </div>

                                {/* Categoría */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                                        Categoría
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map((cat) => {
                                            const Icon = cat.icon;
                                            return (
                                                <button
                                                    key={cat.value}
                                                    type="button"
                                                    onClick={() => setCategory(cat.value)}
                                                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 ${category === cat.value
                                                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105"
                                                        }`}
                                                >
                                                    <Icon size={14} />
                                                    {cat.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Actions (Sticky footer below scroll container) */}
                            <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-3">
                                {onDelete && (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={isSaving || isDeleting}
                                        className="w-full font-bold px-6 py-3 rounded-full border-2 border-rose-200 dark:border-rose-950/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Trash2 size={16} />
                                        {isDeleting ? "Eliminando..." : "Eliminar Gasto"}
                                    </button>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="w-full font-bold px-6 py-3.5 rounded-full border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 active:scale-95 text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving || isDeleting}
                                        className="w-full font-bold px-6 py-3.5 rounded-full text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-xl shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm"
                                    >
                                        {isSaving ? "Guardando..." : expense ? "Guardar" : "Guardar Gasto"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

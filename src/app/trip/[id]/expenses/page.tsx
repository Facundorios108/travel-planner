"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { travelService } from "@/lib/services";
import { Trip, Expense, ExpenseCategory } from "@/types/travel";
import TripBottomNav from "@/components/TripBottomNav";
import AddExpenseModal from "@/components/AddExpenseModal";
import { format } from "date-fns";
import { ArrowLeft, TrendingUp, Plane, Bed, Utensils, CarTaxiFront, ShoppingBag, Ticket, CreditCard, Filter, Plus, Loader2 } from "lucide-react";

export default function ExpensesPage() {
    const params = useParams();
    const router = useRouter();
    const tripId = params.id as string;

    const [trip, setTrip] = useState<Trip | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const tripData = await travelService.getTrip(tripId);
                setTrip(tripData);
                const expensesData = await travelService.getTripExpenses(tripId);
                setExpenses(expensesData);
            } catch (error) {
                console.error("Error loading expenses page data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [tripId]);

    const handleSaveExpense = async (data: any) => {
        try {
            const expId = await travelService.addExpense({
                ...data,
                tripId
            });
            const newExp = { id: expId, ...data, tripId, createdAt: new Date() } as Expense;
            setExpenses([newExp, ...expenses].sort((a, b) => b.date.getTime() - a.date.getTime()));
            setIsAddExpenseModalOpen(false);
        } catch (error) {
            console.error("Error saving expense:", error);
            alert("Error al guardar gasto.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f8f9fc] dark:bg-slate-950">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!trip) {
        return <div className="p-4">Viaje no encontrado.</div>;
    }

    // Calculating totals and phases dynamically
    const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    // Categorize expenses by phase based on trip start/end date
    const preTrip = trip.startDate ? expenses.filter(e => e.date < trip.startDate!).reduce((a, c) => a + c.amount, 0) : 0;
    const duringTrip = (trip.startDate && trip.endDate) ? expenses.filter(e => e.date >= trip.startDate! && e.date <= trip.endDate!).reduce((a, c) => a + c.amount, 0) : 0;
    const postTrip = trip.endDate ? expenses.filter(e => e.date > trip.endDate!).reduce((a, c) => a + c.amount, 0) : 0;

    const formatMoney = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const getPhaseLabel = (date: Date) => {
        if (trip.startDate && date < trip.startDate) return "Previaje";
        if (trip.endDate && date > trip.endDate) return "Postviaje";
        return "Durante el viaje";
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'flight': return { icon: Plane, color: "text-primary bg-primary/10" };
            case 'accommodation': return { icon: Bed, color: "text-amber-600 bg-amber-100" };
            case 'food': return { icon: Utensils, color: "text-orange-600 bg-orange-100" };
            case 'transport': return { icon: CarTaxiFront, color: "text-blue-600 bg-blue-100" };
            case 'shopping': return { icon: ShoppingBag, color: "text-purple-600 bg-purple-100" };
            case 'activities': return { icon: Ticket, color: "text-green-600 bg-green-100" };
            default: return { icon: CreditCard, color: "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800" };
        }
    };

    return (
        <div className="bg-[#f8f9fc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans">
            <header className="sticky top-0 z-10 bg-[#f8f9fc]/80 dark:bg-slate-950/80 backdrop-blur-md px-6 pt-6 pb-4 flex items-center justify-between">
                <button onClick={() => router.back()} className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm">
                    <ArrowLeft size={24} className="text-slate-900 dark:text-slate-100" />
                </button>
                <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
                <div className="relative">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`w-12 h-12 flex items-center justify-center rounded-full shadow-sm transition-colors ${activeFilter !== "all" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600" : "bg-white dark:bg-slate-800"}`}
                    >
                        <Filter size={20} className={activeFilter !== "all" ? "text-blue-600" : "text-slate-900 dark:text-slate-100"} />
                    </button>
                    {isFilterOpen && (
                        <div className="absolute top-14 right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden z-20 animate-in fade-in zoom-in duration-200">
                            <div className="py-2">
                                <button
                                    onClick={() => { setActiveFilter("all"); setIsFilterOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 ${activeFilter === "all" ? "text-blue-600 bg-blue-50/50 dark:bg-blue-900/20" : "text-slate-700 dark:text-slate-300"}`}
                                >
                                    Todos los Gastos
                                </button>
                                <button
                                    onClick={() => { setActiveFilter("flight"); setIsFilterOpen(false); }}
                                    className={`w-full flex items-center gap-2 text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 ${activeFilter === "flight" ? "text-blue-600 bg-blue-50/50 dark:bg-blue-900/20" : "text-slate-700 dark:text-slate-300"}`}
                                ><Plane size={16} /> Vuelos</button>
                                <button
                                    onClick={() => { setActiveFilter("accommodation"); setIsFilterOpen(false); }}
                                    className={`w-full flex items-center gap-2 text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 ${activeFilter === "accommodation" ? "text-blue-600 bg-blue-50/50 dark:bg-blue-900/20" : "text-slate-700 dark:text-slate-300"}`}
                                ><Bed size={16} /> Alojamiento</button>
                                <button
                                    onClick={() => { setActiveFilter("food"); setIsFilterOpen(false); }}
                                    className={`w-full flex items-center gap-2 text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 ${activeFilter === "food" ? "text-blue-600 bg-blue-50/50 dark:bg-blue-900/20" : "text-slate-700 dark:text-slate-300"}`}
                                ><Utensils size={16} /> Comida</button>
                                <button
                                    onClick={() => { setActiveFilter("transport"); setIsFilterOpen(false); }}
                                    className={`w-full flex items-center gap-2 text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 ${activeFilter === "transport" ? "text-blue-600 bg-blue-50/50 dark:bg-blue-900/20" : "text-slate-700 dark:text-slate-300"}`}
                                ><CarTaxiFront size={16} /> Transporte</button>
                                <button
                                    onClick={() => { setActiveFilter("activities"); setIsFilterOpen(false); }}
                                    className={`w-full flex items-center gap-2 text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 ${activeFilter === "activities" ? "text-blue-600 bg-blue-50/50 dark:bg-blue-900/20" : "text-slate-700 dark:text-slate-300"}`}
                                ><Ticket size={16} /> Actividades</button>
                                <button
                                    onClick={() => { setActiveFilter("shopping"); setIsFilterOpen(false); }}
                                    className={`w-full flex items-center gap-2 text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 ${activeFilter === "shopping" ? "text-blue-600 bg-blue-50/50 dark:bg-blue-900/20" : "text-slate-700 dark:text-slate-300"}`}
                                ><ShoppingBag size={16} /> Compras</button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 px-6 pb-24">
                {/* Summary Card */}
                <div className="mt-2 mb-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-100/80 to-blue-200/40 dark:from-blue-900/40 dark:to-blue-800/20 relative overflow-hidden shadow-sm">
                    <div className="absolute -right-8 -top-8 w-40 h-40 bg-blue-200/50 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <p className="text-blue-500 font-medium text-sm mb-2">Total Expenses</p>
                        <div className="flex items-baseline gap-2 mb-4">
                            <h2 className="text-[2.5rem] leading-none font-bold text-slate-900 dark:text-white">{formatMoney(totalAmount)}</h2>
                            <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm uppercase">USD</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <TrendingUp size={16} className="text-green-500" />
                            <span className="text-slate-500 dark:text-slate-400">8% increase from last trip</span>
                        </div>
                    </div>
                </div>

                {/* Breakdown Section */}
                {totalAmount > 0 && (
                    <section className="mb-10">
                        <h3 className="text-xl font-bold mb-6">Breakdown by Phase</h3>
                        <div className="space-y-5">
                            {preTrip > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Previaje</span>
                                        <span className="text-sm font-bold">{formatMoney(preTrip)}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full" style={{ width: `${(preTrip / totalAmount) * 100}%` }}></div>
                                    </div>
                                </div>
                            )}
                            {duringTrip > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Durante el viaje</span>
                                        <span className="text-sm font-bold">{formatMoney(duringTrip)}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full" style={{ width: `${(duringTrip / totalAmount) * 100}%` }}></div>
                                    </div>
                                </div>
                            )}
                            {postTrip > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Postviaje</span>
                                        <span className="text-sm font-bold">{formatMoney(postTrip)}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full" style={{ width: `${(postTrip / totalAmount) * 100}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Transactions List */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Recent Transactions</h3>
                    </div>

                    {expenses.filter(e => activeFilter === "all" || e.category === activeFilter).length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-16 px-6 mt-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-5 text-blue-500 shadow-inner">
                                <CreditCard size={32} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2 tracking-tight">Sin Movimientos</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[280px] leading-relaxed mb-6">
                                Registra tus gastos para mantener un control de tu presupuesto.
                            </p>
                            <button
                                onClick={() => setIsAddExpenseModalOpen(true)}
                                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white font-bold py-2.5 px-6 rounded-full shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm"
                            >
                                <Plus size={16} /> Añadir Primer Gasto
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {expenses.filter(e => activeFilter === "all" || e.category === activeFilter).map((expense) => {
                                const uiInfo = getCategoryIcon(expense.category);
                                const IconComponent = uiInfo.icon;
                                return (
                                    <div key={expense.id} className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm">
                                        <div className={`w-14 h-14 flex flex-shrink-0 items-center justify-center rounded-full ${uiInfo.color}`}>
                                            <IconComponent size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm">{expense.title}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{getPhaseLabel(expense.date)} • {format(expense.date, "MMM dd")}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{formatMoney(expense.amount)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            <div className="fixed bottom-24 right-6 z-20">
                <button onClick={() => setIsAddExpenseModalOpen(true)} className="w-16 h-16 bg-[#1877F2] hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-[0_8px_16px_rgba(24,119,242,0.4)] group">
                    <Plus size={32} strokeWidth={2.5} className="transition-transform duration-300 group-hover:rotate-90" />
                </button>
            </div>

            <TripBottomNav tripId={tripId} />
            {isAddExpenseModalOpen && (
                <AddExpenseModal onClose={() => setIsAddExpenseModalOpen(false)} onSave={handleSaveExpense} />
            )}
        </div>
    );
}

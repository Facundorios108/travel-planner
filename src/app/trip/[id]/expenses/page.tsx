"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { travelService } from "@/lib/services";
import { Trip, Expense, ExpenseCategory } from "@/types/travel";
import TripBottomNav from "@/components/TripBottomNav";
import AddExpenseModal from "@/components/AddExpenseModal";
import { format, startOfDay, eachDayOfInterval, isSameDay } from "date-fns";
import { ArrowLeft, TrendingUp, Plane, Bed, Utensils, CarTaxiFront, ShoppingBag, Ticket, CreditCard, Filter, Plus, Loader2, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
} from "recharts";

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
    const [activeTab, setActiveTab] = useState<"list" | "analytics">("list");

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

    // Memoized Data for Charts
    const analyticsData = useMemo(() => {
        if (expenses.length === 0) return { categoryData: [], dailyData: [] };

        // Category Breakdown
        const categories: Record<string, { name: string; value: number; color: string }> = {
            flight: { name: 'Vuelos', value: 0, color: '#3b82f6' },
            accommodation: { name: 'Alojamiento', value: 0, color: '#f59e0b' },
            food: { name: 'Comida', value: 0, color: '#f97316' },
            transport: { name: 'Transporte', value: 0, color: '#2563eb' },
            shopping: { name: 'Compras', value: 0, color: '#a855f7' },
            activities: { name: 'Actividades', value: 0, color: '#22c55e' },
            other: { name: 'Otros', value: 0, color: '#64748b' }
        };

        expenses.forEach(exp => {
            if (categories[exp.category]) {
                categories[exp.category].value += exp.amount;
            } else {
                categories.other.value += exp.amount;
            }
        });

        const categoryData = Object.values(categories).filter(c => c.value > 0);

        // Daily Spending
        const sortedExpenses = [...expenses].sort((a, b) => a.date.getTime() - b.date.getTime());
        const startDate = sortedExpenses[0].date;
        const endDate = sortedExpenses[sortedExpenses.length - 1].date;

        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const dailyData = days.map(day => {
            const amount = expenses
                .filter(exp => isSameDay(exp.date, day))
                .reduce((sum, exp) => sum + exp.amount, 0);
            return {
                name: format(day, "MMM dd"),
                amount: amount
            };
        });

        return { categoryData, dailyData };
    }, [expenses]);

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

    const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const formatMoney = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

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
            <header className="sticky top-0 z-20 bg-[#f8f9fc]/80 dark:bg-slate-950/80 backdrop-blur-md px-6 pt-6 pb-4 flex items-center justify-between">
                <button onClick={() => router.back()} className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                    <ArrowLeft size={24} className="text-slate-900 dark:text-slate-100" />
                </button>
                <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
                <div className="relative">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`w-12 h-12 flex items-center justify-center rounded-full shadow-sm transition-colors border ${activeFilter !== "all" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 border-blue-200" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"}`}
                    >
                        <Filter size={20} />
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
                                {['flight', 'accommodation', 'food', 'transport', 'activities', 'shopping'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => { setActiveFilter(cat); setIsFilterOpen(false); }}
                                        className={`w-full flex items-center gap-2 text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 ${activeFilter === cat ? "text-blue-600 bg-blue-50/50 dark:bg-blue-900/20" : "text-slate-700 dark:text-slate-300"}`}
                                    >
                                        <div className={`p-1 rounded-md ${getCategoryIcon(cat).color}`}>
                                            {React.createElement(getCategoryIcon(cat).icon, { size: 14 })}
                                        </div>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 px-6 pb-24">
                {/* Summary Card */}
                <div className="mt-2 mb-6 p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-100/80 to-blue-200/40 dark:from-blue-900/40 dark:to-blue-800/20 relative overflow-hidden shadow-sm border border-white/20 dark:border-white/5">
                    <div className="absolute -right-8 -top-8 w-40 h-40 bg-blue-200/50 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <p className="text-blue-500 dark:text-blue-400 font-medium text-sm mb-2 uppercase tracking-wider">Total Gastado</p>
                        <div className="flex items-baseline gap-2 mb-4">
                            <h2 className="text-[2.5rem] leading-none font-black text-slate-900 dark:text-white tracking-tight">{formatMoney(totalAmount)}</h2>
                            <span className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase">USD</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium">
                            <div className="flex items-center gap-1 bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">
                                <TrendingUp size={12} />
                                <span>8% vs meta</span>
                            </div>
                            <span className="text-slate-500 dark:text-slate-400">Presupuesto: $2,500</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-8">
                    <button
                        onClick={() => setActiveTab("list")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "list" ? "bg-white dark:bg-slate-800 shadow-sm text-blue-600" : "text-slate-500 dark:text-slate-400"}`}
                    >
                        <CreditCard size={18} /> Transacciones
                    </button>
                    <button
                        onClick={() => setActiveTab("analytics")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "analytics" ? "bg-white dark:bg-slate-800 shadow-sm text-blue-600" : "text-slate-500 dark:text-slate-400"}`}
                    >
                        <BarChart3 size={18} /> Análisis
                    </button>
                </div>

                {activeTab === "analytics" ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Category Chart */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <PieChartIcon size={20} className="text-blue-500" /> Distribución por Categoría
                            </h3>
                            <div className="h-[250px] w-full min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analyticsData.categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                            dataKey="value"
                                            animationBegin={0}
                                            animationDuration={1500}
                                        >
                                            {analyticsData.categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                borderRadius: '16px', 
                                                border: 'none', 
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                color: '#1e293b'
                                            }}
                                            itemStyle={{ color: '#1e293b' }}
                                            formatter={(value: number) => [formatMoney(value), "Monto"]}
                                        />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            height={36}
                                            iconType="circle"
                                            wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Daily Trend Chart */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <BarChart3 size={20} className="text-blue-500" /> Gastos Diarios
                            </h3>
                            <div className="h-[250px] w-full min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analyticsData.dailyData}>
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                                                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                            contentStyle={{ 
                                                borderRadius: '16px', 
                                                border: 'none', 
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                color: '#1e293b'
                                            }}
                                            itemStyle={{ color: '#1e293b' }}
                                            formatter={(value: number) => [formatMoney(value), "Monto"]}
                                        />
                                        <Bar 
                                            dataKey="amount" 
                                            fill="url(#barGradient)" 
                                            radius={[6, 6, 6, 6]} 
                                            barSize={Math.max(12, 100 / (analyticsData.dailyData.length || 1))}
                                            animationDuration={1500}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                ) : (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black tracking-tight">Movimientos</h3>
                        </div>

                        {expenses.filter(e => activeFilter === "all" || e.category === activeFilter).length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800">
                                <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-5 text-blue-500 shadow-inner">
                                    <CreditCard size={32} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2 tracking-tight">Sin Movimientos</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[280px] leading-relaxed mb-6">
                                    Registra tus gastos para mantener un control de tu presupuesto.
                                </p>
                                <button
                                    onClick={() => setIsAddExpenseModalOpen(true)}
                                    className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm"
                                >
                                    <Plus size={18} strokeWidth={3} /> Añadir Gasto
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {expenses.filter(e => activeFilter === "all" || e.category === activeFilter).map((expense) => {
                                    const uiInfo = getCategoryIcon(expense.category);
                                    const IconComponent = uiInfo.icon;
                                    return (
                                        <div key={expense.id} className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-50 dark:border-slate-800/50 hover:border-blue-100 dark:hover:border-blue-900/30 transition-colors group">
                                            <div className={`w-14 h-14 flex flex-shrink-0 items-center justify-center rounded-full ${uiInfo.color} transition-transform group-hover:scale-110 duration-300`}>
                                                <IconComponent size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{expense.title}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-0.5">{format(expense.date, "MMM dd")} • {expense.category}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-slate-900 dark:text-white">{formatMoney(expense.amount)}</p>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{expense.currency}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}
            </main>

            <div className="fixed bottom-24 right-6 z-30">
                <button onClick={() => setIsAddExpenseModalOpen(true)} className="w-16 h-16 bg-[#1877F2] hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-[0_8px_16px_rgba(24,119,242,0.4)] group">
                    <Plus size={32} strokeWidth={3} className="transition-transform duration-300 group-hover:rotate-90" />
                </button>
            </div>

            <TripBottomNav tripId={tripId} />
            {isAddExpenseModalOpen && (
                <AddExpenseModal onClose={() => setIsAddExpenseModalOpen(false)} onSave={handleSaveExpense} />
            )}
        </div>
    );
}

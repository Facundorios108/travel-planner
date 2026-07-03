"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { travelService } from "@/lib/services";
import { Trip, Expense, ExpenseCategory } from "@/types/travel";
import TripBottomNav from "@/components/TripBottomNav";
import AddExpenseModal from "@/components/AddExpenseModal";
import { format, startOfDay, eachDayOfInterval, isSameDay } from "date-fns";
import { ArrowLeft, TrendingUp, Plane, Bed, Utensils, CarTaxiFront, ShoppingBag, Ticket, CreditCard, Filter, Plus, Loader2, PieChart as PieChartIcon, BarChart3, Edit2, AlertTriangle, Users, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthScreen from "@/components/AuthScreen";
import { useToast } from "@/components/Toast";
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
    const { showToast, ToastComponent } = useToast();

    const { user, loading: authLoading } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const [trip, setTrip] = useState<Trip | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"list" | "analytics" | "balances">("list");

    // Budget Editor states
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [tempBudget, setTempBudget] = useState("");
    const [budgetAlertsEnabled, setBudgetAlertsEnabled] = useState(false);

    useEffect(() => {
        if (!user) return;
        const loadData = async () => {
            try {
                let tripData = await travelService.getTrip(tripId);
                
                if (tripData) {
                    // Retrofit creatorEmail if it doesn't exist and current user is the owner
                    if (!tripData.creatorEmail && tripData.userId === user.uid && user.email) {
                        await travelService.updateTrip(tripId, { creatorEmail: user.email });
                        tripData.creatorEmail = user.email;
                    }
                    setTrip(tripData);
                } else {
                    setTrip(null);
                }
                
                const expensesData = await travelService.getTripExpenses(tripId);
                setExpenses(expensesData);
            } catch (err: any) {
                console.error("Error loading expenses page data:", err);
                if (err.message && (err.message.includes("permission") || err.message.includes("Permission"))) {
                    setError("permission-denied");
                } else {
                    setError("general-error");
                }
            } finally {
                setIsLoading(false);
            }
        };
        loadData();

        const loadPrefs = async () => {
            if (user) {
                const prefs = await travelService.getUserPreferences(user.uid);
                if (prefs?.budgetAlerts) setBudgetAlertsEnabled(true);
            }
        };
        loadPrefs();
    }, [tripId, user]);

    const handleSaveExpense = async (data: any) => {
        try {
            const expenseData = { ...data, tripId };
            const id = await travelService.addExpense(expenseData);
            setExpenses([...expenses, { ...expenseData, id }]);
            setIsAddExpenseModalOpen(false);
            showToast("Gasto guardado correctamente.", "success");
        } catch (err) {
            console.error("Error saving expense:", err);
            showToast("Error al guardar gasto.", "error");
        }
    };

    const handleUpdateExpense = async (data: any) => {
        if (!selectedExpense) return;
        try {
            const updatedData = { ...selectedExpense, ...data };
            await travelService.updateExpense(selectedExpense.id, data);
            setExpenses(expenses.map(e => e.id === selectedExpense.id ? updatedData : e));
            setIsAddExpenseModalOpen(false);
            setSelectedExpense(null);
            showToast("Gasto actualizado correctamente.", "success");
        } catch (err) {
            console.error("Error updating expense:", err);
            showToast("Error al actualizar el gasto.", "error");
        }
    };

    const handleDeleteExpense = async () => {
        if (!selectedExpense) return;
        try {
            await travelService.deleteExpense(selectedExpense.id);
            setExpenses(expenses.filter(e => e.id !== selectedExpense.id));
            setIsAddExpenseModalOpen(false);
            setSelectedExpense(null);
            showToast("Gasto eliminado correctamente.", "success");
        } catch (err) {
            console.error("Error deleting expense:", err);
            showToast("Error al eliminar el gasto.", "error");
        }
    };

    const handleSaveBudget = async () => {
        const parsedBudget = parseFloat(tempBudget);
        if (isNaN(parsedBudget) || parsedBudget < 0) {
            showToast("Presupuesto inválido", "warning");
            return;
        }

        try {
            await travelService.updateTrip(tripId, { budget: parsedBudget });
            setTrip((prev) => prev ? { ...prev, budget: parsedBudget } : null);
            setIsEditingBudget(false);
            showToast("Presupuesto guardado correctamente.", "success");
        } catch (err) {
            console.error("Error saving budget:", err);
            showToast("Error al guardar el presupuesto.", "error");
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

    const participants = useMemo(() => {
        if (!trip) return [];
        const emails = new Set<string>();
        if (trip.creatorEmail) {
            emails.add(trip.creatorEmail);
        } else if (trip.userId && user?.uid === trip.userId && user?.email) {
            emails.add(user.email);
        } else if (user?.email) {
            emails.add(user.email);
        }
        if (trip.collaborators) {
            trip.collaborators.forEach(c => emails.add(c));
        }
        return Array.from(emails);
    }, [trip, user]);

    // Fetch collaborator and creator names
    useEffect(() => {
        if (participants.length === 0) return;
        async function fetchNames() {
            const names: Record<string, string> = {};
            await Promise.all(
                participants.map(async (email) => {
                    const name = await travelService.getUserNameByEmail(email);
                    names[email] = name;
                })
            );
            setParticipantNames(names);
        }
        fetchNames();
    }, [participants]);

    const participantSpending = useMemo(() => {
        const spending: Record<string, number> = {};
        participants.forEach(p => {
            spending[p] = 0;
        });
        expenses.forEach(exp => {
            const payer = exp.paidBy || trip?.creatorEmail || "";
            if (payer) {
                spending[payer] = (spending[payer] || 0) + exp.amount;
            }
        });
        return Object.entries(spending).map(([email, amount]) => ({
            email,
            amount
        })).sort((a, b) => b.amount - a.amount);
    }, [expenses, participants, trip]);

    const settlementData = useMemo(() => {
        const balances: Record<string, number> = {};
        participants.forEach(p => { balances[p] = 0; });
        
        // Exclude personal expenses from splitting logic
        const sharedExpenses = expenses.filter(e => !e.isPersonal);
        const totalSpent = sharedExpenses.reduce((sum, e) => sum + e.amount, 0);
        const splitCount = participants.length || 1;
        const fairShare = totalSpent / splitCount;

        sharedExpenses.forEach(exp => {
            const payer = exp.paidBy || trip?.creatorEmail || "";
            if (balances[payer] !== undefined) {
                balances[payer] += exp.amount;
            }
        });

        participants.forEach(p => {
            balances[p] -= fairShare;
        });

        const debtors = participants.filter(p => balances[p] < -0.01).map(p => ({ email: p, amount: -balances[p] })).sort((a,b) => b.amount - a.amount);
        const creditors = participants.filter(p => balances[p] > 0.01).map(p => ({ email: p, amount: balances[p] })).sort((a,b) => b.amount - a.amount);

        const debts: {from: string, to: string, amount: number}[] = [];
        let d = 0, c = 0;
        const debtorsWork = debtors.map(x => ({...x}));
        const creditorsWork = creditors.map(x => ({...x}));
        
        while(d < debtorsWork.length && c < creditorsWork.length) {
            const debtor = debtorsWork[d];
            const creditor = creditorsWork[c];
            const amount = Math.min(debtor.amount, creditor.amount);
            
            if (amount > 0.01) {
                debts.push({ from: debtor.email, to: creditor.email, amount });
            }
            
            debtor.amount -= amount;
            creditor.amount -= amount;
            
            if (debtor.amount < 0.01) d++;
            if (creditor.amount < 0.01) c++;
        }
        
        return { balances, debts, fairShare };
    }, [expenses, participants, trip]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f8f9fc] dark:bg-slate-950">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <AuthScreen />;
    }

    if (error === "permission-denied") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Acceso Denegado</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">No tienes permisos para ver las finanzas de este viaje.</p>
                <button onClick={() => router.push("/")} className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl shadow-lg">Volver al Inicio</button>
            </div>
        );
    }

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

    // Meta Calculations
    const budgetLimit = trip.budget || 2500;
    const percent = budgetLimit > 0 ? Math.round((totalAmount / budgetLimit) * 100) : 0;
    const vsMetaText = percent > 100 ? `${percent - 100}% sobre meta` : `${100 - percent}% bajo meta`;
    const vsMetaColor = percent > 100 ? "bg-rose-500/10 text-rose-600 border border-rose-200" : "bg-green-500/10 text-green-600 border border-green-200";

    return (
        <div className="bg-[#f8f9fc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans">
            {ToastComponent}
            <header className="sticky top-0 z-20 bg-[#f8f9fc]/80 dark:bg-slate-950/80 backdrop-blur-md px-6 pt-6 pb-4 flex items-center justify-between">
                <button onClick={() => router.push(`/trip/${tripId}`)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all">
                    <ArrowLeft size={24} className="text-slate-900 dark:text-slate-100" />
                </button>
                <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
                {activeTab === "list" ? (
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
                ) : (
                    <div className="w-12 h-12" />
                )}
            </header>

            <main className="flex-1 px-6 pb-52">
                {/* Summary Card */}
                <div className="mt-2 mb-6 p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-100/80 to-blue-200/40 dark:from-blue-900/40 dark:to-blue-800/20 relative overflow-hidden shadow-sm border border-white/20 dark:border-white/5">
                    <div className="absolute -right-8 -top-8 w-40 h-40 bg-blue-200/50 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <p className="text-blue-500 dark:text-blue-400 font-medium text-sm mb-2 uppercase tracking-wider">Total Gastado</p>
                        <div className="flex items-baseline gap-2 mb-4">
                            <h2 className="text-[2.5rem] leading-none font-black text-slate-900 dark:text-white tracking-tight">{formatMoney(totalAmount)}</h2>
                            <span className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase">USD</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium flex-wrap">
                            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${vsMetaColor}`}>
                                <TrendingUp size={11} />
                                <span>{vsMetaText}</span>
                            </div>
                            
                            {/* Editable Budget Form or Display */}
                            {isEditingBudget ? (
                                <form onSubmit={handleSaveBudget} className="flex items-center gap-1.5 animate-in fade-in duration-200">
                                    <input
                                        type="number"
                                        value={tempBudget}
                                        onChange={(e) => setTempBudget(e.target.value)}
                                        className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-blue-400 rounded-lg text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        autoFocus
                                        min="0"
                                        step="any"
                                    />
                                    <button type="submit" className="text-xs bg-blue-500 hover:bg-blue-600 text-white font-bold px-2 py-1 rounded-lg transition">OK</button>
                                    <button type="button" onClick={() => setIsEditingBudget(false)} className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-700 font-bold px-2 py-1 rounded-lg transition">✕</button>
                                </form>
                            ) : (
                                <div 
                                    onClick={() => { setTempBudget(budgetLimit.toString()); setIsEditingBudget(true); }}
                                    className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer group bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full"
                                >
                                    <span>Presupuesto: {formatMoney(budgetLimit)}</span>
                                    <Edit2 size={11} className="text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                            )}
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
                    <button
                        onClick={() => setActiveTab("balances")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "balances" ? "bg-white dark:bg-slate-800 shadow-sm text-blue-600" : "text-slate-500 dark:text-slate-400"}`}
                    >
                        <Users size={18} /> Saldos
                    </button>
                </div>

                {activeTab === "analytics" ? (
                    expenses.length === 0 ? (
                        /* Beautiful empty state inside Analysis tab */
                        <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 animate-in fade-in duration-500">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-5 text-blue-500 shadow-inner">
                                <BarChart3 size={36} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2 tracking-tight">Sin Datos para Analizar</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[280px] leading-relaxed mb-6">
                                Carga tus primeros gastos en la pestaña "Transacciones" para ver el análisis de tu presupuesto, gráficos y tendencias.
                            </p>
                            <button
                                onClick={() => setActiveTab("list")}
                                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white font-bold py-3.5 px-8 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-wider"
                            >
                                Ir a Transacciones
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Category Chart */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 [&_svg]:outline-none [&_*]:outline-none">
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
                                                formatter={(value: any) => [formatMoney(Number(value) || 0), "Monto"]}
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
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 [&_svg]:outline-none [&_*]:outline-none">
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
                                                formatter={(value: any) => [formatMoney(Number(value) || 0), "Monto"]}
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
                            
                            {/* Gastos por Participante */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <CreditCard size={20} className="text-blue-500" /> Gastos por Participante
                                </h3>
                                <div className="space-y-4">
                                    {participantSpending.map((spending) => (
                                        <div key={spending.email} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                            <div className="flex flex-col min-w-0 flex-1 pr-4">
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                                                    {spending.email === user?.email ? "Tú" : (participantNames[spending.email] || spending.email)}
                                                </span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                                    {expenses.filter(e => (e.paidBy || trip.creatorEmail || "") === spending.email).length} transacciones
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-base font-black text-slate-950 dark:text-white">
                                                    {formatMoney(spending.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                ) : activeTab === "balances" ? (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
                            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                                <Users size={20} className="text-blue-500" /> Resumen de Saldos
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Cada participante debería pagar: <span className="font-bold text-slate-900 dark:text-slate-100">{formatMoney(settlementData.fairShare)}</span></p>
                            
                            {settlementData.debts.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 text-green-500 mb-4">
                                        <Users size={28} />
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100">¡Cuentas saldadas!</h4>
                                    <p className="text-sm text-slate-500 mt-1">No hay deudas pendientes entre los participantes.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h4 className="font-bold text-sm text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Quién debe a quién</h4>
                                    {settlementData.debts.map((debt, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                            <div className="flex items-center flex-1 min-w-0">
                                                <span className="text-sm font-bold text-rose-600 dark:text-rose-400 truncate max-w-[100px]">
                                                    {debt.from === user?.email ? "Tú" : (participantNames[debt.from] || debt.from.split('@')[0])}
                                                </span>
                                                <ArrowRight size={14} className="mx-2 flex-shrink-0 text-slate-400" />
                                                <span className="text-sm font-bold text-green-600 dark:text-green-400 truncate max-w-[100px]">
                                                    {debt.to === user?.email ? "Tú" : (participantNames[debt.to] || debt.to.split('@')[0])}
                                                </span>
                                            </div>
                                            <div className="text-right pl-4">
                                                <span className="text-base font-black text-slate-900 dark:text-white">
                                                    {formatMoney(debt.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
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
                                        <div 
                                            key={expense.id} 
                                            onClick={() => {
                                                setSelectedExpense(expense);
                                                setIsAddExpenseModalOpen(true);
                                            }}
                                            className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-50 dark:border-slate-800/50 hover:border-blue-100 dark:hover:border-blue-900/30 transition-all group cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/60 active:scale-[0.98]"
                                        >
                                            <div className={`w-14 h-14 flex flex-shrink-0 items-center justify-center rounded-full ${uiInfo.color} transition-transform group-hover:scale-110 duration-300`}>
                                                <IconComponent size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{expense.title}</h4>
                                                    {expense.isPersonal && (
                                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                            Personal
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-0.5">{format(expense.date, "MMM dd")} • {expense.category}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                                    Pagado por: {expense.paidBy === user?.email ? "Tú" : (participantNames[expense.paidBy || trip.creatorEmail || ""] || expense.paidBy || "Creador")}
                                                </p>
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

            <div className="fixed bottom-44 w-full max-w-2xl pointer-events-none z-30 left-1/2 -translate-x-1/2">
                <div className="absolute right-6">
                    <button onClick={() => setIsAddExpenseModalOpen(true)} className="w-16 h-16 bg-[#1877F2] hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-[0_8px_16px_rgba(24,119,242,0.4)] pointer-events-auto group">
                        <Plus size={32} strokeWidth={3} className="transition-transform duration-300 group-hover:rotate-90" />
                    </button>
                </div>
            </div>

            <TripBottomNav tripId={tripId} />
            {isAddExpenseModalOpen && (
                <AddExpenseModal 
                    onClose={() => {
                        setIsAddExpenseModalOpen(false);
                        setSelectedExpense(null);
                    }} 
                    onSave={selectedExpense ? handleUpdateExpense : handleSaveExpense}
                    onDelete={selectedExpense ? handleDeleteExpense : undefined}
                    expense={selectedExpense || undefined}
                    participants={participants}
                    defaultPaidBy={user?.email || undefined}
                />
            )}
        </div>
    );
}

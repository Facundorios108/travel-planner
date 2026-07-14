"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight, X, Clock } from "lucide-react";
import { format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface CustomDateTimePickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
    label?: string;
}

export default function CustomDateTimePicker({
    value,
    onChange,
    placeholder = "Seleccionar fecha y hora...",
    required = false,
    className = "",
    label = ""
}: CustomDateTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(value ? new Date(value) : new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(value ? new Date(value) : new Date());
    
    // Time picker states (12h format)
    const [hour, setHour] = useState<number>(12);
    const [minute, setMinute] = useState<number>(0);
    const [ampm, setAmpm] = useState<"a.m." | "p.m.">("p.m.");

    // Sync state with incoming value
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                setSelectedDate(date);
                setCurrentMonth(date);
                
                let hours = date.getHours();
                const minutes = date.getMinutes();
                const isPm = hours >= 12;
                
                setAmpm(isPm ? "p.m." : "a.m.");
                hours = hours % 12;
                hours = hours ? hours : 12;
                setHour(hours);
                setMinute(minutes);
            }
        }
    }, [value]);

    // Format display string
    const getDisplayString = () => {
        if (!value) return "";
        try {
            const date = new Date(value);
            if (isNaN(date.getTime())) return "";
            
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            
            let hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const period = hours >= 12 ? 'p.m.' : 'a.m.';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const formattedHours = hours.toString().padStart(2, '0');
            
            return `${day}/${month}/${year}, ${formattedHours}:${minutes} ${period}`;
        } catch {
            return value;
        }
    };

    const handleConfirm = () => {
        // Calculate 24h hours
        let hours24 = hour;
        if (ampm === "p.m." && hour < 12) {
            hours24 += 12;
        } else if (ampm === "a.m." && hour === 12) {
            hours24 = 0;
        }

        const newDate = new Date(selectedDate);
        newDate.setHours(hours24);
        newDate.setMinutes(minute);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);

        // Format to yyyy-MM-ddTHH:mm
        const pad = (n: number) => n.toString().padStart(2, '0');
        const formatted = `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}T${pad(newDate.getHours())}:${pad(newDate.getMinutes())}`;
        
        onChange(formatted);
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange("");
        setIsOpen(false);
    };

    // Calendar generation helpers
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = startOfMonth(currentMonth);
    const startOffset = (getDay(firstDayOfMonth) + 6) % 7; 

    const days = [];
    // Previous month padding
    for (let i = 0; i < startOffset; i++) {
        days.push(null);
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const selectDay = (day: number) => {
        const newDate = new Date(currentMonth);
        newDate.setDate(day);
        setSelectedDate(newDate);
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    // Hours list (1 to 12)
    const hoursList = Array.from({ length: 12 }, (_, i) => i + 1);
    // Minutes list (0 to 59)
    const minutesList = Array.from({ length: 60 }, (_, i) => i);

    return (
        <div className="w-full">
            {label && (
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    {label}
                </label>
            )}
            
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100 text-sm font-medium text-left flex justify-between items-center cursor-pointer transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ${className}`}
            >
                <span className={value ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}>
                    {getDisplayString() || placeholder}
                </span>
                <Calendar size={16} className="text-slate-400 dark:text-slate-500 shrink-0 ml-2" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    {/* Backdrop Click */}
                    <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>
                    
                    {/* Modal Content */}
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-[340px] sm:max-w-[480px] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800/60">
                            <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                                {label || "Seleccionar Fecha y Hora"}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Split view content */}
                        <div className="flex flex-col sm:flex-row overflow-y-auto sm:overflow-visible">
                            
                            {/* Calendar section */}
                            <div className="p-4 flex-1 border-b sm:border-b-0 sm:border-r border-slate-150 dark:border-slate-800/60">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 capitalize">
                                        {format(currentMonth, "MMMM 'de' yyyy", { locale: es })}
                                    </span>
                                    <div className="flex gap-0.5">
                                        <button
                                            type="button"
                                            onClick={prevMonth}
                                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={nextMonth}
                                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1.5">
                                    <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
                                </div>

                                <div className="grid grid-cols-7 gap-0.5 text-center">
                                    {days.map((day, index) => {
                                        if (day === null) {
                                            return <div key={`empty-${index}`} />;
                                        }

                                        const isSelected = 
                                            selectedDate.getDate() === day && 
                                            selectedDate.getMonth() === currentMonth.getMonth() && 
                                            selectedDate.getFullYear() === currentMonth.getFullYear();

                                        return (
                                            <button
                                                key={`day-${day}`}
                                                type="button"
                                                onClick={() => selectDay(day)}
                                                className={`h-7 w-7 mx-auto text-xs font-bold rounded-lg flex items-center justify-center transition-all ${
                                                    isSelected 
                                                        ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Time Picker Section */}
                            <div className="p-4 sm:w-[180px] bg-slate-50/50 dark:bg-slate-900/30 flex flex-col">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1">
                                    <Clock size={12} /> Seleccionar Hora
                                </div>

                                <div className="flex gap-1.5 h-[130px] items-center justify-center">
                                    {/* Hours Scroll */}
                                    <div className="flex-1 flex flex-col overflow-y-auto h-full scrollbar-thin text-center gap-0.5">
                                        {hoursList.map(h => (
                                            <button
                                                key={`h-${h}`}
                                                type="button"
                                                onClick={() => setHour(h)}
                                                className={`py-1 text-xs font-bold rounded-md transition-colors ${hour === h ? "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                                            >
                                                {h.toString().padStart(2, '0')}
                                            </button>
                                        ))}
                                    </div>

                                    <span className="text-slate-400 font-bold">:</span>

                                    {/* Minutes Scroll */}
                                    <div className="flex-1 flex flex-col overflow-y-auto h-full scrollbar-thin text-center gap-0.5">
                                        {minutesList.map(m => (
                                            <button
                                                key={`m-${m}`}
                                                type="button"
                                                onClick={() => setMinute(m)}
                                                className={`py-1 text-xs font-bold rounded-md transition-colors ${minute === m ? "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                                            >
                                                {m.toString().padStart(2, '0')}
                                            </button>
                                        ))}
                                    </div>

                                    {/* AM/PM picker */}
                                    <div className="flex flex-col gap-0.5 text-center shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setAmpm("a.m.")}
                                            className={`px-1.5 py-1 text-[9px] font-black uppercase rounded-md transition-all ${ampm === "a.m." ? "bg-blue-500 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                                        >
                                            AM
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAmpm("p.m.")}
                                            className={`px-1.5 py-1 text-[9px] font-black uppercase rounded-md transition-all ${ampm === "p.m." ? "bg-blue-500 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                                        >
                                            PM
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-between items-center gap-2 p-4 border-t border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                Borrar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition-all text-center"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

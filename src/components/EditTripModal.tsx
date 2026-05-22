import { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Trip } from "@/types/travel";

interface EditTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Trip>) => Promise<void>;
    trip: Trip | null;
}

export function EditTripModal({ isOpen, onClose, onSave, trip }: EditTripModalProps) {
    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (trip) {
            setName(trip.name || "");
            setStartDate(trip.startDate ? format(trip.startDate, "yyyy-MM-dd") : "");
            setEndDate(trip.endDate ? format(trip.endDate, "yyyy-MM-dd") : "");
        }
    }, [trip, isOpen]);

    if (!isOpen || !trip) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("El nombre del viaje no puede estar vacío.");
            return;
        }

        setIsSaving(true);
        try {
            await onSave({
                name: name.trim(),
                startDate: startDate ? new Date(startDate + "T12:00:00") : undefined,
                endDate: endDate ? new Date(endDate + "T12:00:00") : undefined,
            });
            onClose();
        } catch (err: any) {
            setError(err.message || "Error al actualizar el viaje.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]">
                <div className="flex items-center justify-between px-8 py-6 shrink-0">
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                        Editar Detalles del Viaje
                    </h2>
                    <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 duration-200">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-8 pb-2 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-4 rounded-2xl border-2 border-red-200 dark:border-red-900/30 font-medium">
                            {error}
                        </div>
                    )}

                    <form id="edit-trip-form" onSubmit={handleSubmit} className="space-y-7">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Nombre del Viaje</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Verano en Miami"
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-100 text-base font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                required
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Fecha de Inicio <span className="text-slate-400 font-normal lowercase">(Opcional)</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
                                        <Calendar size={18} />
                                    </div>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Fecha de Fin <span className="text-slate-400 font-normal lowercase">(Opcional)</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
                                        <Calendar size={18} />
                                    </div>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="px-8 pb-8 flex justify-end gap-4 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-8 py-3 font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-full transition-colors duration-200"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="edit-trip-form"
                        disabled={isSaving}
                        className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-full shadow-xl shadow-blue-500/30 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
                    >
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
}

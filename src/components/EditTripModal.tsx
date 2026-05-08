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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        Editar Detalles del Viaje
                    </h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                            {error}
                        </div>
                    )}

                    <form id="edit-trip-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nombre del Viaje</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Verano en Miami"
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                required
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Fecha de Inicio <span className="text-slate-400 font-normal">(Opc.)</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <Calendar size={18} />
                                    </div>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Fecha de Fin <span className="text-slate-400 font-normal">(Opc.)</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <Calendar size={18} />
                                    </div>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="edit-trip-form"
                        disabled={isSaving}
                        className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition disabled:opacity-50"
                    >
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import LocationSearch from "./LocationSearch";
import { Destination } from "@/types/travel";
import { format } from "date-fns";

interface AddDestinationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Destination, "id" | "order"> & { id?: string }) => Promise<void>;
    tripId: string;
    editingDestination?: Destination | null;
}

export function AddDestinationModal({ isOpen, onClose, onSave, tripId, editingDestination }: AddDestinationModalProps) {
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    // Reset or load when modal opens/changes
    useEffect(() => {
        if (isOpen) {
            if (editingDestination) {
                setCity(editingDestination.city);
                setCountry(editingDestination.country);
                setStartDate(editingDestination.startDate ? format(new Date(editingDestination.startDate), "yyyy-MM-dd") : "");
                setEndDate(editingDestination.endDate ? format(new Date(editingDestination.endDate), "yyyy-MM-dd") : "");
            } else {
                setCity("");
                setCountry("");
                setStartDate("");
                setEndDate("");
            }
            setError("");
        }
    }, [isOpen, editingDestination]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!city || !country || !startDate || !endDate) {
            setError("Por favor selecciona un destino e indica las fechas de inicio y fin.");
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            setError("La fecha de fin no puede ser anterior a la fecha de inicio.");
            return;
        }

        setIsSaving(true);
        try {
            await onSave({
                id: editingDestination?.id,
                tripId,
                city,
                country,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            });
            onClose();
        } catch (err: any) {
            setError(err.message || "Error al guardar el destino.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {editingDestination ? "Editar Destino" : "Añadir Nuevo Destino"}
                    </h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex-1">
                    {error && (
                        <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                            {error}
                        </div>
                    )}

                    <form id="add-destination-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Location Search */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Destino</label>
                            <LocationSearch
                                placeholder="Ciudad, país..."
                                value={city ? `${city}, ${country}` : ""}
                                onSelect={({ city, country }) => {
                                    setCity(city);
                                    setCountry(country);
                                }}
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Fecha Inicio</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition relative hover:border-blue-200 dark:hover:border-slate-700"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Fecha Fin <span className="text-slate-400 font-normal">(Opcional)</span></label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition relative hover:border-blue-200 dark:hover:border-slate-700"
                                />
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
                        form="add-destination-form"
                        disabled={isSaving}
                        className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition disabled:opacity-50"
                    >
                        {isSaving ? "Guardando..." : editingDestination ? "Guardar Cambios" : "Guardar Destino"}
                    </button>
                </div>
            </div>
        </div>
    );
}

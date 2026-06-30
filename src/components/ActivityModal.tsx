import { useState, useEffect } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { X, PlaneLanding, Car, Activity as ActivityIcon, Calendar, MapPin, MoreHorizontal } from "lucide-react";
import { Activity, ActivityType, Destination } from "@/types/travel";
import { format } from "date-fns";

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Activity, "id">) => Promise<void>;
    destinations: Destination[];
    tripId: string;
    existingActivity?: Activity | null;
    defaultDate?: Date | null;
}

const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: React.ReactNode }[] = [
    { type: "flight", label: "Vuelo", icon: <PlaneLanding size={16} /> },
    { type: "transfer", label: "Traslado", icon: <Car size={16} /> },
    { type: "carRental", label: "Auto", icon: <MapPin size={16} /> },
    { type: "activity", label: "Actividad", icon: <ActivityIcon size={16} /> },
    { type: "other", label: "Otro", icon: <MoreHorizontal size={16} /> },
];

export function ActivityModal({ isOpen, onClose, onSave, destinations, tripId, existingActivity, defaultDate }: ActivityModalProps) {
    useLockBodyScroll(isOpen);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [type, setType] = useState<ActivityType>("activity");
    const [destinationId, setDestinationId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (existingActivity) {
            setTitle(existingActivity.title);
            setDescription(existingActivity.description || "");
            setLocation(existingActivity.location || "");
            setType(existingActivity.type || "activity");
            setDestinationId(existingActivity.destinationId || (destinations.length > 0 ? destinations[0].id : ""));
            // Format datetime-local requires YYYY-MM-DDThh:mm format
            setStartDate(format(existingActivity.startDate, "yyyy-MM-dd'T'HH:mm"));
            setEndDate(existingActivity.endDate ? format(existingActivity.endDate, "yyyy-MM-dd'T'HH:mm") : "");
        } else {
            setTitle("");
            setDescription("");
            setLocation("");
            setType("activity");
            setDestinationId(destinations.length > 0 ? destinations[0].id : "");
            if (defaultDate) {
                setStartDate(format(defaultDate, "yyyy-MM-dd'T'12:00"));
            } else {
                setStartDate("");
            }
            setEndDate("");
        }
    }, [existingActivity, destinations, isOpen, defaultDate]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!title || !startDate || !destinationId) {
            setError("Por favor completa los campos obligatorios.");
            return;
        }

        setIsSaving(true);
        try {
            const activityData: any = {
                tripId,
                destinationId,
                title,
                description,
                location,
                type,
                startDate: new Date(startDate),
            };
            
            // Solo agregar endDate si tiene valor (Firebase no acepta undefined)
            if (endDate) {
                activityData.endDate = new Date(endDate);
            }
            
            await onSave(activityData);
            onClose();
        } catch (err: any) {
            setError(err.message || "Error al guardar la actividad.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-8 py-6 shrink-0">
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                        {existingActivity ? "Editar Actividad" : "Nueva Actividad"}
                    </h2>
                    <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 duration-200">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto px-8 pb-2 flex-1">
                    {error && (
                        <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-4 rounded-2xl border-2 border-red-200 dark:border-red-900/30 font-medium">
                            {error}
                        </div>
                    )}

                    <form id="activity-form" onSubmit={handleSubmit} className="space-y-7">
                        {/* Type Selection (Chips) */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Tipo de Actividad</label>
                            <div className="flex flex-wrap gap-2.5">
                                {ACTIVITY_TYPES.map((actType) => (
                                    <button
                                        key={actType.type}
                                        type="button"
                                        onClick={() => setType(actType.type)}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold transition-all duration-200 ${type === actType.type
                                                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105"
                                            }`}
                                    >
                                        {actType.icon}
                                        {actType.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Título</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej: Vuelo Madrid-Paris, Tour Coliseo..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-100 text-base font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                required
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Ubicación / Dirección exacta <span className="text-slate-400 font-normal lowercase">(Opcional)</span></label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Ej: 7-Eleven Honolulu, Torre Eiffel..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-100 text-base font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>

                        {/* Destination */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Destino</label>
                            <select
                                value={destinationId}
                                onChange={(e) => setDestinationId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-100 text-base font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none"
                                required
                            >
                                <option value="" disabled>Selecciona un destino</option>
                                {destinations.map((dest) => (
                                    <option key={dest.id} value={dest.id}>{dest.city}</option>
                                ))}
                            </select>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Fecha/Hora Inicio</label>
                                <input
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Fecha/Hora Fin <span className="text-slate-400 font-normal lowercase">(Opcional)</span></label>
                                <input
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Descripción <span className="text-slate-400 font-normal lowercase">(Opcional)</span></label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Detalles de reserva, notas, etc."
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-100 text-base placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none min-h-[120px]"
                            />
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
                        form="activity-form"
                        disabled={isSaving}
                        className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-full shadow-xl shadow-blue-500/30 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
                    >
                        {isSaving ? "Guardando..." : existingActivity ? "Actualizar" : "Crear Actividad"}
                    </button>
                </div>
            </div>
        </div>
    );
}

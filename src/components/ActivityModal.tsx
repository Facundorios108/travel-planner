import { useState, useEffect } from "react";
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
}

const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: React.ReactNode }[] = [
    { type: "flight", label: "Vuelo", icon: <PlaneLanding size={16} /> },
    { type: "transfer", label: "Traslado", icon: <Car size={16} /> },
    { type: "carRental", label: "Auto", icon: <MapPin size={16} /> },
    { type: "activity", label: "Actividad", icon: <ActivityIcon size={16} /> },
    { type: "other", label: "Otro", icon: <MoreHorizontal size={16} /> },
];

export function ActivityModal({ isOpen, onClose, onSave, destinations, tripId, existingActivity }: ActivityModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
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
            setType(existingActivity.type);
            setDestinationId(existingActivity.destinationId);
            // Format datetime-local requires YYYY-MM-DDThh:mm format
            setStartDate(format(existingActivity.startDate, "yyyy-MM-dd'T'HH:mm"));
            setEndDate(existingActivity.endDate ? format(existingActivity.endDate, "yyyy-MM-dd'T'HH:mm") : "");
        } else {
            setTitle("");
            setDescription("");
            setType("activity");
            setDestinationId(destinations.length > 0 ? destinations[0].id : "");
            setStartDate("");
            setEndDate("");
        }
    }, [existingActivity, destinations, isOpen]);

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
            await onSave({
                tripId,
                destinationId,
                title,
                description,
                type,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : undefined,
            });
            onClose();
        } catch (err: any) {
            setError(err.message || "Error al guardar la actividad.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">
                        {existingActivity ? "Editar Actividad" : "Nueva Actividad"}
                    </h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition rounded-full hover:bg-slate-50">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex-1">
                    {error && (
                        <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                            {error}
                        </div>
                    )}

                    <form id="activity-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Type Selection (Chips) */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Actividad</label>
                            <div className="flex flex-wrap gap-2">
                                {ACTIVITY_TYPES.map((actType) => (
                                    <button
                                        key={actType.type}
                                        type="button"
                                        onClick={() => setType(actType.type)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition ${type === actType.type
                                                ? "bg-blue-500 text-white shadow-sm ring-2 ring-blue-500 ring-offset-2"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                            <label className="block text-sm font-bold text-slate-700 mb-2">Título</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej: Vuelo Madrid-Paris, Tour Coliseo..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                required
                            />
                        </div>

                        {/* Destination */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Destino</label>
                            <select
                                value={destinationId}
                                onChange={(e) => setDestinationId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition appearance-none"
                                required
                            >
                                <option value="" disabled>Selecciona un destino</option>
                                {destinations.map((dest) => (
                                    <option key={dest.id} value={dest.id}>{dest.city}</option>
                                ))}
                            </select>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Fecha/Hora Inicio</label>
                                <input
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Fecha/Hora Fin <span className="text-slate-400 font-normal">(Opcional)</span></label>
                                <input
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Descripción</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Detalles de reserva, notas, etc."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none min-h-[100px]"
                            />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 rounded-xl transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="activity-form"
                        disabled={isSaving}
                        className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition disabled:opacity-50"
                    >
                        {isSaving ? "Guardando..." : "Guardar Actividad"}
                    </button>
                </div>
            </div>
        </div>
    );
}

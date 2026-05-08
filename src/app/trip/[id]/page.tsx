"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { ChevronLeft, CalendarDays, Clock, Plus, Loader2, PlaneLanding, Hotel, Car, MapPin, Activity as ActivityIcon, MoreHorizontal, Trash2, Edit2, PlusCircle } from "lucide-react";
import { travelService } from "@/lib/services";
import { Trip, Destination, Activity, ActivityType } from "@/types/travel";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { ActivityModal } from "@/components/ActivityModal";
import { AddDestinationModal } from "@/components/AddDestinationModal";
import { EditTripModal } from "@/components/EditTripModal";
import TripBottomNav from "@/components/TripBottomNav";
import { ShareTripModal } from "@/components/ShareTripModal";
import { Trash2 as TrashIcon, AlertTriangle, Users } from "lucide-react";

export default function TripItinerary({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();

    // Unwrap the generic params object
    const resolvedParams = use(params);
    const tripId = resolvedParams.id;

    const [trip, setTrip] = useState<Trip | null>(null);
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [view, setView] = useState<"timeline" | "calendar">("timeline"); // Switcher from Stitch

    // Modal & View state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [isAddDestinationModalOpen, setIsAddDestinationModalOpen] = useState(false);
    const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Calendar View state
    const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [tripData, destinationsData, activitiesData] = await Promise.all([
                    travelService.getTrip(tripId),
                    travelService.getTripDestinations(tripId),
                    travelService.getActivitiesByTrip(tripId)
                ]);
                setTrip(tripData);
                setDestinations(destinationsData);
                setActivities(activitiesData);
            } catch (error) {
                console.error("Failed to load itinerary:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [tripId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950">
                <p className="text-slate-500 dark:text-slate-400">Viaje no encontrado</p>
            </div>
        );
    }

    const getActivityIcon = (type?: ActivityType | string) => {
        switch (type) {
            case "flight": return <PlaneLanding size={20} />;
            case "transfer": return <Car size={20} />;
            case "carRental": return <MapPin size={20} />;
            case "activity": return <ActivityIcon size={20} />;
            default: return <MoreHorizontal size={20} />;
        }
    };

    const handleSaveActivity = async (data: Omit<Activity, "id">) => {
        if (editingActivity) {
            await travelService.updateActivity(editingActivity.id, data);
            setActivities(activities.map(a => a.id === editingActivity.id ? { ...a, ...data } : a));
        } else {
            const id = await travelService.addActivity(data);
            setActivities([...activities, { ...data, id }].sort((a, b) => a.startDate.getTime() - b.startDate.getTime()));
        }
    };

    const handleDeleteActivity = async (id: string) => {
        if (confirm("¿Estás seguro de que deseas eliminar esta actividad?")) {
            await travelService.deleteActivity(id);
            setActivities(activities.filter(a => a.id !== id));
        }
    };

    const openEditModal = (activity: Activity) => {
        setEditingActivity(activity);
        setIsModalOpen(true);
    };

    const openNewModal = () => {
        setEditingActivity(null);
        setIsModalOpen(true);
    };

    const handleSaveDestination = async (data: Omit<Destination, "id" | "order">) => {
        const order = destinations.length;
        const id = await travelService.addDestination(
            data.tripId,
            data.country,
            data.city,
            data.startDate,
            data.endDate,
            order
        );
        const newDestinations = [...destinations, { ...data, order, id }].sort((a, b) => {
            const timeA = a.startDate ? a.startDate.getTime() : 0;
            const timeB = b.startDate ? b.startDate.getTime() : 0;
            return timeA - timeB;
        });
        setDestinations(newDestinations);
    };

    const confirmDeleteTrip = async () => {
        setIsDeleting(true);
        try {
            await travelService.deleteTrip(tripId);
            router.push("/");
        } catch (err) {
            console.error("Error deleting trip:", err);
            alert("Ocurrió un error al eliminar el viaje.");
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    const handleSaveTripInfo = async (data: Partial<Trip>) => {
        try {
            await travelService.updateTrip(tripId, data);
            setTrip((prev) => prev ? { ...prev, ...data } : null);
        } catch (err) {
            console.error("Error updating trip:", err);
            throw err;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative pb-24 text-slate-900 dark:text-slate-100">
            {/* Header Itinerario - Hero Image Style */}
            <header className="relative h-64 sm:h-72 w-full overflow-hidden shrink-0">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                    style={{ backgroundImage: `url('${trip.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop"}')` }}
                />
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-slate-50 dark:to-slate-950"></div>

                {/* Top Nav Area */}
                <div className="absolute top-0 left-0 right-0 px-6 pt-12 pb-4 flex justify-between items-start z-30 pointer-events-none">
                    <button onClick={() => router.push("/")} className="pointer-events-auto w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition shadow-sm">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex flex-col items-end gap-2">
                        <label
                            className={`relative pointer-events-auto flex items-center justify-end gap-2 px-3 py-1.5 backdrop-blur-md rounded-lg text-white text-xs font-bold transition shadow-sm cursor-pointer overflow-hidden ${isUploadingImage ? 'bg-blue-500/80 cursor-wait' : 'bg-white/20 hover:bg-white/40'}`}
                        >
                            {isUploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Edit2 size={14} />}
                            {isUploadingImage ? 'Subiendo...' : 'Editar Foto'}
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        const img = new Image();
                                        img.onload = async () => {
                                            const canvas = document.createElement("canvas");
                                            const MAX_WIDTH = 800; // Aggressive compression to reliably bypass Firestore 1MB limit
                                            let scaleSize = 1;
                                            if (img.width > MAX_WIDTH) {
                                                scaleSize = MAX_WIDTH / img.width;
                                            }
                                            canvas.width = img.width * scaleSize;
                                            canvas.height = img.height * scaleSize;
                                            const ctx = canvas.getContext("2d");
                                            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                                            const base64String = canvas.toDataURL("image/jpeg", 0.5); // Lower quality

                                            setIsUploadingImage(true);
                                            try {
                                                await travelService.updateTrip(trip.id, { coverImage: base64String });
                                                setTrip((prev) => prev ? { ...prev, coverImage: base64String } : null);
                                            } catch (err) {
                                                console.error("Failed to upload image:", err);
                                                alert("No se pudo guardar la imagen. La foto sigue siendo muy pesada para la base de datos gratuita. Intenta con una imagen más sencilla.");
                                            } finally {
                                                setIsUploadingImage(false);
                                            }
                                        };
                                        img.src = event.target?.result as string;
                                    };
                                    reader.readAsDataURL(file);
                                }}
                            />
                        </label>
                        {/* El botón de eliminar se movió abajo a pedido del usuario */}
                    </div>
                </div>

                {/* Bottom Title Area */}
                <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pointer-events-none">
                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 drop-shadow-sm">{trip.name}</h1>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsEditTripModalOpen(true)}
                                    className="pointer-events-auto p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition shadow-sm"
                                    title="Editar Viaje"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => setIsShareModalOpen(true)}
                                    className="pointer-events-auto p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition shadow-sm relative"
                                    title="Compartir Viaje"
                                >
                                    <Users size={16} />
                                    {trip.collaborators && trip.collaborators.length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 font-bold text-sm tracking-wide flex flex-col items-start pointer-events-auto">
                            <span>{destinations.map(d => d.city).join(' • ') || 'Sin destinos'}</span>
                            {trip.startDate && (
                                <span className="text-sm text-blue-100 bg-blue-600 border border-blue-500/50 px-2.5 py-1 rounded-md mt-2 flex items-center gap-1.5 shadow-sm">
                                    <Clock size={14} />
                                    Inicia el {format(new Date(trip.startDate), "d 'de' MMMM, yyyy", { locale: es })}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* View Switcher */}
                    <div className="shrink-0 pointer-events-auto">
                        <div className="flex bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1 rounded-full w-full sm:w-44 shadow-sm border border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setView("timeline")}
                                className={`flex-1 rounded-full py-1.5 text-[10px] sm:text-xs font-bold transition ${view === "timeline" ? "bg-blue-500 shadow-sm text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
                            >
                                Timeline
                            </button>
                            <button
                                onClick={() => setView("calendar")}
                                className={`flex-1 rounded-full py-1.5 text-[10px] sm:text-xs font-bold transition ${view === "calendar" ? "bg-blue-500 shadow-sm text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
                            >
                                Calendar
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-lg mx-auto px-6 mt-4">
                {view === "timeline" ? (
                    <div className="pb-12">
                        {destinations.map((dest, i) => (
                            <div key={dest.id} className="mb-10">
                                {/* Destination Indicator */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="bg-blue-500 text-white px-4 py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap shadow-sm border border-blue-600">
                                        Destino {i + 1}
                                    </div>
                                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 truncate">{dest.city}</h3>
                                    <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800"></div>
                                </div>

                                {/* Timeline Container */}
                                <div className="relative space-y-6 ml-4">
                                    {/* Vertical Line */}
                                    <div className="absolute left-0 top-6 bottom-[-2rem] w-0.5 bg-slate-200 dark:bg-slate-800 -translate-x-1/2"></div>

                                    {activities.filter(a => a.destinationId === dest.id).length === 0 && (
                                        <div className="relative pl-8 sm:pl-10 group mt-6 pt-2">
                                            {/* Timeline Node Dot for empty state */}
                                            <div className="absolute left-0 top-10 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-slate-50 dark:border-slate-950 -translate-x-1/2 z-10"></div>

                                            <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-start">
                                                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-slate-400 shadow-sm border border-slate-100 dark:border-slate-700">
                                                    <Clock size={18} />
                                                </div>
                                                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">Sin actividades</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Empieza a planear tu día en {dest.city}.</p>
                                                <button
                                                    onClick={() => openNewModal()}
                                                    className="px-4 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/50 transition-all flex items-center gap-2"
                                                >
                                                    <Plus size={16} /> Añadir Actividad
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {activities
                                        .filter(a => a.destinationId === dest.id)
                                        .map((activity) => (
                                            <div key={activity.id} className="relative pl-8 sm:pl-10 group mt-6">
                                                <div className="absolute left-0 top-6 w-4 h-4 rounded-full bg-blue-500 border-4 border-slate-50 dark:border-slate-950 -translate-x-1/2 z-10 shadow-sm transition-transform duration-300 group-hover:scale-125"></div>
                                                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/50 relative overflow-hidden">

                                                    {/* Edit/Delete Actions */}
                                                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20">
                                                        <button onClick={() => openEditModal(activity)} className="p-1.5 text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDeleteActivity(activity.id)} className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    <div className="flex justify-between items-start mb-3 pr-16 bg-white dark:bg-slate-900 z-10 relative">
                                                        <div className="p-2.5 bg-blue-50/50 dark:bg-blue-500/10 rounded-lg text-blue-500 dark:text-blue-400">
                                                            {getActivityIcon(activity.type)}
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 rounded-md border border-slate-100 dark:border-slate-700">
                                                                {format(activity.startDate, "HH:mm", { locale: es })}
                                                                {activity.endDate && ` - ${format(activity.endDate, "HH:mm", { locale: es })}`}
                                                            </span>
                                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{format(activity.startDate, "dd MMM yyyy", { locale: es })}</p>
                                                        </div>
                                                    </div>
                                                    <h4 className="font-bold text-sm sm:text-base mb-1 text-slate-800 dark:text-slate-200 pr-12 relative z-10">{activity.title}</h4>
                                                    {activity.description && (
                                                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg whitespace-pre-line border border-slate-100/50 dark:border-slate-800/50 relative z-10">
                                                            {activity.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}

                        {/* Add Destination Button at the end of Timeline */}
                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={() => setIsAddDestinationModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-blue-500 font-bold rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-500/50 hover:shadow-md transition-all active:scale-95"
                            >
                                <PlusCircle size={20} />
                                Añadir Nuevo Destino
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="pb-12 mt-4 flex flex-col items-center w-full">
                        {/* Horizontal Date Picker Strip */}
                        {(() => {
                            if (activities.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center text-center p-8 mt-4 w-full max-w-sm mx-auto bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800">
                                        <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-5 text-blue-500 shadow-inner">
                                            <CalendarDays size={32} strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2 tracking-tight">Calendario Libre</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[280px] leading-relaxed mb-6">
                                            Tus días están libres. Añade actividades para empezar a armar tu itinerario.
                                        </p>
                                        <button
                                            onClick={openNewModal}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                        >
                                            <Plus size={18} /> Añadir Actividad
                                        </button>
                                    </div>
                                );
                            }

                            // Extract unique dates
                            const uniqueDateStrings = Array.from(new Set(activities.map(act => format(act.startDate, "yyyy-MM-dd")))).sort();

                            // Initialize selected date if not set
                            if (!selectedCalendarDate && uniqueDateStrings.length > 0) {
                                setSelectedCalendarDate(uniqueDateStrings[0]);
                            }

                            return (
                                <div className="w-full max-w-[100vw]">
                                    {/* Date Strip */}
                                    <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x scrollbar-hide px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                        {uniqueDateStrings.map(dateStr => {
                                            const actDate = new Date(dateStr + "T12:00:00");
                                            const isSelected = selectedCalendarDate === dateStr;
                                            return (
                                                <button
                                                    key={dateStr}
                                                    onClick={() => setSelectedCalendarDate(dateStr)}
                                                    className={`snap-center shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl min-w-[72px] transition-all shadow-sm ${isSelected
                                                        ? "bg-blue-500 text-white shadow-blue-500/30 scale-105"
                                                        : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                        }`}
                                                >
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-blue-100" : "text-slate-400 dark:text-slate-500"}`}>{format(actDate, "MMM", { locale: es })}</span>
                                                    <span className={`text-2xl font-black ${isSelected ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>{format(actDate, "dd")}</span>
                                                    <span className={`text-[10px] font-bold uppercase ${isSelected ? "text-blue-100" : "text-slate-400 dark:text-slate-500"}`}>{format(actDate, "EEE", { locale: es })}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Activities for Selected Date */}
                                    <div className="mt-8 space-y-4 w-full">
                                        <div className="flex items-center justify-between mb-2 px-1">
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                                                {selectedCalendarDate ? format(new Date(selectedCalendarDate + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: es }) : ''}
                                            </h3>
                                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold px-3 py-1 rounded-full">
                                                {activities.filter(a => format(a.startDate, "yyyy-MM-dd") === selectedCalendarDate).length} actividades
                                            </span>
                                        </div>

                                        {activities
                                            .filter(a => format(a.startDate, "yyyy-MM-dd") === selectedCalendarDate)
                                            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                                            .map((act) => {
                                                const dest = destinations.find(d => d.id === act.destinationId);
                                                return (
                                                    <div key={act.id} className="group relative bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-start gap-4 transition-all hover:shadow-md">
                                                        <div className="p-3 bg-blue-50/80 dark:bg-blue-500/10 text-blue-500 rounded-xl shrink-0 border border-blue-100 dark:border-blue-900/50">
                                                            {getActivityIcon(act.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0 pt-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                                                                    {format(act.startDate, "HH:mm", { locale: es })}
                                                                    {act.endDate && ` - ${format(act.endDate, "HH:mm", { locale: es })}`}
                                                                </span>
                                                                {dest && <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 px-2.5 py-0.5 rounded-md truncate border border-blue-100 dark:border-blue-900/30">{dest.city}</span>}
                                                            </div>
                                                            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1 leading-tight pr-12">{act.title}</h4>
                                                            {act.description && (
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 pr-2">{act.description}</p>
                                                            )}
                                                        </div>

                                                        {/* Edit/Delete Actions */}
                                                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20">
                                                            <button onClick={() => openEditModal(act)} className="p-1.5 text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 transition">
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button onClick={() => handleDeleteActivity(act.id)} className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 transition">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Relocated Delete Trip Area - Visible in both views at the very bottom */}
                <div className="mt-16 mb-6 flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity w-full">
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-red-500 dark:text-red-400 font-bold text-sm bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-900/30 rounded-xl transition-all"
                    >
                        <TrashIcon size={16} />
                        Eliminar Viaje Totalmente
                    </button>
                </div>
            </main>

            {/* FAB global para ambas vistas */}
            <button
                onClick={openNewModal}
                className="fixed bottom-32 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 z-40 group">
                <Plus size={28} className="transition-transform group-hover:rotate-90" />
            </button>

            {/* Activity Modal */}
            <ActivityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveActivity}
                destinations={destinations}
                tripId={tripId}
                existingActivity={editingActivity}
                defaultDate={(view === "calendar" && selectedCalendarDate) ? new Date(selectedCalendarDate + "T12:00:00") : trip?.startDate}
            />

            {/* Add Destination Modal */}
            <AddDestinationModal
                isOpen={isAddDestinationModalOpen}
                onClose={() => setIsAddDestinationModalOpen(false)}
                onSave={handleSaveDestination}
                tripId={tripId}
            />

            {/* Edit Trip Details Modal */}
            <EditTripModal
                isOpen={isEditTripModalOpen}
                onClose={() => setIsEditTripModalOpen(false)}
                onSave={handleSaveTripInfo}
                trip={trip}
            />

            {/* Share Trip Modal */}
            <ShareTripModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                trip={trip}
            />

            {/* Delete Trip Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">¿Eliminar Viaje?</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Esta acción es irreversible. Se borrarán todas las actividades, gastos y documentos asociados a "{trip.name}".</p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmDeleteTrip}
                                disabled={isDeleting}
                                className="w-full py-3.5 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-600 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <TrashIcon size={18} />}
                                {isDeleting ? "Eliminando..." : "Sí, Eliminar Definitivamente"}
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                                className="w-full py-3.5 text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <TripBottomNav tripId={tripId} />
        </div>
    );
}

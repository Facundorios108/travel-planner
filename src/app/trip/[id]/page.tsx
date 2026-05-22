"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use, useTransition, startTransition } from "react";
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
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Trash2 as TrashIcon, AlertTriangle, Users } from "lucide-react";

export default function TripItinerary({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

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

    // ConfirmDialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title?: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, message: "", onConfirm: () => {} });

    // Calendar View state
    const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        
        async function loadData() {
            try {
                // Load data in parallel with cache support
                const [tripData, destinationsData, activitiesData] = await Promise.all([
                    travelService.getTrip(tripId),
                    travelService.getTripDestinations(tripId),
                    travelService.getActivitiesByTrip(tripId)
                ]);
                
                if (!mounted) return;
                
                setTrip(tripData);
                setDestinations(destinationsData);
                setActivities(activitiesData);
            } catch (error) {
                console.error("Failed to load itinerary:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        
        loadData();
        
        return () => {
            mounted = false;
        };
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
        setConfirmDialog({
            isOpen: true,
            title: "Eliminar actividad",
            message: "¿Estás seguro de que deseas eliminar esta actividad?",
            onConfirm: async () => {
                await travelService.deleteActivity(id);
                setActivities(activities.filter(a => a.id !== id));
            }
        });
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
            window.alert("Error al eliminar el viaje.");
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
            {/* Header Itinerario - Hero Image Style - SIMPLIFICADO */}
            <header className="relative h-72 sm:h-80 w-full overflow-hidden shrink-0">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                    style={{ backgroundImage: `url('${trip.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop"}')` }}
                />
                {/* Gradient overlay mejorado */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-slate-50 dark:to-slate-950"></div>

                {/* Top Nav Area - MAS LIMPIA */}
                <div className="absolute top-0 left-0 right-0 px-6 pt-10 pb-4 flex justify-between items-start z-30">
                    <button 
                        onClick={() => router.push("/")} 
                        className="w-12 h-12 flex items-center justify-center bg-white/25 hover:bg-white/40 backdrop-blur-2xl rounded-full text-white transition-all duration-200 shadow-xl hover:scale-110 active:scale-95"
                    >
                        <ChevronLeft size={22} />
                    </button>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsEditTripModalOpen(true)}
                            className="w-11 h-11 flex items-center justify-center bg-white/25 hover:bg-white/40 backdrop-blur-2xl rounded-full text-white transition-all duration-200 shadow-xl hover:scale-110 active:scale-95"
                            title="Editar Viaje"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button
                            onClick={() => setIsShareModalOpen(true)}
                            className="w-11 h-11 flex items-center justify-center bg-white/25 hover:bg-white/40 backdrop-blur-2xl rounded-full text-white transition-all duration-200 shadow-xl hover:scale-110 active:scale-95 relative"
                            title="Compartir Viaje"
                        >
                            <Users size={18} />
                            {trip.collaborators && trip.collaborators.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full border-2 border-white"></span>
                            )}
                        </button>
                        <label
                            className={`relative flex items-center justify-center gap-2.5 px-4 py-2.5 backdrop-blur-2xl rounded-full text-white text-xs font-bold transition-all duration-200 shadow-xl cursor-pointer ${isUploadingImage ? 'bg-blue-500/90 cursor-wait' : 'bg-white/25 hover:bg-white/40 hover:scale-105 active:scale-95'}`}
                        >
                            {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Edit2 size={16} />}
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
                                                window.alert("No se pudo guardar la imagen. Intenta con una foto más liviana.");
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
                    </div>
                </div>

                {/* Bottom Title Area - MAS ESPACIOSA */}
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 z-10 bg-gradient-to-t from-black/60 via-black/20 to-transparent pt-16">
                    <div className="flex flex-col gap-3">
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-2xl">{trip.name}</h1>
                        <p className="text-white/90 font-medium text-base">
                            {destinations.map(d => d.city).join(' • ') || 'Sin destinos'}
                        </p>
                        {trip.startDate && (
                            <span className="inline-flex items-center gap-2 text-sm text-white bg-white/20 backdrop-blur-xl border border-white/30 px-4 py-2 rounded-full mt-1 w-fit shadow-lg" suppressHydrationWarning>
                                <Clock size={15} />
                                {typeof window !== "undefined" && format(new Date(trip.startDate), "d 'de' MMMM, yyyy", { locale: es })}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* View Switcher - FUERA DEL HEADER */}
            <div className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-2xl px-6 py-4">
                <div className="flex justify-center">
                    <div className="inline-flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-full shadow-md">
                        <button
                            onClick={() => setView("timeline")}
                            className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${view === "timeline" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
                        >
                            Timeline
                        </button>
                        <button
                            onClick={() => setView("calendar")}
                            className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${view === "calendar" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
                        >
                            Calendar
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-lg mx-auto px-6 mt-4">
                {view === "timeline" ? (
                    <div className="pb-12">
                        {destinations.map((dest, i) => (
                            <div key={dest.id} className="mb-10">
                                {/* Destination Indicator */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap shadow-lg shadow-blue-500/30">
                                        Destino {i + 1}
                                    </div>
                                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 truncate">{dest.city}</h3>
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-700"></div>
                                </div>

                                {/* Timeline Container */}
                                <div className="relative space-y-6 ml-4">
                                    {/* Vertical Line */}
                                    <div className="absolute left-0 top-6 bottom-[-2rem] w-0.5 bg-slate-200 dark:bg-slate-800 -translate-x-1/2"></div>

                                    {activities.filter(a => a.destinationId === dest.id).length === 0 && (
                                        <div className="relative pl-8 sm:pl-10 group mt-6 pt-2">
                                            {/* Timeline Node Dot for empty state */}
                                            <div className="absolute left-0 top-10 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-slate-50 dark:border-slate-950 -translate-x-1/2 z-10"></div>

                                            <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-[1.5rem] border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-start transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700">
                                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-[1rem] flex items-center justify-center mb-4 text-slate-400 shadow-sm border border-slate-200 dark:border-slate-700">
                                                    <Clock size={20} />
                                                </div>
                                                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">Sin actividades</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Empieza a planear tu día en {dest.city}.</p>
                                                <button
                                                    onClick={() => openNewModal()}
                                                    className="px-5 py-2.5 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-full shadow-md border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95 hover:shadow-lg"
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
                                                <div className="absolute left-0 top-6 w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-4 border-slate-50 dark:border-slate-950 -translate-x-1/2 z-10 shadow-lg shadow-blue-500/30 transition-transform duration-200 group-hover:scale-125"></div>
                                                <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 sm:p-6 shadow-md border border-slate-200/60 dark:border-slate-800/60 transition-all duration-200 hover:shadow-xl hover:border-blue-200/60 dark:hover:border-blue-800/60 hover:-translate-y-1 relative overflow-hidden">

                                                    {/* Edit/Delete Actions */}
                                                    <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-20">
                                                        <button onClick={() => openEditModal(activity)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full transition-all duration-200 hover:scale-110 active:scale-95">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDeleteActivity(activity.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all duration-200 hover:scale-110 active:scale-95">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    <div className="flex justify-between items-start mb-4 pr-20 relative z-10">
                                                        <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-[1.2rem] text-blue-600 dark:text-blue-400 shadow-sm">
                                                            {getActivityIcon(activity.type)}
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="inline-block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200/60 dark:border-slate-700/60" suppressHydrationWarning>
                                                                {typeof window !== "undefined" && format(activity.startDate, "HH:mm", { locale: es })}
                                                                {activity.endDate && typeof window !== "undefined" && ` - ${format(activity.endDate, "HH:mm", { locale: es })}`}
                                                            </span>
                                                            <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest" suppressHydrationWarning>
                                                                {typeof window !== "undefined" && format(activity.startDate, "dd MMM yyyy", { locale: es })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <h4 className="font-bold text-sm sm:text-base mb-1 text-slate-800 dark:text-slate-200 pr-12 relative z-10">{activity.title}</h4>
                                                    {activity.description && (
                                                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-4 p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl whitespace-pre-line border border-slate-200/50 dark:border-slate-700/50 relative z-10">
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
                        <div className="mt-10 flex justify-center">
                            <button
                                onClick={() => setIsAddDestinationModalOpen(true)}
                                className="flex items-center gap-2 px-7 py-3.5 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold rounded-full shadow-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
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
                onTripUpdate={async () => {
                    // Reload trip data to get updated collaborators
                    const updatedTrip = await travelService.getTrip(tripId);
                    setTrip(updatedTrip);
                }}
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

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />

            <TripBottomNav tripId={tripId} />
        </div>
    );
}

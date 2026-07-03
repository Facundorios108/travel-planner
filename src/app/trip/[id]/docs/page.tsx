"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { travelService } from "@/lib/services";
import { Trip, TripDocument, DocumentType } from "@/types/travel";
import TripBottomNav from "@/components/TripBottomNav";
import { ArrowLeft, Search, Ticket, Bed, IdCard, Train, Car, ChevronRight, Plus, FileText, Trash2, Loader2, X, AlertTriangle } from "lucide-react";
import { AddDocumentModal } from "@/components/AddDocumentModal";
import { getDocumentFromCache, deleteDocumentFromCache } from "@/utils/documentCache";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import AuthScreen from "@/components/AuthScreen";

export default function DocumentsPage() {
    const params = useParams();
    const router = useRouter();
    const tripId = params.id as string;
    const { showToast, ToastComponent } = useToast();

    const { user, loading: authLoading } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const [trip, setTrip] = useState<Trip | null>(null);
    const [documents, setDocuments] = useState<TripDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
    
    // ConfirmDialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title?: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, message: "", onConfirm: () => {} });

    useEffect(() => {
        if (!user) return;
        const loadDocs = async () => {
            try {
                const [tripData, docsData] = await Promise.all([
                    travelService.getTrip(tripId),
                    travelService.getTripDocuments(tripId)
                ]);
                setTrip(tripData);
                setDocuments(docsData);
            } catch (err: any) {
                console.error("Error loading docs:", err);
                if (err.message && (err.message.includes("permission") || err.message.includes("Permission"))) {
                    setError("permission-denied");
                } else {
                    setError("general-error");
                }
            } finally {
                setIsLoading(false);
            }
        };
        loadDocs();
    }, [tripId, user]);

    const filters = ['Todos', 'Ticket', 'Hotel', 'ID/Pasaporte', 'Tren/Bus', 'Auto', 'Otro'];

    const getIconForType = (type: DocumentType) => {
        switch (type) {
            case 'ticket': return Ticket;
            case 'hotel': return Bed;
            case 'id': return IdCard;
            case 'train': return Train;
            case 'car': return Car;
            default: return FileText;
        }
    };

    const handleDelete = async (e: React.MouseEvent, docItem: TripDocument) => {
        e.stopPropagation();
        setConfirmDialog({
            isOpen: true,
            title: "Eliminar documento",
            message: `¿Estás seguro de que deseas eliminar "${docItem.title}"?`,
            onConfirm: async () => {
                try {
                    await travelService.deleteDocument(docItem.id!);
                    if (docItem.url?.startsWith("localcache_")) {
                        await deleteDocumentFromCache(docItem.url);
                    }
                    setDocuments(documents.filter(d => d.id !== docItem.id));
                    showToast("Documento eliminado correctamente.", "success");
                } catch (err) {
                    console.error("Error deleting doc", err);
                    showToast("Error al eliminar el documento.", "error");
                }
            }
        });
    };

    const handleOpenDocument = async (url: string) => {
        try {
            let finalUrl = url;
            if (url.startsWith("localcache_")) {
                const cachedData = await getDocumentFromCache(url);
                if (cachedData) {
                    finalUrl = cachedData;
                } else {
                    showToast("Éste archivo no está disponible sin conexión en este dispositivo.", "warning");
                    return;
                }
            }

            if (finalUrl.startsWith("data:image")) {
                setSelectedImage(finalUrl);
            } else if (finalUrl.startsWith("data:application/pdf")) {
                const arr = finalUrl.split(',');
                const mime = arr[0].match(/:(.*?);/)?.[1] || "application/pdf";
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const blob = new Blob([u8arr], { type: mime });
                const blobUrl = URL.createObjectURL(blob);
                setSelectedPdf(blobUrl);
            } else {
                window.open(finalUrl, "_blank");
            }
        } catch (error) {
            console.error("Error opening document", error);
            showToast("Error al abrir el documento.", "error");
        }
    };

    const handleSaveDoc = async (data: any) => {
        // Clean undefined fields to avoid Firebase validation errors
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );
        const id = await travelService.addDocument({ ...cleanData, tripId } as Omit<TripDocument, "id">);
        setDocuments([{ ...(cleanData as unknown as TripDocument), id, tripId, createdAt: new Date() }, ...documents]);
    };

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
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">No tienes permisos para ver los documentos de este viaje.</p>
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

    // Apply Filter and Search
    const filteredDocs = documents.filter(doc => {
        // Text Match
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.subtitle && doc.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));

        // Category Match
        let matchesFilter = true;
        if (activeFilter === 'Ticket') matchesFilter = doc.type === 'ticket';
        if (activeFilter === 'Hotel') matchesFilter = doc.type === 'hotel';
        if (activeFilter === 'ID/Pasaporte') matchesFilter = doc.type === 'id';
        if (activeFilter === 'Tren/Bus') matchesFilter = doc.type === 'train';
        if (activeFilter === 'Auto') matchesFilter = doc.type === 'car';
        if (activeFilter === 'Otro') matchesFilter = doc.type === 'other';

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="bg-[#f8f9fc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans">
            {ToastComponent}
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[#f8f9fc]/80 dark:bg-slate-950/80 backdrop-blur-md px-6 pt-6 pb-4 flex items-center justify-between">
                <button onClick={() => router.push(`/trip/${tripId}`)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800 transition-active active:scale-95 animate-in fade-in duration-200">
                    <ArrowLeft size={24} className="text-slate-900 dark:text-slate-100" />
                </button>
                <h1 className="text-xl font-bold tracking-tight">Mis Documentos</h1>
                <div className="w-12 h-12 invisible"></div>
            </header>

            <main className="flex-1 w-full pb-52">
                {/* Search Bar */}
                <div className="px-6 py-3">
                    <div className="flex w-full items-center rounded-2xl h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm px-4 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                        <Search className="text-slate-400" size={20} />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 px-3"
                            placeholder="Buscar documentos..."
                        />
                    </div>
                </div>

                {/* Filter Chips */}
                <div 
                    className="flex gap-3 px-6 py-4 overflow-x-auto snap-x no-scrollbar-chips"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style>{`
                        .no-scrollbar-chips::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
                    {filters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-6 transition-colors border ${activeFilter === filter
                                ? 'bg-[#1877F2] text-white border-transparent shadow-sm'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-sm border-slate-200 dark:border-slate-800'
                                }`}
                        >
                            <span className={`text-sm ${activeFilter === filter ? 'font-bold' : 'font-medium'}`}>
                                {filter}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Document List & Empty State */}
                <div className="flex-1 overflow-y-auto px-6 py-2 pb-10 space-y-4">
                    {documents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-20 px-6 mt-10 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <div className="w-24 h-24 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-blue-500 shadow-inner">
                                <FileText size={40} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2 tracking-tight">Caja Fuerte Vacía</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[280px] leading-relaxed mb-8">
                                Guarda aquí tus reservas, tickets, pasaportes y seguros para tenerlos siempre a mano y seguros.
                            </p>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <Plus size={18} /> Añadir Documento
                            </button>
                        </div>
                    ) : filteredDocs.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            No se encontraron documentos para estos filtros.
                        </div>
                    ) : (
                        filteredDocs.map((doc) => {
                            const Icon = getIconForType(doc.type);
                            return (
                                <div
                                    key={doc.id}
                                    onClick={() => {
                                        if (doc.url) {
                                            handleOpenDocument(doc.url);
                                        }
                                    }}
                                    className="group relative flex items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[1.5rem] shadow-sm cursor-pointer hover:shadow-md border border-slate-100 dark:border-slate-800 transition-all overflow-hidden"
                                >
                                    <div className="flex items-center justify-center rounded-2xl bg-[#1877F2]/10 dark:bg-[#1877F2]/20 text-[#1877F2] shrink-0 w-14 h-14">
                                        <Icon size={24} />
                                    </div>
                                    <div className="flex flex-col justify-center flex-1 overflow-hidden pr-8">
                                        <p className="text-slate-900 dark:text-slate-100 text-base font-bold truncate">{doc.title}</p>
                                        {doc.subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm font-medium truncate mt-0.5">{doc.subtitle}</p>}
                                    </div>

                                    {/* Action icons stack */}
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleDelete(e, doc)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        {doc.url && (
                                            <div className="p-2 text-slate-400">
                                                <ChevronRight size={20} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            {/* Floating Action Button */}
            {documents.length > 0 && (
                <div className="fixed bottom-44 w-full max-w-2xl pointer-events-none z-20 left-1/2 -translate-x-1/2">
                    <div className="absolute right-6">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="w-16 h-16 bg-[#1877F2] hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-[0_8px_16px_rgba(24,119,242,0.4)] hover:shadow-[0_12px_20px_rgba(24,119,242,0.5)] border border-blue-400 pointer-events-auto group"
                        >
                            <Plus size={32} strokeWidth={2.5} className="transition-transform duration-300 group-hover:rotate-90" />
                        </button>
                    </div>
                </div>
            )}

            <AddDocumentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSaveDoc}
            />

            {/* Document Image Viewer Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" 
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <img 
                        src={selectedImage} 
                        alt="Documento" 
                        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Document PDF Viewer Modal */}
            {selectedPdf && (
                <div 
                    className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-sm flex flex-col p-4 animate-in fade-in" 
                    onClick={() => setSelectedPdf(null)}
                >
                    <div className="flex justify-between items-center pb-4 text-white max-w-lg mx-auto w-full">
                        <h3 className="text-base font-extrabold truncate">Visualizar Documento PDF</h3>
                        <button
                            onClick={() => setSelectedPdf(null)}
                            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors shrink-0 ml-2"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 bg-white rounded-3xl overflow-hidden shadow-2xl relative max-w-lg mx-auto w-full h-full" onClick={(e) => e.stopPropagation()}>
                        <iframe 
                            src={selectedPdf} 
                            className="w-full h-full border-none"
                            title="Visor de PDF"
                        />
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

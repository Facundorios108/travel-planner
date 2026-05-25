"use client";

import React, { useState } from "react";
import { useToast } from "./Toast";
import { X, FileText, Ticket, Bed, IdCard, Train, Car, Link as LinkIcon, Upload } from "lucide-react";
import { DocumentType } from "@/types/travel";
import { saveDocumentToCache } from "@/utils/documentCache";

interface AddDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { title: string; subtitle?: string; type: DocumentType; url?: string }) => Promise<void>;
}

export function AddDocumentModal({ isOpen, onClose, onSave }: AddDocumentModalProps) {
    const { showToast, ToastComponent } = useToast();
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [type, setType] = useState<DocumentType>("ticket");
    const [url, setUrl] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!title.trim()) return;
        setIsSaving(true);
        try {
            await onSave({
                title: title.trim(),
                subtitle: subtitle.trim() || undefined,
                type,
                url: url.trim() || undefined,
            });
            // Reset state
            setTitle("");
            setSubtitle("");
            setType("ticket");
            setUrl("");
            onClose();
        } catch (error) {
            console.error("Error saving document:", error);
            showToast("No se pudo guardar el documento. Verificá tu conexión.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const documentTypes: { value: DocumentType; label: string; icon: any }[] = [
        { value: "ticket", label: "Ticket", icon: Ticket },
        { value: "hotel", label: "Hotel", icon: Bed },
        { value: "id", label: "ID/Pasaporte", icon: IdCard },
        { value: "train", label: "Tren/Bus", icon: Train },
        { value: "car", label: "Auto", icon: Car },
        { value: "other", label: "Otro", icon: FileText },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
            {ToastComponent}
            <div
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:fade-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6">
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Añadir Documento</h2>
                    <button
                        onClick={onClose}
                        className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="px-8 pb-8 space-y-7">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                            Título del Documento *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Boarding Pass Iberia"
                            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-100 text-base font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Subtitle */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                            Subtítulo <span className="text-slate-400 font-normal lowercase">(Opcional)</span>
                        </label>
                        <input
                            type="text"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            placeholder="Ej: Vuelo IB6844"
                            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-100 text-base font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                    </div>

                    {/* Type Chips */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                            Tipo de Documento
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                            {documentTypes.map((dt) => {
                                const Icon = dt.icon;
                                const isSelected = type === dt.value;
                                return (
                                    <button
                                        key={dt.value}
                                        onClick={() => setType(dt.value)}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold transition-all duration-200 ${isSelected
                                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105"
                                            }`}
                                    >
                                        <Icon size={16} />
                                        {dt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* File Attachment or URL */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                            Archivo adjunto <span className="text-slate-400 font-normal lowercase">(Opcional - Imagen o PDF)</span>
                        </label>
                        <div className="space-y-4">
                            {/* Option 1: File Upload */}
                            <label className="flex items-center justify-center gap-3 w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-500/5 dark:hover:to-indigo-500/5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold py-5 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02]">
                                <Upload size={20} />
                                Subir archivo (Imagen o PDF)
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        // Validar tamaño máximo (ej. 5MB)
                                        if (file.size > 5 * 1024 * 1024) {
                                            showToast("Archivo muy grande. Máximo 5MB.", "warning");
                                            return;
                                        }

                                        const reader = new FileReader();
                                        reader.onload = async (event) => {
                                            const base64String = event.target?.result as string;
                                            // Guardar el string en IndexedDB
                                            const fileId = `localcache_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                                            await saveDocumentToCache(fileId, base64String);
                                            setUrl(fileId);
                                        };
                                        reader.readAsDataURL(file);
                                    }}
                                />
                            </label>

                            {/* Option 2: URL */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
                                    <LinkIcon size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={url.startsWith('localcache_') || url.startsWith('data:') ? 'Archivo adjuntado correctamente ✓' : url}
                                    onChange={(e) => {
                                        if (!url.startsWith('localcache_') && !url.startsWith('data:')) {
                                            setUrl(e.target.value);
                                        }
                                    }}
                                    readOnly={url.startsWith('localcache_') || url.startsWith('data:')}
                                    placeholder="O pega un enlace (ej. Google Drive)"
                                    className={`w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 ${url.startsWith('localcache_') || url.startsWith('data:') ? 'text-green-600 dark:text-green-400 font-bold border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10' : ''}`}
                                />
                            </div>
                            {(url.startsWith("localcache_") || url.startsWith("data:")) && (
                                <button
                                    type="button"
                                    onClick={() => setUrl("")}
                                    className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold transition-colors"
                                >
                                    ✕ Eliminar archivo adjunto
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 pb-8 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 font-bold px-6 py-4 rounded-full border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 active:scale-95"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim() || isSaving}
                        className="flex-1 font-bold px-6 py-4 rounded-full text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-xl shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            "Guardar Documento"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

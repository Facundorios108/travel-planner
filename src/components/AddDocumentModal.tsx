"use client";

import React, { useState } from "react";
import { X, FileText, Ticket, Bed, IdCard, Train, Car, Link as LinkIcon, Upload } from "lucide-react";
import { DocumentType } from "@/types/travel";

interface AddDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { title: string; subtitle?: string; type: DocumentType; url?: string }) => Promise<void>;
}

export function AddDocumentModal({ isOpen, onClose, onSave }: AddDocumentModalProps) {
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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-0">
            <div
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl sm:rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in-20 border border-slate-100 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Añadir Documento</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-5 sm:p-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Título del Documento *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Boarding Pass Iberia"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                            autoFocus
                        />
                    </div>

                    {/* Subtitle */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Subtítulo / Nota breve (Opcional)
                        </label>
                        <input
                            type="text"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            placeholder="Ej: Vuelo IB6844"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {/* Type Chips */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                            Tipo de Documento
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {documentTypes.map((dt) => {
                                const Icon = dt.icon;
                                const isSelected = type === dt.value;
                                return (
                                    <button
                                        key={dt.value}
                                        onClick={() => setType(dt.value)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${isSelected
                                            ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400"
                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-200 hover:text-blue-500"
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
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Archivo adjunto o Enlace URL (Opcional)
                        </label>
                        <div className="space-y-3">
                            {/* Option 1: File Upload */}
                            <label className="flex items-center justify-center gap-2 w-full bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium py-3 rounded-xl cursor-pointer transition-colors">
                                <Upload size={18} />
                                Subir imagen desde el dispositivo
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const img = new Image();
                                            img.onload = () => {
                                                const canvas = document.createElement("canvas");
                                                const MAX_WIDTH = 1200;
                                                let scaleSize = 1;
                                                if (img.width > MAX_WIDTH) {
                                                    scaleSize = MAX_WIDTH / img.width;
                                                }
                                                canvas.width = img.width * scaleSize;
                                                canvas.height = img.height * scaleSize;
                                                const ctx = canvas.getContext("2d");
                                                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                                                const base64String = canvas.toDataURL("image/jpeg", 0.7);
                                                setUrl(base64String);
                                            };
                                            img.src = event.target?.result as string;
                                        };
                                        reader.readAsDataURL(file);
                                    }}
                                />
                            </label>

                            {/* Option 2: URL */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 rounded-l-xl">
                                    <LinkIcon size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={url.startsWith('data:image') ? 'Imagen adjuntada correctamente' : url}
                                    onChange={(e) => {
                                        if (!url.startsWith('data:image')) {
                                            setUrl(e.target.value);
                                        }
                                    }}
                                    readOnly={url.startsWith('data:image')}
                                    placeholder="O pega un enlace (ej. Google Drive)"
                                    className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 ${url.startsWith('data:image') ? 'text-green-600 dark:text-green-400 font-medium italic pointer-events-none' : ''}`}
                                />
                            </div>
                            {url.startsWith("data:image") && (
                                <button
                                    type="button"
                                    onClick={() => setUrl("")}
                                    className="text-xs text-red-500 hover:text-red-700 font-bold"
                                >
                                    Eliminar imagen adjunta
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50 dark:bg-slate-950/50">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim() || isSaving}
                        className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Guardar Documento"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

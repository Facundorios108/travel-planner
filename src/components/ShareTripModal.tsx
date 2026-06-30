"use client";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";


import { useState, useEffect } from "react";
import { X, Users, Mail, Loader2, Check, Trash2, Link as LinkIcon, Copy } from "lucide-react";
import { travelService } from "@/lib/services";
import { Trip } from "@/types/travel";
import { useAuth } from "@/context/AuthContext";
import { ConfirmDialog } from "./ConfirmDialog";

interface ShareTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip: Trip | null;
    onTripUpdate?: () => void; // Callback to refresh trip data
}

export function ShareTripModal({ isOpen, onClose, trip, onTripUpdate }: ShareTripModalProps) {
    useLockBodyScroll(isOpen);
    const { user } = useAuth();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [removingEmail, setRemovingEmail] = useState<string | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);
    
    // ConfirmDialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [emailToRemove, setEmailToRemove] = useState<string | null>(null);
    const [collabNames, setCollabNames] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen || !trip || !trip.collaborators || trip.collaborators.length === 0) return;

        async function fetchNames() {
            const collaboratorsList = trip?.collaborators || [];
            const names: Record<string, string> = {};
            await Promise.all(
                collaboratorsList.map(async (email) => {
                    const name = await travelService.getUserNameByEmail(email);
                    names[email] = name;
                })
            );
            setCollabNames(names);
        }

        fetchNames();
    }, [isOpen, trip?.collaborators]);

    if (!isOpen || !trip) return null;

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !email.includes("@")) {
            setError("Por favor ingresa un correo válido.");
            return;
        }

        setError(null);
        setSuccess(false);
        setLoading(true);

        try {
            const inviterName = user?.displayName || user?.email?.split('@')[0] || 'Un amigo';
            const res = await travelService.inviteCollaborator(trip.id, email.trim(), inviterName);
            if (res.success) {
                setSuccess(true);
                setEmail("");
                if (onTripUpdate) onTripUpdate(); // Refresh trip data
            } else {
                setError(res.message);
            }
        } catch (err) {
            console.error(err);
            setError("Error inesperado al invitar al colaborador.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveClick = (collabEmail: string) => {
        setEmailToRemove(collabEmail);
        setConfirmOpen(true);
    };

    const handleConfirmRemove = async () => {
        if (!emailToRemove) return;
        
        setRemovingEmail(emailToRemove);
        setConfirmOpen(false);
        
        try {
            const res = await travelService.removeCollaborator(trip.id, emailToRemove);
            if (res.success) {
                if (onTripUpdate) onTripUpdate(); // Refresh trip data
            } else {
                setError(res.message);
            }
        } catch (err) {
            console.error(err);
            setError("Error al eliminar colaborador.");
        } finally {
            setRemovingEmail(null);
            setEmailToRemove(null);
        }
    };

    const handleCopyLink = async () => {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const shareLink = `${appUrl}/trip/${trip.id}`;
        
        try {
            await navigator.clipboard.writeText(shareLink);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 3000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 transition-all">
            <div
                className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-5 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500 rounded-2xl flex items-center justify-center">
                            <Users size={20} />
                        </div>
                        <div>
                            <h2 className="font-black tracking-tight text-xl text-slate-800 dark:text-slate-100">
                                Compartir Viaje
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                Agrega colaboradores al viaje
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">

                    {/* Copy Link Section - NUEVO Y MÁS ÚTIL */}
                    <div className="mb-6 p-5 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/10 dark:to-blue-500/10 border-2 border-indigo-200 dark:border-indigo-500/30 rounded-2xl">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                                <LinkIcon size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-lg text-slate-800 dark:text-slate-100 mb-1">
                                    Compartir con link
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Copia el link y compártelo por WhatsApp, Telegram o donde quieras. El invitado debe iniciar sesión con el email que agregues abajo.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleCopyLink}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {linkCopied ? (
                                <>
                                    <Check size={18} />
                                    ¡Link copiado!
                                </>
                            ) : (
                                <>
                                    <Copy size={18} />
                                    Copiar Link de Invitación
                                </>
                            )}
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 font-bold">O invita por email</span>
                        </div>
                    </div>

                    <form onSubmit={handleInvite} className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            1. Agrega el email del colaborador
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            Tu amigo debe iniciar sesión con este email para ver el viaje
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={16} className="text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !email.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : "Agregar"}
                            </button>
                        </div>

                        {error && (
                            <p className="mt-2 text-sm text-red-500 font-medium animate-in fade-in">{error}</p>
                        )}
                        {success && (
                            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl animate-in fade-in flex flex-col gap-2">
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                                    <Check size={16} /> ¡Colaborador agregado!
                                </p>
                                <p className="text-xs text-emerald-700 dark:text-emerald-500/90 leading-relaxed">
                                    <strong>Ahora comparte el link</strong> usando el botón de arriba. Cuando tu amigo inicie sesión con <strong>{email}</strong>, verá este viaje automáticamente.
                                </p>
                            </div>
                        )}
                    </form>

                    <div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                            Colaboradores ({trip.collaborators?.length || 0})
                        </h3>
                        {(!trip.collaborators || trip.collaborators.length === 0) ? (
                            <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                <Users size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Aún no hay colaboradores</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {trip.collaborators.map((collabEmail, idx) => (
                                    <li key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                {(collabNames[collabEmail] || collabEmail).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                <span className="text-sm font-bold truncate text-slate-700 dark:text-slate-350">
                                                    {collabNames[collabEmail] || collabEmail}
                                                </span>
                                                {collabNames[collabEmail] && (
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-450 truncate">
                                                        {collabEmail}
                                                    </span>
                                                )}
                                                {trip.activeCollaborators?.some(ac => ac.toLowerCase() === collabEmail.toLowerCase()) ? (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded w-fit border border-emerald-200 dark:border-emerald-500/20 mt-1">
                                                        Activo
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded w-fit border border-amber-200 dark:border-amber-500/20 mt-1">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveClick(collabEmail)}
                                            disabled={removingEmail === collabEmail}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50 flex-shrink-0"
                                            title="Eliminar colaborador"
                                        >
                                            {removingEmail === collabEmail ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Bottom padding for mobile */}
                <div className="pb-8 sm:pb-0"></div>
            </div>

            {/* ConfirmDialog */}
            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => {
                    setConfirmOpen(false);
                    setEmailToRemove(null);
                }}
                onConfirm={handleConfirmRemove}
                title="¿Eliminar colaborador?"
                message={`¿Estás seguro de que quieres eliminar a ${emailToRemove}? Ya no podrá acceder a este viaje.`}
                variant="danger"
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
}

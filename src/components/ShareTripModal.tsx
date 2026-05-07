"use client";

import { useState } from "react";
import { X, Users, Mail, Loader2, Check } from "lucide-react";
import { travelService } from "@/lib/services";
import { Trip } from "@/types/travel";

interface ShareTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip: Trip | null;
}

export function ShareTripModal({ isOpen, onClose, trip }: ShareTripModalProps) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

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
            const res = await travelService.inviteCollaborator(trip.id, email.trim());
            if (res.success) {
                setSuccess(true);
                setEmail("");
                // Optionally update the local trip object here if passed down
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
                                Invita a otros a colaborar
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

                    <form onSubmit={handleInvite} className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Invitar por correo electrónico
                        </label>
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
                                {loading ? <Loader2 size={18} className="animate-spin" /> : "Invitar"}
                            </button>
                        </div>

                        {error && (
                            <p className="mt-2 text-sm text-red-500 font-medium animate-in fade-in">{error}</p>
                        )}
                        {success && (
                            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl animate-in fade-in flex flex-col gap-2">
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                                    <Check size={16} /> ¡Acceso concedido!
                                </p>
                                <p className="text-xs text-emerald-700 dark:text-emerald-500/90 leading-relaxed">
                                    Cuando tu amigo inicie sesión en StayFinder con ese correo, verá este viaje automáticamente. <br />
                                    <span className="italic opacity-80 font-medium mt-1 inline-block">*Nota: Por ser una versión Beta de prueba, no se envían correos reales a la bandeja de entrada.</span>
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
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                {collabEmail.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-bold truncate max-w-[200px] text-slate-700 dark:text-slate-300">
                                                {collabEmail}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                            Invitado
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Bottom padding for mobile */}
                <div className="pb-8 sm:pb-0"></div>
            </div>
        </div>
    );
}

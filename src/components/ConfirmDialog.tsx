"use client";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";


import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Aceptar",
    cancelText = "Cancelar",
    variant = "danger"
}: ConfirmDialogProps) {
    useLockBodyScroll(isOpen);
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const variantStyles = {
        danger: {
            iconBg: "bg-red-100 dark:bg-red-500/20",
            iconColor: "text-red-600 dark:text-red-400",
            confirmBtn: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/30"
        },
        warning: {
            iconBg: "bg-amber-100 dark:bg-amber-500/20",
            iconColor: "text-amber-600 dark:text-amber-400",
            confirmBtn: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/30"
        },
        info: {
            iconBg: "bg-blue-100 dark:bg-blue-500/20",
            iconColor: "text-blue-600 dark:text-blue-400",
            confirmBtn: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/30"
        }
    };

    const styles = variantStyles[variant];

    return (
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 pt-8 pb-6">
                    <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl ${styles.iconBg} flex items-center justify-center shrink-0`}>
                            <AlertTriangle size={28} className={styles.iconColor} />
                        </div>
                        <div className="flex-1 pt-1">
                            {title && (
                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
                                    {title}
                                </h3>
                            )}
                            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-8 pb-8 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-full transition-colors duration-200"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-8 py-3 text-white font-bold rounded-full shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 ${styles.confirmBtn}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

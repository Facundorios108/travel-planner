"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastProps {
    message: string;
    variant?: ToastVariant;
    isOpen: boolean;
    onClose: () => void;
    duration?: number;
}

const variantConfig = {
    success: {
        icon: CheckCircle2,
        bg: "bg-emerald-50 dark:bg-emerald-500/15",
        border: "border-emerald-200 dark:border-emerald-800/50",
        iconColor: "text-emerald-500",
        textColor: "text-emerald-800 dark:text-emerald-300",
    },
    error: {
        icon: XCircle,
        bg: "bg-red-50 dark:bg-red-500/15",
        border: "border-red-200 dark:border-red-800/50",
        iconColor: "text-red-500",
        textColor: "text-red-800 dark:text-red-300",
    },
    info: {
        icon: Info,
        bg: "bg-blue-50 dark:bg-blue-500/15",
        border: "border-blue-200 dark:border-blue-800/50",
        iconColor: "text-blue-500",
        textColor: "text-blue-800 dark:text-blue-300",
    },
    warning: {
        icon: AlertTriangle,
        bg: "bg-amber-50 dark:bg-amber-500/15",
        border: "border-amber-200 dark:border-amber-800/50",
        iconColor: "text-amber-500",
        textColor: "text-amber-800 dark:text-amber-300",
    },
};

export function Toast({ message, variant = "info", isOpen, onClose, duration = 3500 }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Trigger entrance animation
            requestAnimationFrame(() => setIsVisible(true));

            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onClose, 300); // Wait for exit animation
            }, duration);

            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isOpen, duration, onClose]);

    if (!isOpen) return null;

    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-[calc(100%-48px)] max-w-[400px] pointer-events-auto">
            <div
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 ${config.bg} ${config.border} ${
                    isVisible
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 -translate-y-4 scale-95"
                }`}
            >
                <Icon size={20} className={`${config.iconColor} shrink-0`} />
                <p className={`text-sm font-semibold flex-1 ${config.textColor}`}>{message}</p>
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(onClose, 300);
                    }}
                    className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition shrink-0"
                >
                    <X size={16} className="text-slate-400" />
                </button>
            </div>
        </div>
    );
}

// Hook for easy Toast state management
export function useToast() {
    const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

    const showToast = (message: string, variant: ToastVariant = "info") => {
        setToast({ message, variant });
    };

    const hideToast = () => setToast(null);

    return {
        toast,
        showToast,
        hideToast,
        ToastComponent: toast ? (
            <Toast
                message={toast.message}
                variant={toast.variant}
                isOpen={true}
                onClose={hideToast}
            />
        ) : null,
    };
}

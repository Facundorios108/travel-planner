"use client";

import { useEffect } from "react";
import { WifiOff, RefreshCcw, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 mb-6 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center shadow-sm border border-red-100 dark:border-red-500/20">
                <WifiOff size={48} strokeWidth={1.5} />
            </div>

            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-3 tracking-tight">
                Oops, conexión perdida
            </h1>

            <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-sm text-base leading-relaxed">
                No podemos cargar tus datos de viaje en este momento. Por favor, verificá tu conexión a internet e intentá nuevamente.
            </p>

            <div className="flex flex-col w-full max-w-xs gap-3">
                <button
                    onClick={() => reset()}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-6 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                >
                    <RefreshCcw size={18} />
                    Reintentar
                </button>

                <button
                    onClick={() => router.push("/")}
                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 py-3.5 px-6 rounded-xl font-bold shadow-sm transition-all active:scale-95"
                >
                    <ArrowLeft size={18} />
                    Volver al Inicio
                </button>
            </div>
        </div>
    );
}

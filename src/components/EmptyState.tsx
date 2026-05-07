"use client";

import { Send, Plus } from "lucide-react";

export default function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center mt-12 pb-12">
            {/* Minimalist Illustration Area */}
            <div className="relative w-64 h-64 mb-10 flex items-center justify-center">
                {/* Background Decorative Shape */}
                <div className="absolute inset-0 bg-blue-500/5 rounded-full scale-110 blur-3xl"></div>

                {/* Airplane Illustration */}
                <div className="relative z-10 flex flex-col items-center">
                    <div className="text-blue-500 opacity-90">
                        <Send size={120} strokeWidth={1} className="-rotate-[20deg]" />
                    </div>
                    {/* Trailing Lines */}
                    <div className="absolute -bottom-4 -left-8 flex flex-col gap-1 opacity-20">
                        <div className="h-1 w-12 bg-blue-500 rounded-full -rotate-12"></div>
                        <div className="h-1 w-8 bg-blue-500 rounded-full -rotate-12 ml-4"></div>
                    </div>
                </div>
            </div>

            {/* Typography */}
            <div className="max-w-xs space-y-4">
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    Tu aventura empieza aquí
                </h2>
                <p className="text-slate-500 leading-relaxed">
                    Empieza a planificar tu próximo viaje y mantén tus itinerarios en un solo lugar.
                </p>
            </div>

            {/* Action Button */}
            <button
                onClick={onAdd}
                className="mt-12 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-10 rounded-full shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-[0.98]"
            >
                <Plus size={24} />
                <span>Crear Nuevo Viaje</span>
            </button>
        </div>
    );
}

"use client";

import { Send, Plus } from "lucide-react";

export default function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center mt-12 pb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Premium Illustration Area */}
            <div className="relative w-64 h-64 mb-10 flex items-center justify-center">
                {/* Background Decorative Gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-indigo-600/20 rounded-full scale-125 blur-[60px] animate-pulse"></div>
                
                <div className="relative z-10 w-48 h-48 glass rounded-[3rem] border border-white/20 flex items-center justify-center shadow-2xl">
                    <div className="text-blue-500">
                        <Send size={80} strokeWidth={1.5} className="-rotate-[15deg] drop-shadow-[0_10px_10px_rgba(59,130,246,0.3)]" />
                    </div>
                    {/* Floating elements */}
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-bounce transition-all duration-1000">
                        <Plus size={20} className="text-white" />
                    </div>
                </div>
            </div>

            {/* Typography */}
            <div className="max-w-xs space-y-4">
                <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                    Tu aventura <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">empieza aquí</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Empieza a planificar tu próximo viaje y mantén tus itinerarios en un solo lugar.
                </p>
            </div>

            {/* Action Button */}
            <button
                onClick={onAdd}
                className="mt-12 group relative inline-flex items-center justify-center px-10 py-5 font-bold text-white transition-all duration-200 bg-blue-600 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95"
            >
                <Plus size={24} className="mr-2 group-hover:rotate-90 transition-transform" />
                <span>Crear Nuevo Viaje</span>
            </button>
        </div>
    );
}

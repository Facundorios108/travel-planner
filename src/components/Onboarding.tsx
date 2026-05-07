"use client";

import { useState } from "react";
import { Plane, Compass, Map, ChevronRight } from "lucide-react";

interface OnboardingProps {
    onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            icon: <Map className="text-blue-500 w-16 h-16" />,
            title: "Planifica tus viajes",
            description: "Organiza todo tu itinerario, desde vuelos hasta hoteles, en un solo lugar y de forma sencilla."
        },
        {
            icon: <Compass className="text-orange-500 w-16 h-16" />,
            title: "Descubre destinos",
            description: "Añade múltiples ciudades, guarda recomendaciones y arma el viaje de tus sueños paso a paso."
        },
        {
            icon: <Plane className="text-emerald-500 w-16 h-16" />,
            title: "Viaja sin estrés",
            description: "Ten a mano tus reservas, gastos y documentos. Colabora con amigos para que nada falle."
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 px-6 pb-12 pt-16">

            {/* Dots */}
            <div className="flex items-center justify-center gap-2 mb-12 flex-none">
                {steps.map((_, index) => (
                    <div
                        key={index}
                        className={`h-2 rounded-full transition-all duration-300 ${index === currentStep ? "w-8 bg-blue-600 dark:bg-blue-500" : "w-2 bg-slate-200 dark:bg-slate-800"
                            }`}
                    />
                ))}
            </div>

            {/* Content Slider */}
            <div className="flex-1 flex flex-col items-center justify-center text-center -mt-10 overflow-hidden relative">
                {steps.map((step, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 transform ${index === currentStep ? "translate-x-0 opacity-100" : index < currentStep ? "-translate-x-full opacity-0" : "translate-x-full opacity-0"
                            }`}
                    >
                        <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-full shadow-lg shadow-blue-500/10 flex items-center justify-center mb-8 border border-slate-100 dark:border-slate-800">
                            {step.icon}
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
                            {step.title}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-base sm:text-lg max-w-[280px] leading-relaxed">
                            {step.description}
                        </p>
                    </div>
                ))}
            </div>

            {/* Bottom Actions */}
            <div className="w-full flex-none pt-8">
                <button
                    onClick={handleNext}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {currentStep === steps.length - 1 ? "Comenzar Aventura" : "Siguiente"}
                    <ChevronRight size={20} />
                </button>

                {currentStep < steps.length - 1 && (
                    <button
                        onClick={onComplete}
                        className="w-full py-4 mt-2 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                        Saltar
                    </button>
                )}
            </div>
        </div>
    );
}

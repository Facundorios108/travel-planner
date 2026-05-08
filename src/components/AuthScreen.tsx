"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Plane } from "lucide-react";
import Onboarding from "./Onboarding";

export default function AuthScreen() {
    const { signInWithGoogle } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Onboarding State
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        // Check local storage for first time visit
        const hasSeenOnboarding = localStorage.getItem("travel_planner_onboarding_seen");
        if (!hasSeenOnboarding) {
            setShowOnboarding(true);
        }
    }, []);

    const handleOnboardingComplete = () => {
        localStorage.setItem("travel_planner_onboarding_seen", "true");
        setShowOnboarding(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            setError(err.message || "Ha ocurrido un error");
        }
    };

    const handleGoogleAuth = async () => {
        setError("");
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message || "Error al iniciar sesión con Google");
        }
    }

    if (showOnboarding) {
        return <Onboarding onComplete={handleOnboardingComplete} />;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 dark:bg-slate-950 transition-colors">
            <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center transition-colors">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-6">
                    <Plane size={32} />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                    {isLogin ? "Bienvenido de nuevo" : "Comienza tu aventura"}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 text-center">
                    {isLogin
                        ? "Inicia sesión para gestionar tus próximos viajes."
                        : "Crea una cuenta para empezar a planificar tu itinerario."}
                </p>

                {error && (
                    <div className="w-full mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGoogleAuth}
                    className="w-full flex items-center justify-center gap-3 py-4 mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                    Continuar con Google
                </button>

                <div className="w-full flex items-center justify-between mb-4">
                    <hr className="w-full border-slate-200 dark:border-slate-800" />
                    <span className="px-3 text-sm text-slate-400 dark:text-slate-500">o</span>
                    <hr className="w-full border-slate-200 dark:border-slate-800" />
                </div>

                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-4 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 font-medium rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            placeholder="tu@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-4 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 font-medium rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 mt-6 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-bold rounded-full transition-colors shadow-lg shadow-slate-900/20 dark:shadow-blue-500/20"
                    >
                        {isLogin ? "Iniciar con Email" : "Registrarse con Email"}
                    </button>
                </form>

                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="mt-6 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-bold border-b border-transparent hover:border-slate-800 dark:hover:border-slate-200"
                >
                    {isLogin
                        ? "¿No tienes cuenta? Regístrate aquí"
                        : "¿Ya tienes cuenta? Inicia sesión"}
                </button>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { travelService } from "@/lib/services";
import { UserSettings } from "@/types/travel";
import { useTheme } from "next-themes";
import { useToast } from "@/components/Toast";
import {
    ChevronLeft,
    Moon,
    Sun,
    Monitor,
    Globe,
    CircleDollarSign,
    Bell,
    LogOut,
    Save,
    Loader2
} from "lucide-react";

export default function SettingsPage() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const { showToast, ToastComponent } = useToast();

    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push("/");
            return;
        }

        async function loadSettings() {
            try {
                const userSettings = await travelService.getUserSettings(user!.uid);
                if (userSettings) {
                    setSettings(userSettings);
                } else {
                    // Defaults
                    setSettings({
                        theme: 'system',
                        currency: 'USD',
                        language: 'es',
                        pushNotifications: false
                    });
                }
            } catch (error) {
                console.error("Error loading settings:", error);
            } finally {
                setLoading(false);
            }
        }

        loadSettings();
    }, [user, router]);

    const handleChange = (key: keyof UserSettings, value: string | boolean) => {
        if (!settings) return;

        setSettings({ ...settings, [key]: value });
        setUnsavedChanges(true);

        // Applica el tema visualmente al instante para mejor UX
        if (key === 'theme') {
            setTheme(value as string);
        }
    };

    const handleSave = async () => {
        if (!user || !settings) return;

        setSaving(true);
        try {
            await travelService.updateUserSettings(user.uid, settings);
            setUnsavedChanges(false);
            showToast("Ajustes guardados correctamente.", "success");
        } catch (error) {
            console.error("Error saving settings:", error);
            showToast("Error al guardar los ajustes.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
            {ToastComponent}
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Ajustes</h1>
                </div>

                {unsavedChanges && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full shadow-sm disabled:opacity-50 transition"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar
                    </button>
                )}
            </header>

            <main className="max-w-lg mx-auto px-6 py-8 space-y-8">

                {/* Account Section */}
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 px-2">Cuenta</h2>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-1 shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
                            <div>
                                <p className="font-bold">{user?.displayName || "Usuario"}</p>
                                <p className="text-sm text-slate-500">{user?.email}</p>
                            </div>
                            {user?.photoURL && (
                                <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700" />
                            )}
                        </div>

                        <button
                            onClick={async () => {
                                await signOut();
                                router.push("/");
                            }}
                            className="w-full flex items-center gap-3 p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                        >
                            <LogOut size={20} />
                            <span className="font-bold">Cerrar Sesión</span>
                        </button>
                    </div>
                </section>

                {/* Preferences Section */}
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 px-2">Preferencias de App</h2>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 shadow-sm border border-slate-200 dark:border-slate-800 space-y-1">

                        {/* Theme */}
                        <div className="p-3">
                            <label className="flex items-center gap-3 mb-3 px-1">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl">
                                    <Monitor size={18} />
                                </div>
                                <span className="font-bold">Apariencia</span>
                            </label>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                                <button
                                    onClick={() => handleChange('theme', 'light')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition ${settings?.theme === 'light' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    <Sun size={16} /> Claro
                                </button>
                                <button
                                    onClick={() => handleChange('theme', 'dark')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition ${settings?.theme === 'dark' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    <Moon size={16} /> Oscuro
                                </button>
                                <button
                                    onClick={() => handleChange('theme', 'system')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition ${settings?.theme === 'system' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    <Monitor size={16} /> Sistema
                                </button>
                            </div>
                        </div>

                        {/* Currency */}
                        <div className="p-3 flex items-center justify-between group">
                            <label className="flex items-center gap-3 px-1 cursor-pointer w-full" htmlFor="currency-select">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl">
                                    <CircleDollarSign size={18} />
                                </div>
                                <span className="font-bold">Moneda Principal</span>
                            </label>
                            <select
                                id="currency-select"
                                value={settings?.currency || 'USD'}
                                onChange={(e) => handleChange('currency', e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="ARS">ARS ($)</option>
                                <option value="MXN">MXN ($)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>

                        {/* Language */}
                        <div className="p-3 flex items-center justify-between">
                            <label className="flex items-center gap-3 px-1 w-full" htmlFor="language-select">
                                <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl">
                                    <Globe size={18} />
                                </div>
                                <span className="font-bold">Idioma</span>
                            </label>
                            <select
                                id="language-select"
                                value={settings?.language || 'es'}
                                onChange={(e) => handleChange('language', e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                            >
                                <option value="es">Español</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Notifications Section */}
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 px-2">Notificaciones</h2>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-1 shadow-sm border border-slate-200 dark:border-slate-800">
                        <label className="p-4 flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-xl">
                                    <Bell size={18} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-100">Recordatorios de Viaje</p>
                                    <p className="text-xs text-slate-500">Recibe alertas antes de vuelos o actividades.</p>
                                </div>
                            </div>

                            {/* Custom Toggle Switch */}
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings?.pushNotifications ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={settings?.pushNotifications || false}
                                    onChange={(e) => handleChange('pushNotifications', e.target.checked)}
                                />
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings?.pushNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                            </div>
                        </label>
                    </div>
                </section>

            </main>
        </div>
    );
}

"use client";

import { useAuth } from "@/context/AuthContext";
import AuthScreen from "@/components/AuthScreen";
import { Loader2 } from "lucide-react";
// Placeholder para la siguiente pantalla
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <Dashboard />;
}

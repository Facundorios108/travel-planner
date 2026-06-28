"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { travelService } from "@/lib/services";
import { UserPassport, PassportCountry, Trip } from "@/types/travel";
import { countriesMap, countriesList } from "@/utils/countriesData";
import { syncTripsToPassport } from "@/utils/passportSync";
import WorldMap from "./WorldMap";
import CountryDetailDrawer from "./CountryDetailDrawer";
import PassportModal from "./PassportModal";
import { Globe, ChevronRight, Home, Bookmark, Check } from "lucide-react";
import { hapticFeedback } from "@/utils/haptics";

interface MundoTabProps {
  trips: Trip[];
}

export default function MundoTab({ trips }: MundoTabProps) {
  const { user } = useAuth();
  const [passport, setPassport] = useState<UserPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<{ id: string; name: string } | null>(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);

  // Load user passport
  useEffect(() => {
    if (!user) return;
    const userId = user.uid;

    async function loadPassport() {
      try {
        const userPassport = await travelService.getUserPassport(userId);
        setPassport(userPassport);
        
        // Run background automatic sync with trips
        const synced = await syncTripsToPassport(userId, trips, userPassport);
        if (synced) {
          setPassport(synced);
        }
      } catch (error) {
        console.error("Error loading passport:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPassport();
  }, [user, trips]);

  const handleCountrySelect = (countryId: string, englishName: string) => {
    hapticFeedback.light();
    setSelectedCountry({ id: countryId, name: englishName });
  };

  const handleSaveCountry = async (record: Omit<PassportCountry, "countryCode">) => {
    if (!user || !selectedCountry) return;

    hapticFeedback.medium();
    const updatedCountries = passport ? { ...passport.countries } : {};
    updatedCountries[selectedCountry.id] = {
      countryCode: selectedCountry.id,
      ...record,
    };

    try {
      await travelService.saveUserPassport(user.uid, updatedCountries);
      setPassport((prev) => ({
        userId: user.uid,
        countries: updatedCountries,
        updatedAt: new Date(),
      }));
      setSelectedCountry(null);
    } catch (e) {
      console.error("Error saving country status:", e);
    }
  };

  const handleDeleteCountry = async () => {
    if (!user || !selectedCountry) return;

    hapticFeedback.error();
    const updatedCountries = passport ? { ...passport.countries } : {};
    delete updatedCountries[selectedCountry.id];

    try {
      await travelService.saveUserPassport(user.uid, updatedCountries);
      setPassport((prev) => ({
        userId: user.uid,
        countries: updatedCountries,
        updatedAt: new Date(),
      }));
      setSelectedCountry(null);
    } catch (e) {
      console.error("Error deleting country status:", e);
    }
  };

  const getStats = () => {
    if (!passport) return { visited: 0, wantToGo: 0, lived: 0, pct: "0.00" };

    const countries = Object.values(passport.countries);
    const visited = countries.filter((c) => c.status === "visited").length;
    const lived = countries.filter((c) => c.status === "lived").length;
    const wantToGo = countries.filter((c) => c.status === "want_to_go").length;

    // Use 194 UN states as standard base (like user's 6/194 screen)
    const pct = ((visited / 194) * 100).toFixed(2);

    return { visited, wantToGo, lived, pct };
  };

  const stats = getStats();
  const activeRecord = selectedCountry ? passport?.countries[selectedCountry.id] || null : null;
  const activeMetadata = selectedCountry ? countriesMap[selectedCountry.id] : undefined;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Stats Card Dashboard */}
      <div
        onClick={() => {
          hapticFeedback.light();
          setIsPassportOpen(true);
        }}
        className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 p-5 rounded-[2.2rem] shadow-sm flex items-center justify-between hover:shadow-md active:scale-[0.98] transition-all cursor-pointer group"
      >
        <div className="flex-1 grid grid-cols-3 gap-2 divide-x divide-slate-100 dark:divide-slate-800">
          <div className="text-center pr-2">
            <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              Visitado
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-white mt-1 block">
              {stats.visited}
              <span className="text-[10px] text-slate-400 font-semibold">/194</span>
            </span>
          </div>
          <div className="text-center px-2">
            <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              del mundo
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-white mt-1 block">
              {stats.pct}%
            </span>
          </div>
          <div className="text-center pl-2">
            <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              Quiero ir
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-white mt-1 block">
              {stats.wantToGo}
            </span>
          </div>
        </div>

        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 transition-all shrink-0 ml-3">
          <ChevronRight size={18} strokeWidth={2.5} />
        </div>
      </div>

      {/* World Map */}
      <WorldMap
        passportCountries={passport?.countries || {}}
        countriesLookup={countriesMap}
        onSelectCountry={handleCountrySelect}
      />

      {/* Map Legend */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 p-4.5 rounded-[2rem] shadow-sm space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Referencias del mapa
        </h4>
        <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-300 dark:bg-emerald-400 border border-white dark:border-slate-950 shadow-sm"></div>
            <span className="text-slate-600 dark:text-slate-350">Visitado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-450 dark:bg-rose-400 border border-white dark:border-slate-950 shadow-sm"></div>
            <span className="text-slate-600 dark:text-slate-350">Viví</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 border border-white dark:border-slate-950 shadow-sm"></div>
            <span className="text-slate-600 dark:text-slate-350">Quiero ir</span>
          </div>
        </div>
      </div>

      {/* Detail Drawer (Floating Modal) */}
      {selectedCountry && (
        <CountryDetailDrawer
          countryId={selectedCountry.id}
          englishName={selectedCountry.name}
          metadata={activeMetadata}
          trips={trips}
          existingRecord={activeRecord}
          onClose={() => setSelectedCountry(null)}
          onSave={handleSaveCountry}
          onDelete={handleDeleteCountry}
        />
      )}

      {/* Passport Detailed List Modal */}
      {isPassportOpen && (
        <PassportModal
          passportCountries={passport?.countries || {}}
          countriesLookup={countriesMap}
          onClose={() => setIsPassportOpen(false)}
          onEditCountry={handleCountrySelect}
        />
      )}
    </div>
  );
}

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
import { Globe, ChevronRight, Home, Bookmark, Check, Search } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

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
        <div className="flex-1 grid grid-cols-3 gap-2 divide-x divide-slate-100 dark:divide-slate-800 h-full items-end">
          <div className="flex flex-col items-center justify-end h-full text-center pr-2">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              Visitado
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-white leading-none flex items-baseline">
              {stats.visited}
              <span className="text-[10px] text-slate-400 font-semibold ml-0.5">/194</span>
            </span>
          </div>
          <div className="flex flex-col items-center justify-end h-full text-center px-2">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-tight mb-1">
              Del mundo
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-white leading-none">
              {stats.pct}%
            </span>
          </div>
          <div className="flex flex-col items-center justify-end h-full text-center pl-2">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              Quiero ir
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-white leading-none">
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

      {/* Quick Search */}
      <div className="relative z-20">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search size={18} strokeWidth={2.5} />
        </div>
        <input
          type="text"
          placeholder="Buscar un país para añadir..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-[2rem] pl-12 pr-5 py-4 text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all"
        />
        {searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl max-h-60 overflow-y-auto z-50 p-2 space-y-1">
            {countriesList
              .filter((c) =>
                c.spanishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .slice(0, 5)
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    handleCountrySelect(c.id, c.name);
                    setSearchQuery("");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{c.flag}</span>
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                      {c.spanishName}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              ))}
            {countriesList.filter((c) =>
                c.spanishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 && (
                <div className="p-4 text-center text-sm font-medium text-slate-500">
                  No se encontraron países.
                </div>
              )}
          </div>
        )}
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

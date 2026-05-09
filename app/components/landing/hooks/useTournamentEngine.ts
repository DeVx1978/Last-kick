"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useTournamentEngine() {
  const [activeTournamentTab, setActiveTournamentTab] =
    useState<string>("champions");

  const [activePhaseFilter, setActivePhaseFilter] =
    useState<string | null>(null);

  const [activeTournaments, setActiveTournaments] = useState<any[]>([]);

  const [tournamentMatches, setTournamentMatches] =
    useState<Record<string, any[]>>({});

  useEffect(() => {
    const loadData = async () => {
      const { data: tourneysData } = await supabase
        .from("tournaments")
        .select("*")
        .eq("status", "ACTIVE");

      setActiveTournaments(tourneysData || []);
    };

    loadData();
  }, []);

  const tournamentsWithMatches = activeTournaments.map((t: any) => ({
    ...t,
    matches: tournamentMatches[t.id] || [],
  }));

  return {
    activeTournamentTab,
    setActiveTournamentTab,

    activePhaseFilter,
    setActivePhaseFilter,

    activeTournaments,
    setActiveTournaments,

    tournamentMatches,
    setTournamentMatches,

    tournamentsWithMatches,
  };
}
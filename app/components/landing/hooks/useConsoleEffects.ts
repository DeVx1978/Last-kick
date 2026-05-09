"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  isGameActive: boolean;
  setUserId: (id: string) => void;
  setUserLives: (lives: number) => void;
  setIsLoadingData: (value: boolean) => void;
  setLiveUsers: (cb: any) => void;
  setJackpotTotal: (value: number) => void;
  setNotifications: (cb: any) => void;
  setLoading: (value: boolean) => void;
  setTimeLeft: (value: any) => void;
};

export function useConsoleEffects({
  isGameActive,
  setUserId,
  setUserLives,
  setIsLoadingData,
  setLiveUsers,
  setJackpotTotal,
  setNotifications,
  setLoading,
  setTimeLeft,
}: Props) {
  // Sync real data
  useEffect(() => {
    const syncData = async () => {
      const { count: realUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { data: torneos } = await supabase
        .from("tournaments")
        .select("prize_current");

      const realPrize =
        torneos?.reduce(
          (acc, t) => acc + (Number(t.prize_current) || 0),
          0
        ) || 0;

      setLiveUsers(realUsers || 0);
      setJackpotTotal(100000 + realPrize);
    };

    syncData();

    const interval = setInterval(syncData, 300000);
    return () => clearInterval(interval);
  }, []);

  // body lock modal
  useEffect(() => {
    document.body.style.overflow = isGameActive ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isGameActive]);

  // session data
  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setUserId(session.user.id);

          const { data } = await supabase
            .from("profiles")
            .select("lives")
            .eq("id", session.user.id)
            .single();

          if (data) setUserLives(data.lives);
        }
      } catch (error) {
        console.error("Fallo de escáner:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchSystemData();
  }, []);

  // simulation
  useEffect(() => {
    const sim = setInterval(() => {
      setLiveUsers((prev: number) => prev + (Math.random() > 0.5 ? 1 : 0));

      if (Math.random() > 0.9) {
        const id = Date.now();

        setNotifications((prev: any[]) =>
          [
            { id, text: "JUGADOR HA INGRESADO", type: "entry" },
            ...prev,
          ].slice(0, 3)
        );

        setTimeout(() => {
          setNotifications((prev: any[]) =>
            prev.filter((n) => n.id !== id)
          );
        }, 4000);
      }
    }, 20000);

    return () => clearInterval(sim);
  }, []);

  // loading
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);

  // countdown
  useEffect(() => {
    const targetDate = new Date("2026-06-11T00:00:00").getTime();

    const update = () => {
      const diff = targetDate - Date.now();

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        });
      }
    };

    update();

    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);
}
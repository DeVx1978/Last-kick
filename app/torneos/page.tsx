"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ArrowLeft,
  MapPin,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function TorneosPage() {
  const router = useRouter();

  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] =
    useState<any>(null);

  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] =
    useState("TODOS");

  const [selectedDate, setSelectedDate] =
    useState("");

  /* =====================================
     INIT
  ===================================== */
  useEffect(() => {
    loadTournaments();
    loadLiveMatches();
  }, []);

  /* =====================================
     REFRESH SILENCIOSO
  ===================================== */
  useEffect(() => {
    const interval = setInterval(() => {
      loadLiveMatches(true);
    }, 60000); // cada minuto

    return () =>
      clearInterval(interval);
  }, []);

  /* =====================================
     TORNEOS
  ===================================== */
  async function loadTournaments() {
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .order("sort_order", {
        ascending: true,
      });

    if (data?.length) {
      setTournaments(data);
      setSelectedTournament(data[0]);
    }

    setLoading(false);
  }

  /* =====================================
     PARTIDOS
  ===================================== */
  async function loadLiveMatches(
    silent = false
  ) {
    try {
      const res = await fetch(
        "/api/live-matches",
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (
        !data.matches ||
        !Array.isArray(data.matches)
      ) {
        return;
      }

      const formatted =
        data.matches.map(
          (match: any) => {
            const live =
              match.status ===
                "IN_PLAY" ||
              match.status ===
                "PAUSED";

            const finished =
              match.status ===
              "FINISHED";

            return {
              id: match.id,

              home_team:
                match.homeTeam
                  ?.name ||
                "Local",

              away_team:
                match.awayTeam
                  ?.name ||
                "Visitante",

              home_score:
                live ||
                finished
                  ? match.score
                      ?.fullTime
                      ?.home ?? 0
                  : null,

              away_score:
                live ||
                finished
                  ? match.score
                      ?.fullTime
                      ?.away ?? 0
                  : null,

              match_date:
                match.utcDate,

              city:
                match.area
                  ?.name ||
                "",

              stadium:
                match.competition
                  ?.name || "",

              status:
                translateStatus(
                  match.status
                ),
            };
          }
        );

      /* NO BORRAR DATA SI API TARDA */
      if (formatted.length > 0) {
        setMatches(formatted);
      }
    } catch (error) {
      console.log(error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  /* =====================================
     STATUS
  ===================================== */
  function translateStatus(
    status: string
  ) {
    switch (status) {
      case "IN_PLAY":
        return "EN_VIVO";

      case "PAUSED":
        return "DESCANSO";

      case "TIMED":
      case "SCHEDULED":
        return "PROGRAMADO";

      case "FINISHED":
        return "FINALIZADO";

      default:
        return status;
    }
  }

  /* =====================================
     CAMBIO TORNEO
  ===================================== */
  function changeTournament(
    item: any
  ) {
    setSelectedTournament(item);
    setFilter("TODOS");
    setSelectedDate("");
  }

  /* =====================================
     COLOR
  ===================================== */
  function getTournamentColor(
    name: string
  ) {
    const n =
      name.toLowerCase();

    if (
      n.includes("champions")
    )
      return "#2F6BFF";

    if (
      n.includes("mundial")
    )
      return "#00E676";

    if (
      n.includes(
        "libertadores"
      )
    )
      return "#F7B500";

    return "#00E676";
  }

  const accent =
    selectedTournament
      ? getTournamentColor(
          selectedTournament.name
        )
      : "#00E676";

  /* =====================================
     FILTRO TORNEO FIX REAL
  ===================================== */
  const tournamentMatches =
    useMemo(() => {
      if (
        !selectedTournament
      )
        return [];

      const name =
        selectedTournament.name.toLowerCase();

      return matches.filter(
        (m) => {
          const comp =
            m.stadium.toLowerCase();

          if (
            name.includes(
              "champions"
            )
          ) {
            return (
              comp.includes(
                "champions"
              ) ||
              comp.includes(
                "uefa champions"
              )
            );
          }

          if (
            name.includes(
              "mundial"
            )
          ) {
            return (
              comp.includes(
                "world cup"
              ) ||
              comp.includes(
                "fifa"
              )
            );
          }

          /* si no coincide exacto mostrar todo */
          return true;
        }
      );
    }, [
      matches,
      selectedTournament,
    ]);

  /* =====================================
     FILTROS UI
  ===================================== */
  const filteredMatches =
    useMemo(() => {
      let data = [
        ...tournamentMatches,
      ];

      if (
        filter === "HOY"
      ) {
        const today =
          new Date()
            .toISOString()
            .slice(0, 10);

        data =
          data.filter(
            (m) =>
              m.match_date.slice(
                0,
                10
              ) === today
          );
      }

      if (
        filter ===
        "EN_VIVO"
      ) {
        data =
          data.filter(
            (m) =>
              m.status ===
                "EN_VIVO" ||
              m.status ===
                "DESCANSO"
          );
      }

      if (
        filter ===
        "PROXIMOS"
      ) {
        data =
          data.filter(
            (m) =>
              m.status ===
              "PROGRAMADO"
          );
      }

      if (
        filter ===
        "FINALIZADOS"
      ) {
        data =
          data.filter(
            (m) =>
              m.status ===
              "FINALIZADO"
          );
      }

      if (
        selectedDate
      ) {
        data =
          data.filter(
            (m) =>
              m.match_date.slice(
                0,
                10
              ) ===
              selectedDate
          );
      }

      return data;
    }, [
      tournamentMatches,
      filter,
      selectedDate,
    ]);

  const filters = [
    "TODOS",
    "HOY",
    "EN_VIVO",
    "PROXIMOS",
    "FINALIZADOS",
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top right,#0b2415 0%,#050505 45%,#000 100%)",
        color: "#fff",
        padding: "34px 4vw",
      }}
    >
      {/* HEADER */}
      <button
        onClick={() =>
          router.push(
            "/#torneos"
          )
        }
        style={{
          marginBottom: 30,
          border: "none",
          borderRadius: 14,
          padding:
            "11px 16px",
          background:
            "rgba(255,255,255,.04)",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        <ArrowLeft size={14} /> Volver
      </button>

      <h1
        style={{
          fontSize:
            "clamp(30px,4vw,58px)",
          marginBottom: 10,
        }}
      >
        TORNEOS Y
        PROGRAMACIÓN
      </h1>

      <p
        style={{
          opacity: 0.6,
          marginBottom: 30,
        }}
      >
        Calendarios actualizados
        de torneos.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "270px 1fr",
          gap: 24,
        }}
      >
        {/* LEFT */}
        <div>
          {tournaments.map(
            (item) => {
              const active =
                selectedTournament?.id ===
                item.id;

              const color =
                getTournamentColor(
                  item.name
                );

              return (
                <div
                  key={item.id}
                  onClick={() =>
                    changeTournament(
                      item
                    )
                  }
                  style={{
                    padding:
                      "14px 16px",
                    borderRadius: 16,
                    cursor:
                      "pointer",
                    marginBottom: 10,
                    background:
                      active
                        ? color
                        : "rgba(255,255,255,.04)",
                    color:
                      active
                        ? "#000"
                        : "#fff",
                    fontWeight: 700,
                  }}
                >
                  {item.name}
                </div>
              );
            }
          )}
        </div>

        {/* RIGHT */}
        <div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap:
                "wrap",
              marginBottom: 20,
            }}
          >
            {filters.map(
              (f) => (
                <button
                  key={f}
                  onClick={() =>
                    setFilter(
                      f
                    )
                  }
                  style={{
                    padding:
                      "10px 14px",
                    borderRadius: 12,
                    border: "none",
                    background:
                      filter === f
                        ? accent
                        : "rgba(255,255,255,.04)",
                    color:
                      filter === f
                        ? "#000"
                        : "#fff",
                    fontWeight: 700,
                    cursor:
                      "pointer",
                  }}
                >
                  {f}
                </button>
              )
            )}

            <button
              onClick={() =>
                loadLiveMatches()
              }
              style={{
                border: "none",
                borderRadius: 12,
                padding:
                  "10px 14px",
                background:
                  "rgba(255,255,255,.04)",
                color: "#fff",
              }}
            >
              <RefreshCw
                size={14}
              />
            </button>
          </div>

          {loading ? (
            <div>
              Cargando
              partidos...
            </div>
          ) : (
            <div
              style={{
                display:
                  "grid",
                gap: 12,
              }}
            >
              {filteredMatches.map(
                (
                  match
                ) => (
                  <div
                    key={
                      match.id
                    }
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      background:
                        "rgba(255,255,255,.03)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 18,
                      }}
                    >
                      {
                        match.home_team
                      }{" "}
                      vs{" "}
                      {
                        match.away_team
                      }
                    </div>

                    <div
                      style={{
                        opacity: 0.7,
                        marginTop: 8,
                      }}
                    >
                      {
                        match.status
                      }{" "}
                      •{" "}
                      {
                        match.stadium
                      }
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
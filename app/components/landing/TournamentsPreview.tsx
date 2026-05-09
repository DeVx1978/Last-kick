// components/landing/TournamentsPreview.tsx

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  ChevronRight,
  Activity,
  Shield,
  Globe,
  Crown,
  Flame,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function TournamentsPreview() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<any[]>([]);

  useEffect(() => {
    loadTournaments();
  }, []);

  async function loadTournaments() {
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("featured", true)
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setTournaments(data);
    }
  }

  function getIcon(name: string) {
    const lower = name.toLowerCase();

    if (lower.includes("champions")) return Crown;
    if (lower.includes("mundial")) return Globe;
    if (lower.includes("libertadores")) return Flame;
    if (lower.includes("premier")) return Shield;

    return Trophy;
  }

  return (
    <section
      style={{
        position: "relative",
        padding: "110px 5vw",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      {/* ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "-180px",
          right: "-140px",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "rgba(0,200,83,0.08)",
          filter: "blur(140px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "-180px",
          left: "-140px",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "rgba(0,200,83,0.05)",
          filter: "blur(130px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 1380,
          margin: "0 auto",
          position: "relative",
          zIndex: 5,
        }}
      >
        {/* HEADER */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 60,
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: 8,
              color: "rgba(255,255,255,.30)",
              fontFamily: "monospace",
            }}
          >
            SISTEMA DE TORNEOS LAST KICK
          </span>

          <h2
            style={{
              fontSize: "clamp(38px,5vw,72px)",
              color: "#fff",
              marginTop: 18,
              marginBottom: 14,
              lineHeight: 1,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            TORNEOS DISPONIBLES
          </h2>

          <p
            style={{
              maxWidth: 760,
              margin: "0 auto",
              color: "rgba(255,255,255,.58)",
              fontSize: 17,
              lineHeight: 1.7,
            }}
          >
            Compite en eventos reales, predice resultados y sobrevive hasta la
            final. Todo sincronizado en tiempo real.
          </p>
        </div>

        {/* GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 22,
            marginBottom: 42,
          }}
        >
          {tournaments.map((item, i) => {
            const Icon = getIcon(item.name);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{
                  y: -8,
                  scale: 1.015,
                }}
                onClick={() => router.push("/torneos")}
                style={{
                  position: "relative",
                  cursor: "pointer",
                  borderRadius: 24,
                  padding: 26,
                  minHeight: 250,
                  overflow: "hidden",
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015))",
                  backdropFilter: "blur(18px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow:
                    "0 10px 35px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)",
                }}
              >
                {/* glow */}
                <div
                  style={{
                    position: "absolute",
                    top: -30,
                    right: -30,
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: "rgba(0,200,83,.14)",
                    filter: "blur(50px)",
                  }}
                />

                {/* top */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 28,
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background:
                        "linear-gradient(180deg, rgba(0,200,83,.18), rgba(0,200,83,.05))",
                      border: "1px solid rgba(0,200,83,.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={22} color="#00E676" />
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: "#00E676",
                      letterSpacing: 3,
                      fontWeight: 800,
                    }}
                  >
                    {item.target_region || "GLOBAL"}
                  </div>
                </div>

                {/* title */}
                <h3
                  style={{
                    color: "#fff",
                    fontSize: 28,
                    lineHeight: 1.08,
                    fontWeight: 900,
                    marginBottom: 18,
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  {item.name}
                </h3>

                {/* status */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "rgba(255,255,255,.60)",
                    fontSize: 14,
                    marginBottom: 18,
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <Activity size={14} color="#00E676" />
                  {item.status}
                </div>

                {/* footer */}
                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <span
                    style={{
                      color: "rgba(255,255,255,.42)",
                      fontSize: 13,
                    }}
                  >
                    Premio ${item.prize_base}
                  </span>

                  <span
                    style={{
                      color: "#00E676",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: 2,
                    }}
                  >
                    VER →
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <div
          style={{
            borderRadius: 28,
            padding: "28px 30px",
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                color: "#fff",
                fontSize: 28,
                fontWeight: 900,
                marginBottom: 8,
              }}
            >
              +120 Partidos activos
            </div>

            <div
              style={{
                color: "rgba(255,255,255,.48)",
                fontSize: 15,
              }}
            >
              Calendarios, resultados y torneos actualizados minuto a minuto.
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/torneos")}
            style={{
              cursor: "pointer",
              border: "none",
              padding: "18px 30px",
              borderRadius: 18,
              background: "linear-gradient(90deg,#00C853,#00F57A)",
              color: "#000",
              fontWeight: 900,
              fontSize: 14,
              letterSpacing: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 18px 40px rgba(0,200,83,.28)",
            }}
          >
            VER TODOS LOS TORNEOS
            <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
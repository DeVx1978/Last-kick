"use client";

import { useEffect, useState } from "react";

export default function LiveMatchTicker() {
  const [matches, setMatches] = useState<any[]>([
    { text: "ARGENTINA 2 - 1 BRASIL • MIN 74" },
    { text: "ESPAÑA 1 - 1 FRANCIA • MIN 66" },
    { text: "ALEMANIA vs ITALIA • HOY 20:00" },
  ]);

  useEffect(() => {
    loadMatches();

    const interval = setInterval(() => {
      loadMatches();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  async function loadMatches() {
    try {
      const res = await fetch("/api/live-matches");
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) return;

      const formatted = data.slice(0, 12).map((item: any) => {
        const home = item.teams?.home?.name || "LOCAL";
        const away = item.teams?.away?.name || "VISITA";

        const goalsHome = item.goals?.home ?? 0;
        const goalsAway = item.goals?.away ?? 0;

        const minute = item.fixture?.status?.elapsed;
        const short = item.fixture?.status?.short;

        let status = "";

        if (minute) {
          status = `MIN ${minute}`;
        } else if (short) {
          status = short;
        } else {
          status = "LIVE";
        }

        return {
          text: `${home.toUpperCase()} ${goalsHome} - ${goalsAway} ${away.toUpperCase()} • ${status}`,
        };
      });

      setMatches(formatted);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        background: "#050505",
        borderTop: "1px solid #111",
        borderBottom: "1px solid #111",
        overflow: "hidden",
        height: "42px",
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          gap: "50px",
          paddingLeft: "30px",
          animation: "tickerMove 45s linear infinite",
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "1px",
        }}
      >
        {[...matches, ...matches].map((match, i) => (
          <div key={i} style={{ display: "flex", gap: "8px" }}>
            <span style={{ color: "#00ff66" }}>●</span>
            <span>{match.text}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes tickerMove {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
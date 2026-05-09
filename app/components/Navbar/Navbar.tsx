"use client";

import React from "react";
import { Activity, Heart, Skull } from "lucide-react";

export default function Navbar({
  glitch,
  timeLeft,
  jackpotTotal,
  liveUsers,
  comaUsers,
  deadUsers
}: any) {
  return (
    <header className="top-nav">

      {/* LEFT */}
      <div className="nav-left">
        <div className={`brand-logo ${glitch ? "glitch-active" : ""}`}>
          LAST <span>KICK</span>
          <small className="brand-symbols">△ ○ ✕ □</small>
        </div>
      </div>

      {/* CENTER */}
      <div className="nav-center">
        <div className="countdown-strip">

          <div className="count-box">
            <strong>{String(timeLeft.days).padStart(2, "0")}</strong>
            <small>DÍAS</small>
          </div>

          <span className="dots">:</span>

          <div className="count-box">
            <strong>{String(timeLeft.hours).padStart(2, "0")}</strong>
            <small>HRS</small>
          </div>

          <span className="dots">:</span>

          <div className="count-box">
            <strong>{String(timeLeft.minutes).padStart(2, "0")}</strong>
            <small>MIN</small>
          </div>

          <span className="dots">:</span>

          <div className="count-box">
            <strong>{String(timeLeft.seconds).padStart(2, "0")}</strong>
            <small>SEG</small>
          </div>

        </div>

        <div className="countdown-sub">
          INICIO DE OPERACIONES GLOBALES
        </div>
      </div>

      {/* RIGHT */}
      <div className="nav-right">

        {/* JACKPOT */}
        <div className="jackpot-badge">
          <span className="jackpot-label">JACKPOT ACUMULADO</span>
          <span className="jackpot-value">
            {jackpotTotal.toLocaleString()}
          </span>
        </div>

        {/* STATS */}
        <div className="nav-stats">

          <div className="stat-pill stat-alive">
            <Activity size={12} />
            <div>
              <strong>{liveUsers}</strong>
              <small>VIVOS</small>
            </div>
          </div>

          <div className="stat-pill stat-coma">
            <Heart size={12} />
            <div>
              <strong>{comaUsers}</strong>
              <small>EN COMA</small>
            </div>
          </div>

          <div className="stat-pill stat-dead">
            <Skull size={12} />
            <div>
              <strong>{deadUsers}</strong>
              <small>ELIMINADOS</small>
            </div>
          </div>

        </div>

      </div>

    </header>
  );
}
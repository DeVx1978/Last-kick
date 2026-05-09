"use client";
import "../landing/styles/hero.css";

import { motion } from "framer-motion";

import {
  AlertTriangle,
  KeyRound,
  UserPlus,
  Eye,
  Lock,
  Wifi,
  Terminal
} from "lucide-react";

import { useRouter } from "next/navigation";

interface HeroProps {
  jackpotTotal: number;
  activeArena: {
    difficulty: string;
    activeUsers: number;
    league: string;
    time: string;
  };
}

export default function Hero({
  jackpotTotal,
  activeArena
}: HeroProps) {
  const router = useRouter();

  return (
    <section className="hero-area">

      {/* BLOQUE IZQUIERDO */}
      <div className="hero-content">

        {/* IDENTIDAD VISUAL */}
        <div className="hero-top">

          {/* Label superior */}
          <div className="hero-label">
            <div className="hero-line" />
            EL SISTEMA DE VIDAS
          </div>

          {/* TITULO */}
          <h1 className="hero-title">
            CADA VIDA <br />
            <span>IMPORTA</span>
          </h1>

          {/* TEXTO */}
          <p className="hero-desc">
            No es solo predecir. Es sobrevivir un torneo entero <br />
            con recursos limitados. Así funciona el sistema.
          </p>

        </div>

        {/* BOTONES — restaurados los dos */}
        <div className="hero-cta-group">

          <button
            className="btn-login"
            onClick={() => router.push("/login")}
          >
            <KeyRound size={16} />
            INGRESAR
          </button>

          <button
            className="btn-register"
            onClick={() => router.push("/register")}
          >
            <UserPlus size={16} />
            CREAR CUENTA
          </button>

        </div>

        {/* META */}
        <div className="hero-meta">

          <span>
            <Eye size={12} /> {activeArena.activeUsers} activos
          </span>

          <span>
            <Lock size={12} /> Seguro
          </span>

          <span>
            <Wifi size={12} /> Online
          </span>

        </div>

      </div>

      {/* PANEL DERECHO */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="hero-panel"
      >

        <div className="panel-header">
          <Terminal size={14} />
          <span>STATUS LIVE</span>
          <span className="panel-dot" />
        </div>

        <div className="panel-row">
          <span className="panel-key">FASE</span>
          <span className="panel-val green">
            {activeArena.league}
          </span>
        </div>

        <div className="panel-row">
          <span className="panel-key">INICIO</span>
          <span className="panel-val">
            {activeArena.time}
          </span>
        </div>

        <div className="panel-row">
          <span className="panel-key">JACKPOT</span>
          <span className="panel-val gold">
            ${jackpotTotal.toLocaleString()}
          </span>
        </div>

        <div className="panel-row">
          <span className="panel-key">DIFICULTAD</span>
          <span className="panel-val red">
            {activeArena.difficulty}
          </span>
        </div>

        <div className="panel-divider" />

        <div className="panel-warning">
          <AlertTriangle size={12} />
          LAS DECISIONES SON FINALES
        </div>

      </motion.div>

    </section>
  );
}
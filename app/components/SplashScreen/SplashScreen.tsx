"use client";

import React, { useEffect, useState } from "react";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    /* Después de 2.2s empieza el fade out */
    const t1 = setTimeout(() => setFading(true), 2200);
    /* Después de 2.8s (fade completo) avisa al padre */
    const t2 = setTimeout(() => onDone(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         9999,
        background:     "#111827",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        gap:            "28px",
        opacity:        fading ? 0 : 1,
        transition:     "opacity 0.6s ease",
        pointerEvents:  "none",
      }}
    >
      {/* Logo */}
      <img
        src="/img/kicklast02.png"
        alt="Kick Last"
        style={{
          width:     "clamp(180px, 35vw, 300px)",
          height:    "auto",
          objectFit: "contain",
          animation: "kl-in 0.6s cubic-bezier(0.16,1,0.3,1) both",
        }}
        onError={(e) => {
          const el = e.currentTarget as HTMLImageElement;
          el.style.display = "none";
          const fb = document.createElement("div");
          fb.style.cssText = "font-family:Oswald,sans-serif;font-size:clamp(32px,7vw,64px);font-weight:700;color:#8dc63f;letter-spacing:2px;";
          fb.textContent = "KICK LAST";
          el.parentElement?.appendChild(fb);
        }}
      />

      {/* Dots */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width:            "8px",
            height:           "8px",
            borderRadius:     "50%",
            background:       "#8dc63f",
            animation:        `kl-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      {/* Texto */}
      <div style={{
        fontFamily:    "Roboto, sans-serif",
        fontSize:      "12px",
        letterSpacing: "3px",
        color:         "#8dc63f",
        textTransform: "uppercase",
        opacity:       0.6,
        marginTop:     "-12px",
      }}>
        Cargando
      </div>

      <style>{`
        @keyframes kl-in {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes kl-dot {
          0%, 80%, 100% { transform: scale(0.5); opacity: 0.25; }
          40%            { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
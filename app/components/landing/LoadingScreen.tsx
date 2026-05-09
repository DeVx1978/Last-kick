"use client";

import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div
      style={{
        height: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        style={{
          color: "#FF0033",
          letterSpacing: "6px",
          fontSize: 13,
          fontWeight: 900,
          textTransform: "uppercase",
        }}
      >
        INICIALIZANDO SISTEMA DE ELIMINACIÓN...
      </motion.div>

      <div
        style={{
          width: 260,
          height: 2,
          background: "rgba(255,0,51,0.2)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.2, ease: "linear" }}
          style={{
            height: "100%",
            background:
              "linear-gradient(90deg, #FF0033, #FF5577)",
            boxShadow: "0 0 12px #FF0033",
          }}
        />
      </div>

      <motion.div
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
        style={{
          color: "rgba(255,255,255,0.3)",
          fontSize: 10,
          letterSpacing: 4,
        }}
      >
        EL CALAMAR MUNDIALISTA • 2026
      </motion.div>
    </div>
  );
}
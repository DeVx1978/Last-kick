/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/(admin)/layout.tsx", // <--- Mantenemos tu ruta directa forzada
  ],

  theme: {
    // 📱 AJUSTE RESPONSIVO GLOBAL COMPLETO (Desde móviles compactos hasta pantallas de escritorio)
    screens: {
      xs: "320px",    // Celulares compactos de gama de entrada
      sm: "390px",    // Tu breakpoint optimizado para smartphones modernos
      md: "768px",    // Tablets y iPads
      lg: "1024px",   // Laptops estándares
      xl: "1280px",   // Monitores de escritorio comunes
      "2xl": "1536px", // Pantallas grandes e interfaces expandidas
    },

    extend: {
      // 🎨 PALETA DE COLORES INTEGRADA (Tus tokens + Negro Absoluto Oficial)
      colors: {
        background: "#000000", // Forzado a negro absoluto para optimización OLED
        neonGreen: "#00C853",  // Tu verde de alta visibilidad
        neonRed: "#FF0033",    // Tu rojo de alertas
        live: "#00FF88",       // Tu color de estados en tiempo real
        jackpot: "#FFD700",    // Tu color para recompensas de oro
        bgDeep: "#000000",     // Ajustado de #0A0A0A a negro puro por consistencia estética
        panel: "#111111",      // Tu color para contenedores de tarjetas
        borderGlow: "#1a1a1a", // Tu color para bordes sutiles
      },

      // 🔤 SISTEMA TIPOGRÁFICO UNIFICADO (Tus fuentes + Fuentes de control táctico)
      fontFamily: {
        display: ["Anton", "sans-serif"],  // Tu fuente de títulos original
        body: ["Inter", "sans-serif"],     // Tu fuente de lectura original
        orbitron: ["var(--font-orbitron)", "sans-serif"], // Integrada para el Splash Screen de partículas
        rajdhani: ["var(--font-rajdhani)", "sans-serif"], // Integrada para datos de alta densidad responsivos
      },

      // ✨ EFECTOS DE ILUMINACIÓN DE INTERFAZ
      boxShadow: {
        neon: "0 0 12px rgba(0,255,136,.45)", // Tu sombra verde original
        red: "0 0 12px rgba(255,0,51,.45)",   // Tu sombra roja original
        neonGlow: "0 0 20px rgba(0, 200, 83, 0.6)", // Sombra de alta intensidad para acentos de botones
      },
    },
  },

  plugins: [],
}
"use client";

import React, { useState } from "react";
import Navbar       from "../components/Navbar/Navbar";
import Hero         from "../components/Hero/Hero";
import Stats        from "../components/Stats/Stats";
import Sponsors     from "@/app/components/Sponsors/Sponsors";
import Footer       from "../components/Footer/Footer";
import SplashScreen from "../components/SplashScreen/SplashScreen";
import "../globals.css";

export default function Page() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && (
        <SplashScreen onDone={() => setShowSplash(false)} />
      )}

      {/* El main siempre visible — el splash flota ENCIMA con position:fixed */}
      <main className="min-h-screen bg-background text-white selection:bg-neonGreen selection:text-black">
        <Navbar />
        <Hero />
        <Stats />
        <Sponsors />
        <Footer />
      </main>
    </>
  );
}
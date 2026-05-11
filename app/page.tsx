"use client";

import Navbar from "@/app/components/Navbar/Navbar";
import Hero from "@/app/components/Hero/Hero";
import Stats from "@/app/components/Stats/Stats";
import LiveMatches from "@/app/components/LiveMatches/LiveMatches";
import Footer from "@/app/components/Footer/Footer";
import Carousel from "@/app/components/Carousel/Carousel";
import "./globals.css";

export default function Page() {
  return (
    <main>
  <Navbar />
  <Hero />
  <Carousel />
  <Stats />
  <LiveMatches />
  <Footer />
</main>
  );
}

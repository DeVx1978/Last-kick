"use client";

import Navbar from "@/app/components/Navbar-v2/Navbar";
import Hero from "@/app/components/Hero-v2/Hero";
import Stats from "@/app/components/Stats-v2/Stats";
import LiveMatches from "@/app/components/LiveMatches-v2/LiveMatches";
import Footer from "@/app/components/Footer-v2/Footer";
import Carousel from "@/app/components/Carousel-v2/Carousel";
import "./v2.css";

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
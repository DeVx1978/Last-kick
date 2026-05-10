"use client";

import Navbar from "@/app/components/v2/Navbar/Navbar";
import Hero from "@/app/components/v2/Hero/Hero";
import Stats from "@/app/components/v2/Stats/Stats";
import LiveMatches from "@/app/components/v2/LiveMatches/LiveMatches";
import Footer from "@/app/components/v2/Footer/Footer";
import Carousel from "@/app/components/v2/Carousel/Carousel";
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
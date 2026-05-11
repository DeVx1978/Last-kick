"use client";

import Navbar from "../Navbar/Navbar";
import LiveMatchTicker from "../LiveMatchTicker/LiveMatchTicker";
import Hero from "../Hero/Hero";
import PromoSection from "./PromoSection";
import HeroSlider from "../HeroSlider/HeroSlider";
import WinnerStrip from "./WinnerStrip";
import About from "../About/About";
import TournamentsPreview from "./TournamentsPreview";
import Footer from "../Footer/Footer";
import GameModal from "./GameModal";
import AlertFeed from "./AlertFeed";
import BackgroundFX from "./BackgroundFX";
import { GLOBAL_CSS } from "./globalStyles";

type ArenaType = {
  id: string;
  title: string;
  subtitle: string;
  reward: string;
  difficulty: string;
  activeUsers: number;
  league: string;
  phase: string;
  status: string;
  team1: string;
  team2: string;
  time: string;
  score: string;
  jackpot: string;
  isSurvival: boolean;
  bgImage: string;
  symbol: string;
  accent: string;
};

type GameType = {
  name: string;
  image: string;
  color: string;
};

type LandingLayoutProps = {
  notifications: any[];
  glitch: boolean;

  timeLeft: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };

  jackpotTotal: number;
  liveUsers: number;
  comaUsers: number;
  deadUsers: number;

  activeArena: any;

  activeProtocolId: string;
  setActiveProtocolId: (id: string) => void;

  isGameActive: boolean;
  setIsGameActive: (value: boolean) => void;

  THE_GAME: GameType;
};

export default function LandingLayout({
  notifications,
  glitch,
  timeLeft,
  jackpotTotal,
  liveUsers,
  comaUsers,
  deadUsers,
  activeArena,
  activeProtocolId,
  setActiveProtocolId,
  isGameActive,
  setIsGameActive,
  THE_GAME,
}: LandingLayoutProps) {
  return (
  <div className="calamar-root min-h-screen bg-black text-white overflow-x-hidden">
    <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

    <BackgroundFX />
    <AlertFeed notifications={notifications} />

    <header className="relative z-50">
      <Navbar
        glitch={glitch}
        timeLeft={timeLeft}
        jackpotTotal={jackpotTotal}
        liveUsers={liveUsers}
        comaUsers={comaUsers}
        deadUsers={deadUsers}
      />
    </header>

    <section className="relative z-20">
      <LiveMatchTicker />
    </section>

    <main className="relative z-10">
      <Hero
        jackpotTotal={jackpotTotal}
        activeArena={activeArena}
      />

      <PromoSection />
      <HeroSlider />
      <WinnerStrip />

      <About
        activeProtocolId={activeProtocolId}
        setActiveProtocolId={(id) => setActiveProtocolId(id ?? "")}
      />

      <TournamentsPreview />
    </main>

    <Footer />

    <GameModal
      isGameActive={isGameActive}
      setIsGameActive={setIsGameActive}
      THE_GAME={THE_GAME}
    />
  </div>
);
}

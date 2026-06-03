"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Coins, Trophy, Swords, Target, Shield, Zap, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// ─── Types ───────────────────────────────────────────────────
interface Player {
  id: string;
  rank: number;
  username?: string;
  full_name?: string;
  player_code?: string;
  country?: string;
  pitchx_balance?: number;
  wins?: number;
  kd?: number;
  lives?: number;
  tier?: 'S' | 'A' | 'B' | 'C';
  avatar_url?: string;
  avatar: string;
  initials: string;
}

function getTier(rank: number): 'S' | 'A' | 'B' | 'C' {
  if (rank <= 4)  return 'S';
  if (rank <= 9)  return 'A';
  if (rank <= 23) return 'B';
  return 'C';
}

function getInitials(name?: string): string {
  if (!name) return '??';
  return name.replace(/[_0-9]/g, '').substring(0, 2).toUpperCase();
}

// ─── Avatar ──────────────────────────────────────────────────
function Avatar({ player, size, color }: { player: Player; size: number; color: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}`,
      overflow: 'hidden', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `${color}18`,
      fontFamily: "'Orbitron', monospace",
      fontSize: size * 0.32, fontWeight: 900,
      color: color,
    }}>
      {player.avatar_url
        ? <img src={player.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : player.initials}
    </div>
  );
}

// ─── Tier Badge ──────────────────────────────────────────────
function TierBadge({ tier }: { tier: 'S' | 'A' | 'B' | 'C' }) {
  const map = {
    S: { bg: 'rgba(239,68,68,0.15)', color: '#F87171', border: 'rgba(239,68,68,0.3)' },
    A: { bg: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: 'rgba(245,158,11,0.3)' },
    B: { bg: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: 'rgba(59,130,246,0.3)' },
    C: { bg: 'rgba(107,114,128,0.1)', color: '#9CA3AF', border: 'rgba(107,114,128,0.2)' },
  }[tier];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 22, height: 22, borderRadius: 4,
      fontSize: 9, fontWeight: 900, fontFamily: "'Orbitron', monospace",
      background: map.bg, color: map.color, border: `1px solid ${map.border}`,
      flexShrink: 0,
    }}>{tier}</span>
  );
}

// ─── Podium Card (Top 3) ─────────────────────────────────────
function PodiumCard({ player, variant }: { player: Player; variant: 'gold' | 'silver' | 'bronze' }) {
  const router = useRouter();
  const cfg = {
    gold:   { color: '#F59E0B', label: 'MOST WANTED', num: '#1', medal: '★' },
    silver: { color: '#94A3B8', label: '2ND PLACE',   num: '#2', medal: '2' },
    bronze: { color: '#CD7C3B', label: '3RD PLACE',   num: '#3', medal: '3' },
  }[variant];

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => router.push(`/profile/${player.id}`)}
      style={{
        background: 'rgba(10,14,26,0.95)',
        border: `1px solid ${cfg.color}33`,
        borderTop: `2px solid ${cfg.color}`,
        borderRadius: 10,
        padding: '14px 12px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Rank num */}
      <div style={{
        fontFamily: "'Orbitron', monospace", fontSize: 18, fontWeight: 900,
        color: cfg.color, lineHeight: 1, marginBottom: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>{cfg.num}</span>
        <span style={{
          fontSize: 8, letterSpacing: 1.5, padding: '3px 7px',
          background: `${cfg.color}18`, border: `1px solid ${cfg.color}33`,
          color: cfg.color, borderRadius: 4,
        }}>{cfg.label}</span>
      </div>

      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Avatar player={player} size={38} color={cfg.color} />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: '#fff',
            textTransform: 'uppercase', letterSpacing: 0.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {player.username || player.full_name}
          </div>
          <div style={{
            fontFamily: "'Orbitron', monospace", fontSize: 8,
            color: 'rgba(255,255,255,0.25)', letterSpacing: 1, marginTop: 2,
          }}>
            {player.country || 'COL'}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{
          flex: 1, background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 6, padding: '7px 8px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>PX</div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700, color: cfg.color }}>
            {(player.pitchx_balance ?? 0).toLocaleString()}
          </div>
        </div>
        <div style={{
          flex: 1, background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 6, padding: '7px 8px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>WINS</div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700, color: '#fff' }}>
            {player.wins ?? '—'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Rank Row ────────────────────────────────────────────────
function RankRow({ player, index }: { player: Player; index: number }) {
  const router = useRouter();
  const isTop10 = player.rank <= 10;
  const rankColor = isTop10 ? '#60A5FA' : 'rgba(255,255,255,0.2)';

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.015 }}
      onClick={() => router.push(`/perfil/${player.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: 3, background: 'rgba(10,14,26,0.7)',
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      {/* Rank number */}
      <div style={{
        fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 900,
        color: rankColor, width: 28, flexShrink: 0, textAlign: 'center',
      }}>
        {String(player.rank).padStart(2, '0')}
      </div>

      {/* Avatar */}
      <Avatar player={player} size={32} color={isTop10 ? '#60A5FA' : 'rgba(255,255,255,0.15)'} />

      {/* Name + code */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: '#fff',
          textTransform: 'uppercase', letterSpacing: 0.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {player.username || player.full_name}
        </div>
        <div style={{
          fontFamily: "'Orbitron', monospace", fontSize: 8,
          color: 'rgba(255,255,255,0.2)', letterSpacing: 1, marginTop: 1,
        }}>
          {player.country || 'GLOBAL'}
        </div>
      </div>

      {/* PX */}
      <div style={{
        fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 700,
        color: '#F59E0B', flexShrink: 0, textAlign: 'right',
      }}>
        {(player.pitchx_balance ?? 0).toLocaleString()}
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', marginLeft: 2 }}>PX</span>
      </div>

      {/* Tier */}
      <TierBadge tier={player.tier ?? 'C'} />
    </motion.div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function BlacklistThrone() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading]       = useState(true);
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [currentUser, setCurrentUser] = useState<Player | null>(null);

  useEffect(() => {
    async function fetchBlacklist() {
      const { data: profiles, error } = await supabase
        .from('profiles').select('*')
        .order('pitchx_balance', { ascending: false }).limit(100);

      if (!error && profiles) {
        const mapped: Player[] = profiles.map((p, i) => ({
          ...p, rank: i + 1, tier: getTier(i + 1),
          initials: getInitials(p.username || p.full_name), avatar: p.avatar_url || '',
        }));
        setLeaderboard(mapped);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const mine = mapped.find(p => p.id === user.id);
          if (mine) setCurrentUser(mine);
        }
      }
      setTimeout(() => setLoading(false), 600);
    }
    fetchBlacklist();
  }, [supabase]);

  if (loading) return (
    <div style={{
      height: '100vh', background: '#07080f',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Orbitron', monospace",
    }}>
      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }}>
        <Trophy size={36} color="#00A8FF" style={{ marginBottom: 16 }} />
      </motion.div>
      <div style={{ color: '#00A8FF', letterSpacing: 6, fontSize: 9 }}>CARGANDO RANKING...</div>
    </div>
  );

  const [rank1, rank2, rank3, ...others] = leaderboard;
  const totalPX = leaderboard.reduce((a, p) => a + (p.pitchx_balance ?? 0), 0);

  return (
    <div style={{
      background: '#07080f url("/img/leader1.jpg") center/cover no-repeat fixed',
      minHeight: '100vh', color: '#fff',
      fontFamily: "'Rajdhani', sans-serif",
      position: 'relative', overflowX: 'hidden',
      paddingBottom: currentUser ? 80 : 32,
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Orbitron:wght@400;700;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        .lb-overlay {
          position: fixed; inset: 0;
          background: linear-gradient(rgba(7,8,15,0.88), rgba(7,8,15,0.88));
          pointer-events: none; z-index: 0;
        }
        .lb-wrap {
          position: relative; z-index: 2;
          max-width: 700px; margin: 0 auto;
          padding: 0 14px;
        }
        /* NAV */
        .lb-nav {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px;
          background: rgba(7,8,15,0.92);
          border-bottom: 1px solid rgba(0,168,255,0.1);
          backdrop-filter: blur(16px);
          user-select: none;
        }
        .lb-back {
          display: flex; align-items: center; gap: 6px;
          background: none; border: 1px solid rgba(0,168,255,0.3);
          color: #00A8FF; padding: 6px 12px; cursor: pointer;
          font-family: 'Orbitron', monospace; font-size: 8px;
          letter-spacing: 2px; transition: all 0.2s;
          outline: none;
        }
        .lb-back:hover { background: rgba(0,168,255,0.1); }
        .lb-nav-title {
          font-family: 'Orbitron', monospace; font-size: 10px;
          font-weight: 900; letter-spacing: 4px; color: #fff;
        }
        .lb-nav-title span { color: #00A8FF; }
        .lb-nav-season {
          font-family: 'Orbitron', monospace; font-size: 8px;
          letter-spacing: 2px; color: rgba(255,255,255,0.2);
        }
        /* HEADER */
        .lb-header {
          padding: 20px 0 14px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 14px;
        }
        .lb-header-tag {
          font-family: 'Orbitron', monospace; font-size: 8px;
          letter-spacing: 4px; color: #00A8FF; margin-bottom: 6px;
        }
        .lb-header-title {
          font-family: 'Orbitron', monospace;
          font-size: clamp(20px, 5vw, 32px); font-weight: 900;
          line-height: 1; letter-spacing: -1px; color: #fff;
        }
        .lb-header-title span { color: #00A8FF; }
        /* STATS STRIP */
        .lb-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 6px; margin-bottom: 16px;
        }
        .lb-stat {
          background: rgba(10,14,26,0.9);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px; padding: 10px 8px;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
        }
        .lb-stat-val {
          font-family: 'Orbitron', monospace; font-size: 13px;
          font-weight: 700; color: #fff; line-height: 1;
        }
        .lb-stat-lbl {
          font-family: 'Orbitron', monospace; font-size: 6px;
          letter-spacing: 1px; color: rgba(255,255,255,0.25);
          text-align: center;
        }
        /* SECTION LABEL */
        .lb-section {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 10px;
        }
        .lb-section-txt {
          font-family: 'Orbitron', monospace; font-size: 8px;
          letter-spacing: 3px; color: rgba(255,255,255,0.25);
          white-space: nowrap;
        }
        .lb-section-line {
          flex: 1; height: 1px; background: rgba(255,255,255,0.06);
        }
        /* PODIUM */
        .lb-podium {
          display: flex; gap: 8px; margin-bottom: 20px;
        }
        /* ROW HOVER */
        .lb-row:hover {
          background: rgba(20,28,48,0.9) !important;
          border-color: rgba(0,168,255,0.2) !important;
        }
        /* HUD */
        .lb-hud {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000;
          background: rgba(7,8,15,0.97);
          border-top: 1px solid rgba(0,168,255,0.2);
          padding: 10px 16px;
          display: flex; align-items: center; justify-content: space-between;
          backdrop-filter: blur(16px);
          gap: 12px;
        }
        .lb-hud-left { display: flex; align-items: center; gap: 10px; }
        .lb-hud-rank {
          font-family: 'Orbitron', monospace; font-size: 16px;
          font-weight: 900; color: #fff; line-height: 1;
        }
        .lb-hud-label {
          font-family: 'Orbitron', monospace; font-size: 7px;
          letter-spacing: 3px; color: rgba(255,255,255,0.3);
        }
        .lb-hud-right { display: flex; align-items: center; gap: 16px; }
        .lb-hud-stat { text-align: right; }
        .lb-hud-stat-val {
          font-family: 'Orbitron', monospace; font-size: 14px;
          font-weight: 700; color: #F59E0B;
        }
        .lb-hud-lives { display: flex; gap: 4px; align-items: center; }
        .lb-life {
          width: 8px; height: 20px;
          transform: skewX(-10deg); border-radius: 2px;
        }
        @media (max-width: 480px) {
          .lb-stats { grid-template-columns: repeat(2, 1fr); }
          .lb-podium { flex-direction: column; }
          .lb-stat-val { font-size: 11px; }
          .lb-hud-right { gap: 10px; }
          .lb-hud-rank { font-size: 14px; }
        }
      `}</style>

      <div className="lb-overlay" />

      {/* NAV */}
      <nav className="lb-nav">
        <button className="lb-back" onClick={() => router.push('/radar')}>
          <ChevronLeft size={12} /> VOLVER
        </button>
        <div className="lb-nav-title">BLACK<span>LIST</span></div>
        <div className="lb-nav-season">S06</div>
      </nav>

      <div className="lb-wrap">

        {/* HEADER */}
        <div className="lb-header">
          <div className="lb-header-tag">◈ RANKING GLOBAL · TEMPORADA S06</div>
          <div className="lb-header-title">LOS <span>100</span> MEJORES</div>
        </div>

        {/* STATS STRIP */}
        <div className="lb-stats">
          {[
            { label: 'JUGADORES', val: leaderboard.length, color: '#60A5FA', icon: <Shield size={12}/> },
            { label: 'PX TOTAL',  val: `${(totalPX/1000).toFixed(0)}K`, color: '#F59E0B', icon: <Coins size={12}/> },
            { label: 'TEMPORADA', val: 'S06', color: '#F87171', icon: <Target size={12}/> },
            { label: 'EN VIVO',   val: '●', color: '#34D399', icon: <Zap size={12}/> },
          ].map(s => (
            <div key={s.label} className="lb-stat">
              <div style={{ color: s.color }}>{s.icon}</div>
              <div className="lb-stat-val" style={{ color: s.color }}>{s.val}</div>
              <div className="lb-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* PODIUM */}
        <div className="lb-section">
          <Trophy size={11} color="#F59E0B" />
          <span className="lb-section-txt">PODIO DE ÉLITE</span>
          <div className="lb-section-line" />
        </div>

        <div className="lb-podium">
          {rank2 && <PodiumCard player={rank2} variant="silver" />}
          {rank1 && <PodiumCard player={rank1} variant="gold" />}
          {rank3 && <PodiumCard player={rank3} variant="bronze" />}
        </div>

        {/* ROWS 4–100 */}
        <div className="lb-section">
          <Swords size={11} color="#F87171" />
          <span className="lb-section-txt">RANKING 4 — 100</span>
          <div className="lb-section-line" />
        </div>

        <AnimatePresence>
          {others.map((player, i) => (
            <div key={player.id} className="lb-row">
              <RankRow player={player} index={i} />
            </div>
          ))}
        </AnimatePresence>

      </div>

      {/* HUD */}
      {currentUser && (
        <motion.div className="lb-hud" initial={{ y: 80 }} animate={{ y: 0 }}>
          <div className="lb-hud-left">
            <Avatar player={currentUser} size={36} color="#00A8FF" />
            <div>
              <div className="lb-hud-label">TU RANGO</div>
              <div className="lb-hud-rank">#{currentUser.rank}</div>
            </div>
          </div>
          <div className="lb-hud-right">
            <div className="lb-hud-stat">
              <div className="lb-hud-label">BOTÍN</div>
              <div className="lb-hud-stat-val">{(currentUser.pitchx_balance ?? 0).toLocaleString()} <span style={{fontSize:8,color:'rgba(255,255,255,0.3)'}}>PX</span></div>
            </div>
            <div>
              <div className="lb-hud-label" style={{marginBottom:4}}>VIDAS</div>
              <div className="lb-hud-lives">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="lb-life" style={{
                    background: i < (currentUser.lives ?? 0) ? '#EF4444' : 'rgba(255,255,255,0.08)',
                  }} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <footer style={{
        padding: '60px 0 24px', textAlign: 'center',
        fontFamily: "'Orbitron', monospace", fontSize: 8,
        letterSpacing: 20, color: 'rgba(255,255,255,0.04)',
        textTransform: 'uppercase', position: 'relative', zIndex: 2,
      }}>
        KICK LAST · 2026
      </footer>
    </div>
  );
}
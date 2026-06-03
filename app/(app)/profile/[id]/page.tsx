"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ArrowUpRight } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Match {
  result: 'W' | 'L';
  opponent: string;
  score: string;
  px: string;
}

interface Achievement {
  icon: string;
  label: string;
  desc: string;
  color: string;
}

interface TournamentStat {
  name: string;
  wins: number;
  pct: number;
  color: string;
}

interface ProfileData {
  id: string;
  username?: string;
  full_name?: string;
  player_code?: string;
  country?: string;
  city?: string;
  pitchx_balance?: number;
  wins?: number;
  losses?: number;
  kd?: number;
  lives?: number;
  best_streak?: number;
  tier?: string;
  rank?: number;
  avatar_url?: string;
  px_this_week?: number;
  next_tier_px?: number;
  next_tier_progress?: number;
  seasons_active?: number;
}

// ─── Barcode ──────────────────────────────────────────────────────────────────
function LongBarcode({ color }: { color: string }) {
  const bars = [
    [0,3],[5,1],[8,4],[14,2],[18,1],[21,3],[26,5],[33,1],[36,2],[40,4],
    [46,1],[49,3],[54,1],[57,5],[64,2],[68,1],[71,3],[76,4],[82,1],[85,2],
    [89,5],[96,1],[99,3],[104,2],[108,4],[114,1],[117,3],[122,5],[129,2],
    [133,1],[136,4],[142,3],[147,1],[150,2],[154,5],[161,1],[164,3],[169,2],
    [173,4],[179,1],[182,3],[187,5],[194,2],[198,1],[201,4],[207,3],[212,1],
    [215,2],[219,5],[226,1],[229,3],[234,2],[238,4],[244,1],[247,3],[252,5],[259,1],
  ];
  return (
    <svg width="100%" height="44" viewBox="0 0 262 44" style={{ display: 'block' }}>
      {bars.map(([x, w], i) => (
        <rect key={i} x={x} y={0} width={w} height={44} fill={color} opacity="0.8" />
      ))}
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: '14px 12px' }}>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 22, fontWeight: 900, color: accent ?? '#fff', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PlayerProfile() {
  const router = useRouter();
  const params = useParams();
  const playerId = params?.id as string;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    async function load() {
      if (!playerId) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', playerId)
        .single();

      if (!error && data) setProfile(data);
      setLoading(false);
    }
    load();
  }, [playerId, supabase]);

  if (loading) return (
    <div style={{ height: '100vh', background: '#07080f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 10, color: '#E24B4A', letterSpacing: 8, textTransform: 'uppercase' }}>
        Cargando expediente...
      </div>
    </div>
  );

  if (!profile) return (
    <div style={{ height: '100vh', background: '#07080f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 4 }}>Jugador no encontrado</div>
    </div>
  );

  // ── Derived data ──
  const name = profile.username || profile.full_name || 'Desconocido';
  const initials = name.replace(/[_0-9]/g, '').substring(0, 2).toUpperCase();
  const totalGames = (profile.wins ?? 0) + (profile.losses ?? 0);
  const winRate = totalGames > 0 ? Math.round(((profile.wins ?? 0) / totalGames) * 100) : 0;
  const accent = '#E24B4A';

  // ── Mock data (replace with real DB queries) ──
  const tournaments: TournamentStat[] = [
    { name: 'Copa Andina S06', wins: 18, pct: 82, color: '#E24B4A' },
    { name: 'Arena Nocturna',  wins: 14, pct: 71, color: '#00A8FF' },
    { name: 'Torneo Relámpago', wins: 9, pct: 64, color: '#FFB400' },
    { name: 'Liga Regional COL', wins: 7, pct: 58, color: '#A0AAC8' },
  ];

  const achievements: Achievement[] = [
    { icon: '⚡', label: 'Primer sangre',  desc: 'Abrió marcador en 30 torneos', color: '#E24B4A' },
    { icon: '🔥', label: 'En llamas',      desc: `Racha de ${profile.best_streak ?? 7} victorias`, color: '#FF8C00' },
    { icon: '🛡',  label: 'Muro de acero', desc: '0 goles en 12 partidas',       color: '#00A8FF' },
    { icon: '🏆', label: `Veterano S0${profile.seasons_active ?? 3}`, desc: `${profile.seasons_active ?? 3} temporadas activas`, color: '#FFB400' },
    { icon: '📍', label: 'Orgullo COL',   desc: 'Top 100 nacional',             color: '#5DCAA5' },
  ];

  const recentMatches: Match[] = [
    { result: 'W', opponent: 'NightFalcon',  score: '3-1', px: '+280' },
    { result: 'W', opponent: 'BlueLance',    score: '2-0', px: '+310' },
    { result: 'L', opponent: 'XaviKing_CR',  score: '0-3', px: '-120' },
    { result: 'W', opponent: 'Kira_V',       score: '2-1', px: '+255' },
    { result: 'W', opponent: 'FlashPoint',   score: '3-2', px: '+290' },
    { result: 'L', opponent: 'SilverBolt_88', score: '1-2', px: '-90' },
  ];

  return (
    <div style={{ 
  background: 'linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), #07080f url("/img/estadio.jpg") center/cover no-repeat fixed', 
  minHeight: '100vh', 
  color: '#fff', 
  fontFamily: "'Rajdhani', sans-serif", 
  position: 'relative', 
  overflowX: 'hidden',
  paddingBottom: '40px'
}}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Orbitron:wght@400;700;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .pf-grid { position:fixed; inset:0; pointer-events:none; z-index:0;
          background-image: linear-gradient(rgba(226,75,74,0.025) 1px,transparent 1px),
            linear-gradient(90deg,rgba(226,75,74,0.025) 1px,transparent 1px);
          background-size: 40px 40px; }
        .pf-glow { position:fixed; top:-150px; right:-100px; width:500px; height:400px;
          pointer-events:none; z-index:0;
          background:radial-gradient(ellipse,rgba(226,75,74,0.1) 0%,transparent 65%); }
      `}</style>

      <div className="pf-grid" />
      <div className="pf-glow" />

      {/* ── Nav ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '18px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, #07080f 0%, transparent 100%)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(226,75,74,0.1)' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: `2px solid ${accent}`, color: accent, padding: '9px 22px', fontFamily: "'Orbitron', monospace", fontSize: 9, fontWeight: 900, letterSpacing: 2, cursor: 'pointer', borderRadius: 0, clipPath: 'polygon(14% 0, 100% 0, 86% 100%, 0 100%)', textTransform: 'uppercase' }}
        >
          <ChevronLeft size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
          Ranking
        </button>
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, fontWeight: 900, letterSpacing: 5, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
          Expediente · {profile.player_code}
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 2, maxWidth: 900, margin: '0 auto', padding: '36px 40px 0' }}>

        {/* ── Hero row ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}
        >
          {/* Avatar */}
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#1a0808', border: `3px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Orbitron', monospace", fontSize: 28, fontWeight: 900, color: accent, flexShrink: 0, position: 'relative' }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : initials
            }
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', background: accent, border: '3px solid #07080f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Orbitron', monospace", fontSize: 9, fontWeight: 900, color: '#07080f' }}>
              {profile.tier ?? 'B'}
            </div>
          </div>

          {/* Name block */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, color: accent, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 6 }}>
              Tier {profile.tier ?? 'B'} · Rank #{profile.rank ?? '—'}
            </div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 4 }}>{name}</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 3, marginBottom: 12 }}>
              {profile.player_code} · {profile.country || 'COL'} · Temporada S06
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'ACTIVE', bg: `rgba(226,75,74,0.12)`, color: accent, border: `rgba(226,75,74,0.3)` },
                { label: `${profile.city || profile.country || 'COL'}`, bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: 'rgba(255,255,255,0.08)' },
                { label: `S0${profile.seasons_active ?? 3} VETERANO`, bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: 'rgba(255,255,255,0.08)' },
              ].map(b => (
                <div key={b.label} style={{ background: b.bg, border: `1px solid ${b.border}`, borderRadius: 3, padding: '4px 10px' }}>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, fontWeight: 700, color: b.color, letterSpacing: 2 }}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PX block */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Bounty PX</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 34, fontWeight: 900, color: accent, lineHeight: 1 }}>
              {profile.pitchx_balance?.toLocaleString() ?? '—'}
            </div>
            {profile.px_this_week && (
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>
                ↑ +{profile.px_this_week.toLocaleString()} esta semana
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: `linear-gradient(90deg, ${accent}, rgba(226,75,74,0.15), transparent)`, marginBottom: 24 }} />

        {/* ── Stat grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          <StatCard label="Victorias"   value={profile.wins ?? 0}        sub={`de ${totalGames} partidas`} />
          <StatCard label="Win Rate"    value={`${winRate}%`}             accent="#00A8FF" />
          <StatCard label="K/D Ratio"   value={profile.kd?.toFixed(1) ?? '—'} />
          <StatCard label="Racha máx."  value={profile.best_streak ?? '—'} sub="wins consecutivas" accent="#FFB400" />
        </div>

        {/* ── Two-column section ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Tournament performance */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: 16 }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 14 }}>Rendimiento por torneo</div>
            {tournaments.map(t => (
              <div key={t.name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{t.name}</span>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 700, color: t.color }}>{t.wins}W</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${t.pct}%`, background: t.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Achievements */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: 16 }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 14 }}>Logros desbloqueados</div>
            {achievements.map(a => (
              <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {a.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom two-column ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>

          {/* Match history */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: 16 }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 14 }}>Historial reciente</div>
            {recentMatches.map((m, i) => {
              const win = m.result === 'W';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 3, background: win ? 'rgba(0,200,100,0.15)' : 'rgba(226,75,74,0.12)', border: `1px solid ${win ? 'rgba(0,200,100,0.3)' : 'rgba(226,75,74,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, fontWeight: 900, color: win ? '#00C864' : accent }}>{m.result}</span>
                  </div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>vs {m.opponent}</span>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{m.score}</span>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 700, color: win ? '#00C864' : accent, minWidth: 44, textAlign: 'right' }}>{m.px}</span>
                </div>
              );
            })}
          </div>

          {/* Barcode + progression */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: 16 }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 14 }}>Código de barras del jugador</div>
            <LongBarcode color={accent} />
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 3, textAlign: 'center', marginTop: 8 }}>
              {profile.player_code} · {profile.country || 'COL'} · S06
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Próxima recompensa</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${profile.next_tier_progress ?? 73}%`, background: accent, borderRadius: 2 }} />
                </div>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 700, color: accent }}>{profile.next_tier_progress ?? 73}%</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 6 }}>
                {profile.next_tier_px?.toLocaleString() ?? '3,330'} PX para desbloquear siguiente Tier
              </div>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={() => router.push(`/radar?compare=${profile.id}`)}
            style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, fontWeight: 700, letterSpacing: 2, padding: '10px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            Comparar con Tier {profile.tier ?? 'B'} <ArrowUpRight size={14} />
          </button>
          <button
            onClick={() => router.push('/blacklist')}
            style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, fontWeight: 700, letterSpacing: 2, padding: '10px 18px', background: `rgba(226,75,74,0.1)`, border: `1px solid rgba(226,75,74,0.3)`, color: accent, borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            Volver al Ranking <ArrowUpRight size={14} />
          </button>
        </div>
      </main>
    </div>
  );
}
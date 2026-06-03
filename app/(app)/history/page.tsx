"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, ShieldAlert, Activity, Trophy, XCircle, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface Partido {
  id: number;
  fecha_inicio: string;
  equipo_local: string;
  equipo_visitante: string;
  bandera_local: string;
  bandera_visitante: string;
  fase: string;
  codigo_partido: string;
  resultado_prediccion?: 'ganada' | 'perdida' | null;
}

type FilterType = 'all' | 'ganada' | 'perdida' | 'pending';

function getStatus(match: Partido) {
  if (match.resultado_prediccion === 'ganada') return {
    state: 'ganada' as const, label: 'CORRECTA',
    color: '#00E887', border: 'rgba(0,232,135,0.25)', bg: 'rgba(0,232,135,0.04)',
  };
  if (match.resultado_prediccion === 'perdida') return {
    state: 'perdida' as const, label: 'FALLIDA',
    color: '#FF3B5C', border: 'rgba(255,59,92,0.25)', bg: 'rgba(255,59,92,0.04)',
  };
  const isPast = new Date(match.fecha_inicio).getTime() < Date.now();
  return {
    state: 'pending' as const, label: isPast ? 'SIN PRED.' : 'EN ESPERA',
    color: '#00B8FF', border: 'rgba(0,184,255,0.15)', bg: 'rgba(0,184,255,0.03)',
  };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase(),
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

function Flag({ code, alt, dim }: { code: string; alt: string; dim?: boolean }) {
  return (
    <img
      src={`https://flagcdn.com/w80/${(code || 'un').toLowerCase()}.png`}
      alt={alt}
      onError={e => (e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Flag_of_the_United_Nations.svg')}
      style={{
        width: 36, height: 24, objectFit: 'cover', borderRadius: 3,
        border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
        filter: dim ? 'grayscale(1) brightness(0.4)' : 'none',
      }}
    />
  );
}

function MatchCard({ match, index }: { match: Partido; index: number }) {
  const s = getStatus(match);
  const { date, time } = formatDate(match.fecha_inicio);
  const dim = s.state === 'perdida';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderLeft: `3px solid ${s.color}`,
        borderRadius: 8, padding: '12px 14px',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontFamily: "'Orbitron', monospace", fontSize: 8, fontWeight: 700,
          color: s.color, letterSpacing: 1.5,
          background: `${s.color}18`, border: `1px solid ${s.color}33`,
          padding: '3px 8px', borderRadius: 3,
        }}>{s.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Orbitron', monospace", fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>
          <Clock size={9} />
          {date} · {time}
        </div>
      </div>

      {/* Teams */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Local */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
          <Flag code={match.bandera_local} alt={match.equipo_local} dim={dim} />
          <span style={{
            fontSize: 13, fontWeight: 700, color: dim ? 'rgba(255,255,255,0.3)' : '#fff',
            textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{match.equipo_local}</span>
        </div>

        {/* VS / icon */}
        <div style={{ flexShrink: 0, width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {s.state === 'ganada' && <Trophy size={16} color="#00E887" />}
          {s.state === 'perdida' && <XCircle size={16} color="#FF3B5C" />}
          {s.state === 'pending' && <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>VS</span>}
        </div>

        {/* Visitante */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
          <span style={{
            fontSize: 13, fontWeight: 700, color: dim ? 'rgba(255,255,255,0.3)' : '#fff',
            textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right',
          }}>{match.equipo_visitante}</span>
          <Flag code={match.bandera_visitante} alt={match.equipo_visitante} dim={dim} />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 7, color: 'rgba(255,255,255,0.2)', letterSpacing: 2 }}>
          {match.codigo_partido} · {match.fase}
        </span>
        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 8, color: s.color, letterSpacing: 1, fontWeight: 700 }}>
          {s.state === 'ganada' ? '+PX' : s.state === 'perdida' ? '−VIDA' : 'PENDIENTE'}
        </span>
      </div>
    </motion.div>
  );
}

export default function HistoryCalendar() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [matches, setMatches] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    async function fetch() {
      const { data: partidos, error } = await supabase
        .from('partidos').select('*').order('fecha_inicio', { ascending: true });
      const { data: { user } } = await supabase.auth.getUser();

      if (!error && partidos) {
        if (user) {
          const { data: preds } = await supabase
            .from('predicciones').select('partido_id, resultado').eq('user_id', user.id);
          setMatches(partidos.map(p => ({
            ...p,
            resultado_prediccion: preds?.find(pr => pr.partido_id === p.id)?.resultado ?? null,
          })));
        } else {
          setMatches(partidos);
        }
      }
      setTimeout(() => setLoading(false), 500);
    }
    fetch();
  }, [supabase]);

  if (loading) return (
    <div style={{ height: '100vh', background: '#07080f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }}>
        <Activity size={32} color="#00B8FF" style={{ display: 'block', margin: '0 auto 12px' }} />
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, color: '#00B8FF', letterSpacing: 6 }}>CARGANDO...</div>
      </motion.div>
    </div>
  );

  const ganadas    = matches.filter(m => m.resultado_prediccion === 'ganada').length;
  const perdidas   = matches.filter(m => m.resultado_prediccion === 'perdida').length;
  const pendientes = matches.filter(m => !m.resultado_prediccion).length;
  const winRate    = ganadas + perdidas > 0 ? Math.round((ganadas / (ganadas + perdidas)) * 100) : 0;

  const filtered = matches.filter(m => {
    if (filter === 'ganada')  return m.resultado_prediccion === 'ganada';
    if (filter === 'perdida') return m.resultado_prediccion === 'perdida';
    if (filter === 'pending') return !m.resultado_prediccion;
    return true;
  });

  const FILTERS: { key: FilterType; label: string; count: number; color: string }[] = [
    { key: 'all',     label: 'TODOS',      count: matches.length, color: '#fff' },
    { key: 'ganada',  label: 'GANADAS',    count: ganadas,        color: '#00E887' },
    { key: 'perdida', label: 'PERDIDAS',   count: perdidas,       color: '#FF3B5C' },
    { key: 'pending', label: 'PENDIENTES', count: pendientes,     color: '#00B8FF' },
  ];

  return (
    <div style={{ background: '#07080f', minHeight: '100vh', color: '#fff', fontFamily: "'Rajdhani', sans-serif", overflowX: 'hidden', paddingBottom: 48 }}>

      {/* BG */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'url("/img/munich1.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12, zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(7,8,15,0.75)', zIndex: 1, pointerEvents: 'none' }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Orbitron:wght@400;700;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        .hy-wrap { position: relative; z-index: 2; max-width: 700px; margin: 0 auto; padding: 0 14px; }
        .hy-nav {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px;
          background: rgba(7,8,15,0.95); border-bottom: 1px solid rgba(0,184,255,0.1);
          backdrop-filter: blur(16px); user-select: none;
        }
        .hy-back {
          display: flex; align-items: center; gap: 5px;
          background: none; border: 1px solid rgba(0,184,255,0.3);
          color: #00B8FF; padding: 6px 12px; cursor: pointer;
          font-family: 'Orbitron', monospace; font-size: 8px; letter-spacing: 2px;
          transition: all 0.2s; outline: none; border-radius: 2px;
        }
        .hy-back:hover { background: rgba(0,184,255,0.1); }
        .hy-nav-title { font-family: 'Orbitron', monospace; font-size: 10px; font-weight: 900; letter-spacing: 3px; color: #fff; }
        .hy-nav-title span { color: #00B8FF; }
        .hy-nav-tag { font-family: 'Orbitron', monospace; font-size: 8px; letter-spacing: 2px; color: rgba(255,255,255,0.2); }

        .hy-header { padding: 18px 0 14px; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 14px; }
        .hy-header-tag { font-family: 'Orbitron', monospace; font-size: 8px; letter-spacing: 4px; color: #00B8FF; margin-bottom: 5px; }
        .hy-header-title { font-family: 'Orbitron', monospace; font-size: clamp(18px,5vw,28px); font-weight: 900; color: #fff; line-height: 1; }
        .hy-header-title span { color: #00B8FF; }

        .hy-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; margin-bottom: 14px; }
        .hy-stat {
          background: rgba(10,14,26,0.95); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px; padding: 10px 8px; text-align: center;
        }
        .hy-stat-val { font-family: 'Orbitron', monospace; font-size: 20px; font-weight: 900; line-height: 1; margin-bottom: 3px; }
        .hy-stat-lbl { font-family: 'Orbitron', monospace; font-size: 6px; letter-spacing: 1px; color: rgba(255,255,255,0.25); }

        .hy-winrate {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(10,14,26,0.95); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px; padding: 10px 16px; margin-bottom: 14px; gap: 12px;
        }
        .hy-wr-left { display: flex; flex-direction: column; gap: 2px; }
        .hy-wr-label { font-family: 'Orbitron', monospace; font-size: 7px; letter-spacing: 3px; color: rgba(255,255,255,0.25); }
        .hy-wr-val { font-family: 'Orbitron', monospace; font-size: 26px; font-weight: 900; line-height: 1; }
        .hy-wr-bar { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
        .hy-wr-fill { height: 100%; border-radius: 3px; transition: width 1s ease; }

        .hy-filters { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 12px; }
        .hy-filter-btn {
          font-family: 'Orbitron', monospace; font-size: 8px; font-weight: 700;
          letter-spacing: 1.5px; padding: 7px 12px; border-radius: 4px; cursor: pointer;
          transition: all 0.2s; outline: none; border: 1px solid;
          display: flex; align-items: center; gap: 5px;
        }

        .hy-section { font-family: 'Orbitron', monospace; font-size: 7px; letter-spacing: 3px; color: rgba(255,255,255,0.2); margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
        .hy-section-line { flex: 1; height: 1px; background: rgba(255,255,255,0.05); }

        .hy-cards { display: flex; flex-direction: column; gap: 6px; }

        .hy-empty { text-align: center; padding: 60px 0; }
        .hy-empty-icon { color: rgba(255,255,255,0.15); margin: 0 auto 12px; display: block; }
        .hy-empty-txt { font-family: 'Orbitron', monospace; font-size: 10px; letter-spacing: 3px; color: rgba(255,255,255,0.2); }

        @media (max-width: 480px) {
          .hy-stats { grid-template-columns: repeat(2,1fr); }
          .hy-stat-val { font-size: 16px; }
          .hy-filter-btn { font-size: 7px; padding: 6px 9px; }
        }
      `}</style>

      {/* NAV */}
      <nav className="hy-nav">
        <button className="hy-back" onClick={() => router.push('/radar')}>
          <ChevronLeft size={12} /> RADAR
        </button>
        <div className="hy-nav-title">MIS <span>PRED.</span></div>
        <div className="hy-nav-tag">S06</div>
      </nav>

      <div className="hy-wrap">

        {/* HEADER */}
        <div className="hy-header">
          <div className="hy-header-tag">◈ HISTORIAL · TEMPORADA S06</div>
          <div className="hy-header-title">MIS <span>PREDICCIONES</span></div>
        </div>

        {/* STATS */}
        <div className="hy-stats">
          {[
            { label: 'TOTAL',      val: matches.length, color: '#fff'     },
            { label: 'GANADAS',    val: ganadas,        color: '#00E887'  },
            { label: 'PERDIDAS',   val: perdidas,       color: '#FF3B5C'  },
            { label: 'PENDIENTES', val: pendientes,     color: '#00B8FF'  },
          ].map(s => (
            <div key={s.label} className="hy-stat">
              <div className="hy-stat-val" style={{ color: s.color }}>{s.val}</div>
              <div className="hy-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* WIN RATE BAR */}
        <div className="hy-winrate">
          <div className="hy-wr-left">
            <div className="hy-wr-label">WIN RATE</div>
            <div className="hy-wr-val" style={{ color: winRate >= 50 ? '#00E887' : '#FF3B5C' }}>
              {winRate}<span style={{ fontSize: 13, opacity: 0.6 }}>%</span>
            </div>
          </div>
          <div className="hy-wr-bar">
            <motion.div
              className="hy-wr-fill"
              initial={{ width: 0 }}
              animate={{ width: `${winRate}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              style={{ background: winRate >= 50 ? '#00E887' : '#FF3B5C' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Zap size={14} color={winRate >= 50 ? '#00E887' : '#FF3B5C'} />
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
              {ganadas}/{ganadas + perdidas}
            </span>
          </div>
        </div>

        {/* FILTERS */}
        <div className="hy-filters">
          {FILTERS.map(f => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                className="hy-filter-btn"
                onClick={() => setFilter(f.key)}
                style={{
                  background: active ? `${f.color}18` : 'rgba(10,14,26,0.8)',
                  borderColor: active ? `${f.color}66` : 'rgba(255,255,255,0.08)',
                  color: active ? f.color : 'rgba(255,255,255,0.35)',
                }}
              >
                {f.label}
                <span style={{
                  background: active ? `${f.color}22` : 'rgba(255,255,255,0.06)',
                  color: active ? f.color : 'rgba(255,255,255,0.3)',
                  fontFamily: "'Orbitron', monospace", fontSize: 7,
                  padding: '1px 5px', borderRadius: 3,
                }}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* SECTION */}
        <div className="hy-section">
          <Activity size={10} color="#00B8FF" />
          <span>REGISTRO DE PARTIDOS</span>
          <div className="hy-section-line" />
          <span style={{ flexShrink: 0 }}>{filtered.length} ITEMS</span>
        </div>

        {/* CARDS */}
        <div className="hy-cards">
          <AnimatePresence mode="popLayout">
            {filtered.length > 0
              ? filtered.map((m, i) => <MatchCard key={m.id} match={m} index={i} />)
              : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hy-empty">
                  <ShieldAlert size={36} className="hy-empty-icon" />
                  <div className="hy-empty-txt">SIN REGISTROS</div>
                </motion.div>
              )
            }
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
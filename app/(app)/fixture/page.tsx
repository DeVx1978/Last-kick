"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function FixtureMundial() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('TODOS');

  const supabase = createBrowserClient(
    'https://gtioqzodmulbqbohdyet.supabase.co', 
    'sb_publishable_AitDo2hEkx8tA-rjchUUlA_TfI3sDjH'
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function loadMatches() {
      const { data, error } = await supabase
        .from('partidos')
        .select('*')
        .or('codigo_partido.ilike.%WC%,fase.ilike.%MUNDIAL%')
        .order('fecha_inicio', { ascending: true });
      
      if (!error && data) setMatches(data);
      setLoading(false);
    }
    loadMatches();
  }, [supabase]);

  const filteredMatches = matches.filter(m => {
    return activeTab === 'TODOS' || m.fase.toUpperCase().includes(activeTab.toUpperCase());
  });

  if (!isMounted) return <div style={{ background: '#000', minHeight: '100vh' }} />;

  return (
    <div className="fixture-root">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700;900&family=Space+Grotesk:wght@300;400;500;700&family=Bebas+Neue&display=swap');
        
        .fixture-root { 
          background: #000; min-height: 100vh; font-family: 'Space Grotesk', sans-serif; 
          color: #fff; padding-bottom: 50px; position: relative; overflow-x: hidden;
        }

        /* ── FONDO MUNDIALISTA FINAL (copamundo.jpg) ── */
        .dynamic-bg {
          position: fixed; inset: 0; z-index: 0;
          background-image: url('/img/copamundo.jpg'); 
          background-size: cover; 
          background-position: center;
          filter: brightness(0.45) contrast(1.1); /* Brillo optimizado para ver la foto claramente */
        }

        .bg-overlay {
          position: fixed; inset: 0; z-index: 1;
          background: radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 100%);
        }

        .fix-header { position: sticky; top: 0; z-index: 100; background: rgba(0,0,0,0.7); border-bottom: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(15px); padding: 12px 5vw; display: flex; justify-content: space-between; align-items: center; }
        .back-btn { display: flex; align-items: center; gap: 8px; font-family: 'Syncopate'; font-size: 8px; color: #fff; cursor: pointer; background: none; border: none; opacity: 0.5; transition: 0.3s; letter-spacing: 1px; }
        .back-btn:hover { opacity: 1; color: #FF0033; }

        .fix-hero { position: relative; z-index: 10; padding: 30px 5vw 15px; text-align: center; }
        .fix-title { font-family: 'Syncopate'; font-weight: 900; font-size: 24px; text-transform: uppercase; letter-spacing: -1px; margin-bottom: 5px; }

        .tabs-container { position: relative; z-index: 10; display: flex; justify-content: center; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
        .tab-btn { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); color: #666; padding: 6px 14px; font-family: 'Syncopate'; font-size: 7.5px; cursor: pointer; border-radius: 2px; transition: 0.3s; }
        .tab-btn.active { background: #FF0033; color: #fff; border-color: #FF0033; box-shadow: 0 0 15px rgba(255,0,51,0.2); }

        .matches-container { position: relative; z-index: 10; width: 100%; max-width: 850px; margin: 0 auto; display: flex; flex-direction: column; gap: 4px; }

        /* ── FILAS ESTILO "GLASS" PROFESIONAL (ESCALA PEQUEÑA) ── */
        .broadcast-row {
          display: flex; flex-direction: column;
          background: rgba(255, 255, 255, 0.02); /* Transparencia ultra-fina */
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .b-meta { display: flex; justify-content: center; gap: 12px; padding: 5px; background: rgba(0,0,0,0.25); font-family: 'Space Grotesk'; font-size: 8.5px; color: rgba(255,255,255,0.5); letter-spacing: 1px; font-weight: 600; }
        .b-core { display: grid; grid-template-columns: 1fr 70px 1fr; align-items: center; padding: 12px 25px; }
        
        .team-side { display: flex; align-items: center; gap: 12px; }
        .team-side.local { justify-content: flex-end; text-align: right; }
        .team-side.visit { justify-content: flex-start; text-align: left; }
        
        .team-name { font-family: 'Syncopate', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: -0.5px; }
        .flag-img { width: 35px; height: auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); }
        
        .score-box { font-family: 'Bebas Neue'; font-size: 22px; color: #FF0033; text-align: center; letter-spacing: 2px; }

        .b-bottom { text-align: center; padding: 6px; font-family: 'Space Grotesk'; font-size: 8.5px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.5px; }
      `}} />

      <div className="dynamic-bg" />
      <div className="bg-overlay" />

      <header className="fix-header">
        <button className="back-btn" onClick={() => router.push('/')}><ChevronLeft size={12} /> REGRESAR</button>
        <div style={{fontFamily:'Syncopate', fontSize:'9px', fontWeight:900, opacity:0.7, letterSpacing: '1px'}}>MATRIZ DE COMBATE FIFA 2026</div>
      </header>

      <section className="fix-hero">
        <h1 className="fix-title">FIXTURE MUNDIALISTA</h1>
        <div style={{width: '30px', height: '1.5px', background: '#FF0033', margin: '0 auto'}}></div>
      </section>

      <div className="tabs-container">
        {['TODOS', 'GRUPO', 'OCTAVOS', 'CUARTOS', 'SEMIFINAL', 'FINAL'].map(tab => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>

      <main className="matches-container">
        <AnimatePresence mode="wait">
          {loading ? (
            <div style={{textAlign:'center', padding:'40px', opacity:0.4, fontSize: '9px', fontFamily: 'Syncopate', letterSpacing: '4px'}}>SINCRO_DATA...</div>
          ) : filteredMatches.map((match, i) => (
            <motion.div key={match.id} initial={{opacity:0, y: 5}} animate={{opacity:1, y: 0}} transition={{delay: i * 0.02}} className="broadcast-row">
              <div className="b-meta">
                <span style={{color:'#FF0033'}}>{match.fase?.toUpperCase() || 'FASE'}</span>
                <span style={{opacity: 0.2}}>|</span>
                <span>{match.fecha_inicio ? new Date(match.fecha_inicio).toLocaleDateString('es-ES', {weekday: 'short', day:'2-digit', month:'short'}).toUpperCase() : '--'}</span>
                <span style={{opacity: 0.2}}>|</span>
                <span>{match.fecha_inicio ? new Date(match.fecha_inicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--'} HRS</span>
              </div>
              
              <div className="b-core">
                <div className="team-side local">
                  <span className="team-name">{match.equipo_local || 'TBD'}</span>
                  <img src={`https://flagcdn.com/w160/${match.bandera_local?.toLowerCase() || 'un'}.png`} className="flag-img" />
                </div>
                
                <div className="score-box">
                  {match.marcador_local !== null && match.marcador_local !== undefined ? `${match.marcador_local} - ${match.marcador_visitante}` : 'VS'}
                </div>

                <div className="team-side visit">
                  <img src={`https://flagcdn.com/w160/${match.bandera_visitante?.toLowerCase() || 'un'}.png`} className="flag-img" />
                  <span className="team-name">{match.equipo_visitante || 'TBD'}</span>
                </div>
              </div>

              <div className="b-bottom">
                {match.estadio || 'ESTADIO'} • {match.codigo_partido || 'WC-ID'}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>
    </div>
  );
}
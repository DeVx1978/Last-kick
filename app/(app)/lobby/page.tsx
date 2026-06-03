"use client";
import React from 'react';
import Link from 'next/link';

const torneos = [
  { id: '1', name: 'MUNDIAL 2026', slug: 'mundial-2026', color: '#00C853', icon: '🏆', players: '142K', jackpot: '$5.4M' },
  { id: '2', name: 'UEFA CHAMPIONS', slug: 'ucl-2024', color: '#00AEEF', icon: '⚽', players: '89K', jackpot: '$2.1M' },
  { id: '3', name: 'PARTIDOS ESPECIALES', slug: 'especiales', color: '#dc2626', icon: '🔥', players: '12K', jackpot: '$500K' },
  { id: '4', name: 'COPA AMÉRICA', slug: 'copa-america', color: '#FFD700', icon: '🌎', players: '45K', jackpot: '$1.2M' },
  { id: '5', name: 'PREMIER LEAGUE', slug: 'premier', color: '#A020F0', icon: '🦁', players: '67K', jackpot: '$3.0M' },
  { id: '6', name: 'LIBERTADORES', slug: 'libertadores', color: '#FFA500', icon: '⚔️', players: '33K', jackpot: '$900K' },
];

export default function LobbyPage() {
  return (
    <main style={{ position: 'relative', minHeight: '100vh' }}>
      {/* CAPAS DE AMBIENTACIÓN */}
      <div className="bg-elite"></div>
      <div className="overlay-elite"></div>

      <div style={{ position: 'relative', zIndex: 10, padding: '40px' }}>
        <header style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '4px', color: '#00C853', marginBottom: '10px' }}>
             _SISTEMA OPERATIVO ARENA V.4.0
          </div>
          <h1 style={{ 
            color: 'white', 
            fontSize: 'clamp(1.5rem, 5vw, 2.8rem)', 
            fontWeight: '200', 
            letterSpacing: '8px', 
            textTransform: 'uppercase',
            margin: 0
          }}>
            SELECCIÓN DE OPERACIÓN
          </h1>
          <p style={{ color: '#555', fontSize: '0.7rem', letterSpacing: '3px', marginTop: '10px' }}>
            RANGO: <span style={{ color: '#dc2626', fontWeight: 'bold' }}>DIRECTOR GENERAL</span>
          </p>
        </header>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
          gap: '20px', 
          maxWidth: '1250px', 
          margin: '0 auto' 
        }}>
          {torneos.map((t) => (
            <Link 
              href={`/arena/${t.slug}`} 
              key={t.id} 
              style={{ textDecoration: 'none', color: 'white' }}
            >
              <div className="card-elite" style={{ 
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '25px',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                  <span style={{ fontSize: '1.8rem', filter: `drop-shadow(0 0 10px ${t.color})` }}>{t.icon}</span>
                  <span style={{ 
                    border: `1px solid ${t.color}`, 
                    color: t.color, 
                    fontSize: '0.55rem', 
                    padding: '3px 10px', 
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>LIVE_ACTIVE</span>
                </div>
                
                <h2 style={{ 
                  fontSize: '0.95rem', 
                  fontWeight: '900', 
                  marginBottom: '20px', 
                  color: 'white', 
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  {t.name}
                </h2>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '10px',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  paddingTop: '15px'
                }}>
                  <div>
                    <small style={{ display: 'block', fontSize: '0.5rem', color: '#444', letterSpacing: '1px' }}>JUGADORES</small>
                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{t.players}</span>
                  </div>
                  <div>
                    <small style={{ display: 'block', fontSize: '0.5rem', color: '#444', letterSpacing: '1px' }}>JACKPOT</small>
                    <span style={{ fontWeight: 'bold', color: '#FFD700', fontSize: '0.85rem' }}>{t.jackpot}</span>
                  </div>
                </div>

                <div style={{ marginTop: '20px', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                   <div style={{ width: '35%', height: '100%', background: t.color, boxShadow: `0 0 10px ${t.color}` }}></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .card-elite:hover {
          transform: translateY(-8px) scale(1.02);
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
        }
      `}</style>
    </main>
  );
}
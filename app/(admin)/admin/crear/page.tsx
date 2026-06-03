"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    tournament: 'MUNDIAL 2026',
    home_team: '',
    away_team: '',
    home_flag: '',
    away_flag: '',
    stadium: '',
    city: '',
    match_date: ''
  });

  // Mata el parpadeo de letras blancas al inicio
  useEffect(() => { setIsReady(true); }, []);

  const handlePublish = async () => {
    if (!formData.home_team || !formData.away_team) return alert("Director, identifique a los combatientes (equipos).");
    
    setLoading(true);
    const { error } = await supabase
      .from('matches')
      .insert([
        { 
          tournament: formData.tournament,
          home_team: formData.home_team,
          away_team: formData.away_team,
          home_flag: formData.home_flag,
          away_flag: formData.away_flag,
          stadium: formData.stadium,
          city: formData.city,
          match_date: formData.match_date,
          status: 'PROXIMAMENTE'
        }
      ]);

    if (error) {
      alert("ERROR DE TRANSMISIÓN: " + error.message);
    } else {
      alert("¡OPERACIÓN EXITOSA! El partido ya está en la red.");
      setFormData({ 
        tournament: 'MUNDIAL 2026', home_team: '', away_team: '', 
        home_flag: '', away_flag: '', stadium: '', city: '', match_date: '' 
      });
    }
    setLoading(false);
  };

  if (!isReady) return null;

  return (
    <main className="admin-wrapper">
      <div className="bg-fixed-layer"></div>
      <div className="dark-overlay"></div>
      
      <div className="admin-container">
        <header className="admin-header">
          <button onClick={() => router.push('/lobby')} className="back-btn">« VOLVER AL LOBBY</button>
          <h1>CENTRO DE MANDO_</h1>
        </header>

        <section className="form-card animate-in">
          <div className="form-top-info">
            <h3>DESPLEGAR NUEVO PARTIDO</h3>
            <span className="id-tag">SISTEMA V.4.1 - ESTABLE</span>
          </div>

          <div className="grid-form">
            <div className="input-group full-width">
              <label>TORNEO</label>
              <select className="elite-input" value={formData.tournament} onChange={(e) => setFormData({...formData, tournament: e.target.value})}>
                <option>MUNDIAL 2026</option>
                <option>UEFA CHAMPIONS</option>
                <option>ESPECIALES</option>
              </select>
            </div>

            <div className="input-group">
              <label>EQUIPO LOCAL</label>
              <input type="text" className="elite-input" placeholder="Peru" value={formData.home_team} onChange={(e) => setFormData({...formData, home_team: e.target.value})} />
            </div>
            <div className="input-group">
              <label>URL BANDERA LOCAL</label>
              <input type="text" className="elite-input" placeholder="https://..." value={formData.home_flag} onChange={(e) => setFormData({...formData, home_flag: e.target.value})} />
            </div>

            <div className="input-group">
              <label>EQUIPO VISITANTE</label>
              <input type="text" className="elite-input" placeholder="Bolivia" value={formData.away_team} onChange={(e) => setFormData({...formData, away_team: e.target.value})} />
            </div>
            <div className="input-group">
              <label>URL BANDERA VISITANTE</label>
              <input type="text" className="elite-input" placeholder="https://..." value={formData.away_flag} onChange={(e) => setFormData({...formData, away_flag: e.target.value})} />
            </div>

            <div className="input-group">
              <label>ESTADIO</label>
              <input type="text" className="elite-input" placeholder="Monumental" value={formData.stadium} onChange={(e) => setFormData({...formData, stadium: e.target.value})} />
            </div>
            <div className="input-group">
              <label>CIUDAD</label>
              <input type="text" className="elite-input" placeholder="Lima" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
            </div>

            <div className="input-group full-width">
              <label>FECHA Y HORA</label>
              <input type="datetime-local" className="elite-input" value={formData.match_date} onChange={(e) => setFormData({...formData, match_date: e.target.value})} />
            </div>
          </div>

          <button className="submit-btn" onClick={handlePublish} disabled={loading}>
            {loading ? "TRANSMITIENDO..." : "PUBLICAR PARTIDO EN LA ARENA"}
          </button>
        </section>
      </div>

      <style jsx>{`
        .admin-wrapper { min-height: 100vh; background: #000; color: white; position: relative; }
        .bg-fixed-layer { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: url('/img/gol.jpg'); background-size: cover; background-position: center; opacity: 0.25; filter: blur(5px); z-index: 0; }
        .dark-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle, transparent, #000 95%); z-index: 1; }
        .admin-container { position: relative; z-index: 10; max-width: 900px; margin: 0 auto; padding: 40px 20px; }
        .form-card { background: rgba(0,0,0,0.8); padding: 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(20px); }
        .grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .full-width { grid-column: span 2; }
        .elite-input { background: #000 !important; color: #fff !important; border: 1px solid #333 !important; padding: 15px !important; border-radius: 8px !important; width: 100%; outline: none; }
        .submit-btn { width: 100%; margin-top: 30px; padding: 20px; background: #00C853; color: #000; border: none; border-radius: 10px; font-weight: 900; cursor: pointer; text-transform: uppercase; }
        .admin-header h1 { font-size: 2.5rem; text-align: center; margin-bottom: 30px; font-weight: 900; }
        .back-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #666; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-bottom: 20px; font-size: 0.7rem; }
        label { font-size: 0.6rem; color: #555; letter-spacing: 2px; font-weight: bold; margin-bottom: 5px; display: block; text-transform: uppercase; }
        @media (max-width: 768px) { .grid-form { grid-template-columns: 1fr; } .full-width { grid-column: span 1; } }
      `}</style>
    </main>
  );
}
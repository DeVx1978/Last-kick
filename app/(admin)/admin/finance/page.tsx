"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, BellRing, Volume2, Zap, ShieldAlert, BadgeCheck, Clock, Check, Database, Activity, Target, Trophy, Users, X, Edit } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  'https://gtioqzodmulbqbohdyet.supabase.co',
  'sb_publishable_AitDo2hEkx8tA-rjchUUlA_TfI3sDjH'
);

export default function CommandCentral() {
  const [activeTab, setActiveTab] = useState<'finance' | 'arena' | 'recruits'>('finance');

  // ESTADOS FINANCE
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [hasNewPending, setHasNewPending] = useState(false);
  const [isMonitorActive, setIsMonitorActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ESTADOS ARENA
  const [activePartidos, setActivePartidos] = useState<any[]>([]);
  const [finalizedPartidos, setFinalizedPartidos] = useState<any[]>([]);
  const [loadingArena, setLoadingArena] = useState(false);

  // Marcadores locales por partido
  const [scores, setScores] = useState<Record<string, { local: string; visitante: string }>>({});

  // MODAL DE CONFIRMACIÓN
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFinalization, setPendingFinalization] = useState<{
    id: string;
    local: number;
    visitante: number;
    equipoLocal: string;
    equipoVisitante: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchTransacciones();
    fetchArenaData();

    const channel = supabase
      .channel('monitoreo_financiero')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transacciones' }, (payload) => {
        setTransacciones(prev => [payload.new, ...prev]);
        if (isMonitorActive) activarAlarma();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isMonitorActive]);

  const fetchTransacciones = async () => {
    const { data } = await supabase.from('transacciones').select('*').order('created_at', { ascending: false });
    if (data) {
      setTransacciones(data);
      if (data.some(t => t.estado === 'pendiente')) setHasNewPending(true);
    }
  };

  const fetchArenaData = async () => {
    setLoadingArena(true);
    // Partidos activos
    const { data: active } = await supabase
      .from('partidos')
      .select('*')
      .in('estado', ['ABIERTO', 'VIVO'])
      .order('fecha_inicio', { ascending: true });

    // Partidos finalizados
    const { data: finished } = await supabase
      .from('partidos')
      .select('*')
      .eq('estado', 'FINALIZADO')
      .order('fecha_inicio', { ascending: false });

    if (active) {
      setActivePartidos(active);
      const initialScores: Record<string, { local: string; visitante: string }> = {};
      active.forEach((p: any) => { initialScores[p.id] = { local: '', visitante: '' }; });
      setScores(initialScores);
    }
    if (finished) setFinalizedPartidos(finished);
    setLoadingArena(false);
  };

  const activarAlarma = () => {
    setHasNewPending(true);
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(() => {});
    }
  };

  const silenciarAlarma = () => {
    setHasNewPending(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const startMonitor = () => {
    setIsMonitorActive(true);
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
        audioRef.current!.currentTime = 0;
      }).catch(() => {});
    }
  };

  const aprobarTransaccion = async (t: any) => {
    try {
      await supabase.from('transacciones').update({ estado: 'completado' }).eq('id', t.id);
      const { data: perfil } = await supabase.from('perfiles').select('pitchx_balance, vidas_restantes').eq('id', t.user_id).single();
      await supabase.from('perfiles').update({ 
        pitchx_balance: (perfil?.pitchx_balance || 0) + t.pitchx_amount,
        vidas_restantes: (perfil?.vidas_restantes || 0) + t.vidas_amount
      }).eq('id', t.user_id);
      fetchTransacciones();
      alert(`SISTEMA: CAPITAL INYECTADO A ${t.gamertag.toUpperCase()}`);
    } catch (e: any) {
      alert("FALLO TÉCNICO: " + e.message);
    }
  };

  const updateScore = (partidoId: string, field: 'local' | 'visitante', value: string) => {
    setScores(prev => ({
      ...prev,
      [partidoId]: { ...prev[partidoId], [field]: value }
    }));
  };

  const openFinalizationModal = (p: any) => {
    const localScore = parseInt(scores[p.id]?.local || '0');
    const visitanteScore = parseInt(scores[p.id]?.visitante || '0');
    if (isNaN(localScore) || isNaN(visitanteScore)) {
      alert("DEBE INGRESAR AMBOS MARCADORES");
      return;
    }
    setPendingFinalization({
      id: p.id,
      local: localScore,
      visitante: visitanteScore,
      equipoLocal: p.equipo_local,
      equipoVisitante: p.equipo_visitante
    });
    setShowConfirmModal(true);
  };

  const confirmarFinalizacion = async () => {
    if (!pendingFinalization) return;
    try {
      const { error } = await supabase
        .from('partidos')
        .update({
          marcador_local: pendingFinalization.local,
          marcador_visitante: pendingFinalization.visitante,
          estado: 'FINALIZADO'
        })
        .eq('id', pendingFinalization.id);
      if (error) throw error;
      alert("✅ PARTIDO FINALIZADO. VEREDICTOS EJECUTADOS.");
      fetchArenaData();
      setScores(prev => { const updated = { ...prev }; delete updated[pendingFinalization.id]; return updated; });
    } catch (err: any) {
      alert("ERROR: " + err.message);
    } finally {
      setShowConfirmModal(false);
      setPendingFinalization(null);
    }
  };

  // REABRIR PARTIDO (CORREGIR)
  const reopenPartido = async (id: string) => {
    if (!confirm("¿Reabrir esta arena para corregir el resultado?")) return;
    const { error } = await supabase
      .from('partidos')
      .update({ estado: 'ABIERTO', marcador_local: null, marcador_visitante: null })
      .eq('id', id);
    if (error) alert("Error al reabrir");
    else fetchArenaData();
  };

  if (!mounted) return null;

  return (
    <div className="command-central">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700;900&family=Space+Grotesk:wght@300;500;700;900&display=swap');
        
        .command-central { background:#000; min-height:100vh; color:white; font-family:'Space Grotesk',sans-serif; padding:20px; }
        .header { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:25px; margin-bottom:30px; flex-wrap:wrap; gap:15px; }
        .title { font-family:'Syncopate'; font-size:clamp(28px,5vw,42px); font-weight:900; letter-spacing:-1px; }
        .tabs { display:flex; gap:8px; background:#0a0a0a; padding:6px; border-radius:8px; width:fit-content; }
        .tab { padding:12px 28px; border-radius:6px; font-family:'Syncopate'; font-weight:900; font-size:11px; letter-spacing:1px; cursor:pointer; transition:all 0.3s; }
        .tab.active { background:#00C853; color:#000; box-shadow:0 0 20px rgba(0,200,83,0.5); }
        .monitor-btn { background:rgba(0,200,83,0.1); color:#00C853; border:1px solid #00C853; padding:10px 24px; border-radius:4px; font-family:'Syncopate'; font-weight:900; font-size:10px; cursor:pointer; display:flex; align-items:center; gap:10px; }
        .monitor-btn.active { background:#00C853; color:#000; box-shadow:0 0 20px rgba(0,200,83,0.6); }
        .alarm-banner { background:#FF0033; color:white; padding:16px 28px; border-radius:6px; font-family:'Syncopate'; font-weight:900; font-size:11px; margin:20px 0; animation:flash 1.1s infinite; cursor:pointer; display:flex; justify-content:space-between; align-items:center; }
        @keyframes flash { 0%,100%{opacity:1} 50%{opacity:0.75} }
        .section { background:#050505; border:1px solid #111; border-radius:8px; overflow:hidden; }
        .arena-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(420px,1fr)); gap:20px; padding:25px; }
        .match-card { background:#0a0a0a; border:1px solid #222; border-radius:8px; padding:24px; }
        .score-input { width:100%; background:#000; border:2px solid #00C853; color:white; text-align:center; font-size:32px; font-weight:900; padding:12px; border-radius:6px; }
        .finish-btn { background:#C8102E; color:white; border:none; padding:14px 32px; font-family:'Syncopate'; font-weight:900; font-size:11px; border-radius:4px; cursor:pointer; margin-top:20px; width:100%; letter-spacing:1px; }
        .finish-btn:hover { background:#FF0033; }
        .history-divider { text-align:center; font-family:'Syncopate'; font-size:13px; letter-spacing:3px; color:#00C853; margin:60px 0 30px; border-top:1px dashed #222; padding-top:20px; }
        .history-card { opacity:0.75; background:#0a0a0a; border:1px solid #333; border-radius:8px; padding:20px; }
        .history-card .score { font-size:28px; font-weight:900; color:#fff; }
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.92); backdrop-filter:blur(12px); z-index:9999; display:flex; align-items:center; justify-content:center; }
        .modal-content { background:#000; border:2px solid #00C853; border-radius:8px; width:100%; max-width:520px; padding:40px 30px; box-shadow:0 0 60px rgba(0,200,83,0.4); text-align:center; }
        .modal-title { font-family:'Syncopate'; font-size:22px; font-weight:900; margin-bottom:20px; color:#00C853; }
        .modal-score { font-family:'Syncopate'; font-size:42px; font-weight:900; letter-spacing:-2px; margin:20px 0; color:white; }
        .modal-warning { color:#FF0033; font-family:'Syncopate'; font-size:13px; font-weight:900; letter-spacing:2px; margin:25px 0 30px; }
        .modal-buttons { display:flex; gap:15px; }
        .modal-btn-cancel { flex:1; background:transparent; border:1px solid #555; color:#aaa; padding:16px; font-family:'Syncopate'; font-weight:900; font-size:11px; border-radius:4px; cursor:pointer; }
        .modal-btn-confirm { flex:1; background:#00C853; color:#000; border:none; padding:16px; font-family:'Syncopate'; font-weight:900; font-size:11px; border-radius:4px; cursor:pointer; box-shadow:0 0 25px rgba(0,200,83,0.6); }
      `}} />

      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3" loop />

      <div className="header">
        <div>
          <h1 className="title">COMMAND CENTRAL</h1>
          <p className="text-[10px] text-gray-500 tracking-[4px] uppercase">EL CALAMAR • OPERACIONES GLOBALES</p>
        </div>
        <div className="tabs">
          <div className={`tab ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>FINANCE</div>
          <div className={`tab ${activeTab === 'arena' ? 'active' : ''}`} onClick={() => setActiveTab('arena')}>ARENA CONTROL</div>
          <div className={`tab ${activeTab === 'recruits' ? 'active' : ''}`} onClick={() => setActiveTab('recruits')}>RECRUITS</div>
        </div>
      </div>

      <AnimatePresence>
        {hasNewPending && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="alarm-banner" onClick={silenciarAlarma}>
            <div className="flex items-center gap-3">
              <BellRing className="animate-bounce" size={20} />
              DEPÓSITO PENDIENTE DETECTADO EN LA RED
            </div>
            <button className="bg-white text-black px-5 py-1 text-xs font-bold rounded">SILENCIAR</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FINANCE */}
      {activeTab === 'finance' && (
        <>
          <div className="flex justify-end mb-6">
            <button className={`monitor-btn ${isMonitorActive ? 'active' : ''}`} onClick={startMonitor}>
              {isMonitorActive ? <Volume2 size={16} /> : <ShieldAlert size={16} />}
              {isMonitorActive ? "MONITOR ACTIVO" : "ACTIVAR ALARMA"}
            </button>
          </div>
          <div className="section">
            <table className="finance-table w-full">
              <thead>
                <tr>
                  <th>Identidad Recluta</th>
                  <th>Carga</th>
                  <th>Valor</th>
                  <th>Referencia</th>
                  <th>Registro Temporal</th>
                  <th>Estado</th>
                  <th style={{textAlign:'right'}}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {transacciones.map((t) => (
                  <tr key={t.id}>
                    <td><span className="user-cell">{t.gamertag}</span><span className="email-sub">{t.email}</span></td>
                    <td><span className="px-main">{t.pitchx_amount} PX</span><span className="vidas-sub">+{t.vidas_amount} VIDAS</span></td>
                    <td><span className="text-[#eee] font-bold">{t.precio_usd}</span></td>
                    <td><span className="ref-pill">{t.referencia}</span></td>
                    <td><div className="flex items-center gap-2 text-[11px] font-mono"><Clock size={12}/> {new Date(t.created_at).toLocaleString()}</div></td>
                    <td><span className={`status-pill ${t.estado}`}>{t.estado.toUpperCase()}</span></td>
                    <td style={{textAlign:'right'}}>
                      {t.estado === 'pendiente' ? <button className="btn-auth" onClick={() => aprobarTransaccion(t)}>AUTORIZAR</button> : <BadgeCheck size={22} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ARENA CONTROL */}
      {activeTab === 'arena' && (
        <div className="section">
          <div className="p-8 border-b border-[#111]">
            <h2 className="font-['Syncopate'] text-2xl font-black flex items-center gap-3">
              <Target size={28} className="text-[#00C853]" /> ARENA CONTROL — MUNDIAL 2026
            </h2>
          </div>

          {/* PARTIDOS ACTIVOS */}
          {loadingArena ? (
            <div className="text-center py-20">Cargando arenas...</div>
          ) : (
            <div className="arena-grid">
              {activePartidos.map((p) => (
                <div key={p.id} className="match-card">
                  <div className="match-header">{p.fase} • {new Date(p.fecha_inicio).toLocaleString('es-ES')}</div>
                  <div className="teams">
                    <div className="team"><img src={`https://flagcdn.com/w40/${p.bandera_local?.toLowerCase()}.png`} alt="" className="rounded" /><span>{p.equipo_local}</span></div>
                    <span className="text-[#C8102E] font-black text-2xl">VS</span>
                    <div className="team justify-end"><span>{p.equipo_visitante}</span><img src={`https://flagcdn.com/w40/${p.bandera_visitante?.toLowerCase()}.png`} alt="" className="rounded" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-2">LOCAL</label>
                      <input type="number" value={scores[p.id]?.local || ''} onChange={(e) => updateScore(p.id, 'local', e.target.value)} className="score-input" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-2">VISITANTE</label>
                      <input type="number" value={scores[p.id]?.visitante || ''} onChange={(e) => updateScore(p.id, 'visitante', e.target.value)} className="score-input" placeholder="0" />
                    </div>
                  </div>
                  <button className="finish-btn" onClick={() => openFinalizationModal(p)}>FINALIZAR PARTIDO</button>
                </div>
              ))}
            </div>
          )}

          {/* DIVISOR HISTORIAL */}
          <div className="history-divider">EXPEDIENTES DE ARENAS CONCLUIDAS</div>

          {/* HISTORIAL */}
          <div className="arena-grid" style={{ opacity: 0.85 }}>
            {finalizedPartidos.map((p) => (
              <div key={p.id} className="history-card">
                <div className="match-header">{p.fase} • FINALIZADO</div>
                <div className="teams">
                  <div className="team"><img src={`https://flagcdn.com/w40/${p.bandera_local?.toLowerCase()}.png`} alt="" className="rounded" /><span>{p.equipo_local}</span></div>
                  <div className="score">{p.marcador_local} - {p.marcador_visitante}</div>
                  <div className="team justify-end"><span>{p.equipo_visitante}</span><img src={`https://flagcdn.com/w40/${p.bandera_visitante?.toLowerCase()}.png`} alt="" className="rounded" /></div>
                </div>
                <button 
                  onClick={() => reopenPartido(p.id)}
                  className="flex items-center justify-center gap-2 w-full mt-4 text-xs font-['Syncopate'] bg-transparent border border-[#00C853] text-[#00C853] hover:bg-[#00C853] hover:text-black py-3 rounded transition-colors"
                >
                  <Edit size={14} /> CORREGIR / REABRIR ARENA
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECRUITS */}
      {activeTab === 'recruits' && (
        <div className="section p-12 text-center">
          <Users size={60} className="mx-auto mb-6 text-[#00C853]" />
          <h2 className="font-['Syncopate'] text-3xl font-black mb-4">RECRUITS DATABASE</h2>
          <p className="text-gray-400">Módulo en desarrollo.</p>
        </div>
      )}

      {/* MODAL NEÓN */}
      <AnimatePresence>
        {showConfirmModal && pendingFinalization && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="modal-content">
              <div className="modal-title">CONFIRMACIÓN DE EJECUCIÓN</div>
              <div className="modal-score">
                {pendingFinalization.equipoLocal} <span className="text-[#00C853]">{pendingFinalization.local}</span> — 
                <span className="text-[#00C853]">{pendingFinalization.visitante}</span> {pendingFinalization.equipoVisitante}
              </div>
              <div className="modal-warning">
                ESTA ACCIÓN EJECUTARÁ EL DESTINO DE LOS RECLUTAS.<br/>
                ¿PROCEDER?
              </div>
              <div className="modal-buttons">
                <button className="modal-btn-cancel" onClick={() => { setShowConfirmModal(false); setPendingFinalization(null); }}>CANCELAR</button>
                <button className="modal-btn-confirm" onClick={confirmarFinalizacion}>CONFIRMAR EJECUCIÓN</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
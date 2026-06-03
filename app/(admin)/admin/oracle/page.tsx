"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Activity, AlertTriangle, TrendingUp, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
// ✅ CORRECCIÓN 1: Cliente centralizado — sin keys hardcodeadas
import { supabase } from '@/lib/supabase';

// ============================================================
// ✅ CORRECCIÓN 2: Bug crítico de React — useState NO puede
// estar dentro de un .map(). Se extrae a un componente propio.
// Antes crasheaba en producción silenciosamente.
// ============================================================
function MatchVault({
  match,
  isProcessing,
  onSentenciar,
}: {
  match: any;
  isProcessing: boolean;
  onSentenciar: (match: any, localScore: number, visitScore: number) => void;
}) {
  // ✅ useState aquí — en el componente correcto, no en el .map()
  const [localS, setLocalS] = useState(0);
  const [visitS, setVisitS] = useState(0);

  return (
    <motion.div
      key={match.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="match-vault"
    >
      <div className="match-meta">
        <span>ID: {match.id.slice(0, 8)}</span>
        <span className="match-tournament">{match.tournament_name}</span>
        <span>{new Date(match.match_date).toLocaleString('es-ES')}</span>
      </div>

      <div className="teams-arena">
        <div className="team-block">
          {match.home_flag && (
            <img
              src={`https://flagcdn.com/48x36/${match.home_flag?.toLowerCase()}.png`}
              alt={match.home_team}
              className="team-flag"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="team-name">{match.home_team}</div>
          <input
            type="number"
            min={0}
            max={20}
            className="score-input"
            value={localS}
            onChange={e => setLocalS(Math.max(0, Number(e.target.value)))}
          />
        </div>

        <div className="vs-indicator">VS</div>

        <div className="team-block">
          {match.away_flag && (
            <img
              src={`https://flagcdn.com/48x36/${match.away_flag?.toLowerCase()}.png`}
              alt={match.away_team}
              className="team-flag"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="team-name">{match.away_team}</div>
          <input
            type="number"
            min={0}
            max={20}
            className="score-input"
            value={visitS}
            onChange={e => setVisitS(Math.max(0, Number(e.target.value)))}
          />
        </div>
      </div>

      <button
        className="execute-btn"
        disabled={isProcessing}
        onClick={() => onSentenciar(match, localS, visitS)}
      >
        {isProcessing
          ? <Activity className="animate-spin" size={20} />
          : <><Skull size={20} /> DICTAR SENTENCIA FINAL</>
        }
      </button>

      <div className="meta-info">
        ADVERTENCIA: LA DISTRIBUCION DE CAPITAL ES IRREVERSIBLE
      </div>
    </motion.div>
  );
}

// ============================================================
// ✅ COMPONENTE PRINCIPAL — OracleEngine
// ============================================================
export default function OracleEngine() {
  const router = useRouter();
  const [matches, setMatches]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [lastResult, setLastResult]     = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    // ✅ CORRECCIÓN 3: Tabla correcta — matches (no partidos)
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .neq('status', 'FINALIZADO')
      .order('match_date', { ascending: true });

    if (error) console.error('Error cargando partidos:', error.message);
    if (data) setMatches(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const sentenciarPartido = async (
    match: any,
    localScore: number,
    visitScore: number
  ) => {
    const confirmMsg = `¿Confirmar resultado?\n\n${match.home_team} ${localScore} — ${visitScore} ${match.away_team}\n\nEsta accion evaluara todas las predicciones y ajustara vidas.`;
    if (!confirm(confirmMsg)) return;

    setProcessingId(match.id);
    let ganaron = 0;
    let perdieron = 0;

    try {
      // ✅ CORRECCIÓN 4: Tabla correcta — predictions (no predicciones)
      const { data: predictions } = await supabase
        .from('predictions')
        .select('*')
        .eq('match_id', match.id);

      if (predictions && predictions.length > 0) {
        // Determinar resultado del partido
        const resultado = localScore > visitScore ? 'LOCAL'
          : visitScore > localScore ? 'VISITANTE'
          : 'EMPATE';

        for (const pred of predictions) {
          // Verificar si las respuestas del jugador aciertan
          // answers es un JSON con { questionId: optionId }
          const answers = pred.answers || {};
          const marketsCount = Object.keys(answers).length;

          // Lógica simplificada: verificar respuesta del mercado 1X2
          // En la Fase 2 esto se expande con todos los mercados
          let isCorrect = false;
          if (answers['q1']) {
            isCorrect = answers['q1'] === resultado;
          }

          // ✅ CORRECCIÓN 5: Tabla correcta — profiles (no perfiles)
          const { data: profile } = await supabase
            .from('profiles')
            .select('pitchx_balance, lives, streak, best_streak, status')
            .eq('id', pred.user_id)
            .single();

          if (profile) {
            if (isCorrect) {
              ganaron++;
              const newStreak     = (profile.streak || 0) + 1;
              const newBestStreak = Math.max(newStreak, profile.best_streak || 0);
              // Bonus: cada 5 aciertos consecutivos = +1 vida gratis
              const bonusLife     = newStreak % 5 === 0 ? 1 : 0;

              await supabase.from('profiles').update({
                streak:       newStreak,
                best_streak:  newBestStreak,
                lives:        (profile.lives || 0) + bonusLife,
              }).eq('id', pred.user_id);

              // Marcar predicción como correcta
              await supabase.from('predictions').update({
                is_correct:    true,
                points_earned: 10 * marketsCount,
                evaluated_at:  new Date().toISOString(),
              }).eq('id', pred.id);

            } else {
              perdieron++;
              const newLives  = Math.max(0, (profile.lives || 0) - 1);
              const newStatus = newLives === 0 ? 'COMA' : 'VIVO';
              // Si entra en coma: 12 horas para revivir
              const comaUntil = newLives === 0
                ? new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
                : null;

              await supabase.from('profiles').update({
                streak:     0,
                lives:      newLives,
                status:     newStatus,
                coma_until: comaUntil,
              }).eq('id', pred.user_id);

              // Marcar predicción como incorrecta
              await supabase.from('predictions').update({
                is_correct:    false,
                points_earned: 0,
                evaluated_at:  new Date().toISOString(),
              }).eq('id', pred.id);
            }
          }
        }
      }

      // Cerrar partido con resultado final
      await supabase.from('matches').update({
        status:     'FINALIZADO',
        result:     localScore > visitScore ? 'LOCAL' : visitScore > localScore ? 'VISITANTE' : 'EMPATE',
        home_score: localScore,
        away_score: visitScore,
      }).eq('id', match.id);

      setLastResult(`✅ ${match.home_team} ${localScore}–${visitScore} ${match.away_team} | ${ganaron} acertaron | ${perdieron} perdieron vida`);
      await fetchMatches();

    } catch (e: any) {
      console.error('Error al sentenciar:', e);
      setLastResult(`❌ Error: ${e.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="oracle-terminal">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700;900&family=Space+Grotesk:wght@300;500;700;900&display=swap');

        .oracle-terminal {
          background: #000; min-height: 100vh; color: white; padding: 40px 8vw;
          font-family: 'Space Grotesk', sans-serif; position: relative; overflow-x: hidden;
        }
        .radar-vfx {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: radial-gradient(circle at 50% 50%, rgba(0,200,83,0.05) 0%, transparent 80%);
        }
        .grid-perspective {
          position: fixed; inset: 0; z-index: 1; opacity: 0.1;
          background-image: linear-gradient(#00C853 1px, transparent 1px), linear-gradient(90deg, #00C853 1px, transparent 1px);
          background-size: 50px 50px; transform: perspective(1000px) rotateX(65deg) translateY(-100px);
          animation: grid-move 20s linear infinite;
        }
        @keyframes grid-move { from { background-position: 0 0; } to { background-position: 0 100%; } }

        .oracle-nav {
          position: relative; z-index: 10; display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 60px;
        }
        .btn-back {
          display: flex; align-items: center; gap: 8px;
          background: transparent; border: 1px solid #333; color: #666;
          padding: 10px 20px; font-family: 'Syncopate'; font-size: 9px;
          cursor: pointer; transition: 0.3s; letter-spacing: 2px;
        }
        .btn-back:hover { border-color: #00C853; color: #00C853; }

        .header-command {
          position: relative; z-index: 10; margin-bottom: 40px;
          display: flex; justify-content: space-between; align-items: flex-start;
        }
        .status-tag {
          font-family: 'Syncopate'; font-size: 10px; color: #00C853;
          letter-spacing: 8px; border-left: 5px solid #00C853; padding-left: 20px;
          margin-bottom: 10px; display: block;
        }
        .main-brand h1 {
          font-family: 'Syncopate'; font-size: clamp(36px, 6vw, 60px); font-weight: 900; letter-spacing: -4px;
          background: linear-gradient(to bottom, #fff, #00C853);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .last-result {
          position: relative; z-index: 10; margin-bottom: 30px;
          background: rgba(0,200,83,0.1); border: 1px solid rgba(0,200,83,0.3);
          padding: 15px 20px; font-family: 'Syncopate'; font-size: 10px;
          color: #00C853; letter-spacing: 2px;
        }

        .execution-grid {
          position: relative; z-index: 10;
          display: grid; grid-template-columns: repeat(auto-fill, minmax(460px, 1fr)); gap: 30px;
        }
        .match-vault {
          background: rgba(10,10,10,0.85); border: 1px solid rgba(255,255,255,0.05);
          padding: 40px; border-radius: 4px; backdrop-filter: blur(20px);
          position: relative; transition: 0.4s;
        }
        .match-vault:hover { border-color: #FF0033; box-shadow: 0 0 40px rgba(255,0,51,0.1); transform: translateY(-5px); }

        .match-meta {
          display: flex; justify-content: space-between; align-items: center;
          opacity: 0.3; font-family: 'Syncopate'; font-size: 9px; letter-spacing: 2px; margin-bottom: 10px;
        }
        .match-tournament { color: #00C853; opacity: 1; }

        .teams-arena { display: flex; justify-content: space-between; align-items: center; margin: 30px 0; }
        .team-block { text-align: center; width: 40%; }
        .team-flag { width: 48px; height: 36px; object-fit: cover; margin: 0 auto 10px; display: block; border-radius: 3px; }
        .team-name { font-family: 'Syncopate'; font-weight: 900; font-size: 16px; color: #fff; margin-bottom: 15px; }
        .score-input {
          background: #000 !important; color: #fff !important; border: 1px solid #222 !important;
          width: 80px; height: 80px; text-align: center; font-size: 32px; font-weight: 900;
          font-family: 'Syncopate'; border-radius: 4px; outline: none; transition: 0.3s;
        }
        .score-input:focus { border-color: #00C853 !important; box-shadow: 0 0 20px rgba(0,200,83,0.3) !important; }
        .vs-indicator { font-family: 'Syncopate'; font-size: 12px; color: #333; font-weight: 900; }

        .execute-btn {
          width: 100%; background: #FF0033; color: #fff; border: none; padding: 25px;
          font-family: 'Syncopate'; font-weight: 900; font-size: 11px; cursor: pointer;
          border-radius: 2px; display: flex; align-items: center; justify-content: center;
          gap: 15px; transition: 0.3s; letter-spacing: 3px;
        }
        .execute-btn:hover { background: #fff; color: #000; box-shadow: 0 0 50px rgba(255,255,255,0.3); }
        .execute-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .meta-info { font-size: 10px; font-family: 'Syncopate'; color: #444; letter-spacing: 2px; margin-top: 20px; text-align: center; }

        .empty-state {
          grid-column: 1/-1; text-align: center; padding: 100px 40px;
          border: 1px dashed #222; color: #444; font-family: 'Syncopate'; font-size: 12px; letter-spacing: 5px;
        }
        @media (max-width: 600px) { .execution-grid { grid-template-columns: 1fr; } }
      `}} />

      <div className="radar-vfx" />
      <div className="grid-perspective" />

      {/* NAVEGACIÓN */}
      <nav className="oracle-nav">
        <button className="btn-back" onClick={() => router.push('/admin')}>
          <ChevronLeft size={14} /> PANEL ADMIN
        </button>
        <Activity className="animate-pulse" size={24} color="#00C853" />
      </nav>

      {/* HEADER */}
      <header className="header-command">
        <div className="main-brand">
          <span className="status-tag">SYSTEM_ORACLE_v3.0</span>
          <h1>ORACULO</h1>
        </div>
      </header>

      {/* ÚLTIMO RESULTADO */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="last-result"
          >
            {lastResult}
          </motion.div>
        )}
      </AnimatePresence>

      {/* GRID DE PARTIDOS */}
      <div className="execution-grid">
        {loading ? (
          <div className="empty-state">
            <TrendingUp className="animate-spin mx-auto mb-6" size={50} color="#00C853" />
            <p>SINCRONIZANDO PARTIDOS ABIERTOS...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="empty-state">
            <p>NO HAY PARTIDOS PENDIENTES DE SENTENCIA</p>
          </div>
        ) : (
          // ✅ CORRECCIÓN CRÍTICA: cada partido es su propio componente
          // Antes: useState dentro de .map() → crash en React
          // Ahora: componente MatchVault con su propio estado
          matches.map(match => (
            <MatchVault
              key={match.id}
              match={match}
              isProcessing={processingId === match.id}
              onSentenciar={sentenciarPartido}
            />
          ))
        )}
      </div>
    </div>
  );
}
"use client";
// ══════════════════════════════════════════════════════════════
//  JoinEventModal.tsx
//  FASE 9 — Modal de confirmación para unirse a un EventoJuego
//
//  UBICACIÓN: src/components/game/JoinEventModal.tsx
//
//  USO:
//    <JoinEventModal
//      evento={evento}           // objeto con id, name, costo_px, vidas_base, etc.
//      saldoActual={1000}        // pitchx_balance del jugador
//      onSuccess={(res) => {}}   // callback cuando se une correctamente
//      onClose={() => {}}        // callback para cerrar
//    />
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { X, Heart, Zap, Gift, AlertTriangle, CheckCircle, Loader2, ShoppingCart, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ── Tipos (alineados con schema Prisma / Supabase) ────────────
export interface EventoJuego {
  id: string;
  name?: string;           // Supabase: tournaments.name
  nombre?: string;         // Prisma: EventoJuego.nombre
  tipo_evento?: string;    // Supabase: tournaments.tipo_evento
  modalidad?: string;      // Prisma: EventoJuego.modalidad
  costo_px: number;
  vidas_base: number;
  vidas_bonus?: number;
  bonus_activo?: boolean;
  bonus_px?: number;
  bonus_descripcion?: string;
  bonus_expira_en?: string;
  premio_px?: number;
  premio_pitchx?: number;  // Prisma alias
  es_vip?: boolean;
  status?: string;         // Supabase
  estado?: string;         // Prisma
  fecha_inicio?: string;
  partido_cierre?: number;
}

export interface JoinEventModalProps {
  evento: EventoJuego;
  saldoActual: number;
  onSuccess: (resultado: JoinResult) => void;
  onClose: () => void;
}

export interface JoinResult {
  ok: boolean;
  vidas_asignadas: number;
  saldo_nuevo: number;
  mensaje: string;
  jugador_evento?: Record<string, unknown>;
}

// ── Helpers ───────────────────────────────────────────────────
const nombreEvento = (e: EventoJuego) => e.name ?? e.nombre ?? 'Evento';
const tipoEvento   = (e: EventoJuego) => (e.tipo_evento ?? e.modalidad ?? 'TORNEO').toUpperCase();
const premioEvento = (e: EventoJuego) => e.premio_px ?? e.premio_pitchx ?? 0;
const vidasBase    = (e: EventoJuego) => e.vidas_base ?? e.costo_px;
const vidasBonus   = (e: EventoJuego) => {
  if (!e.bonus_activo) return e.vidas_bonus ?? 0;
  return e.bonus_px ?? e.vidas_bonus ?? 0;
};
const vidasTotal   = (e: EventoJuego) => vidasBase(e) + vidasBonus(e);

const TIPO_COLOR: Record<string, string> = {
  TORNEO:    '#8dc63f',
  INDIVIDUAL: '#ef4444',
  COMBINADA:  '#38bdf8',
};
const TIPO_ICON: Record<string, string> = {
  TORNEO:    '🏆',
  INDIVIDUAL: '⚡',
  COMBINADA:  '🎯',
};

// ── Componente ────────────────────────────────────────────────
export default function JoinEventModal({
  evento,
  saldoActual,
  onSuccess,
  onClose,
}: JoinEventModalProps) {
  const router     = useRouter();
  const [step, setStep]         = useState<'confirm' | 'loading' | 'success' | 'error'>('confirm');
  const [errorMsg, setErrorMsg] = useState('');
  const [resultado, setResultado] = useState<JoinResult | null>(null);

  const tipo       = tipoEvento(evento);
  const color      = TIPO_COLOR[tipo] ?? '#8dc63f';
  const costo      = evento.costo_px ?? 0;
  const saldoNuevo = saldoActual - costo;
  const sinSaldo   = saldoActual < costo;
  const falta      = sinSaldo ? costo - saldoActual : 0;

  // Cerrar con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ── Acción principal ────────────────────────────────────────
  const handleUnirse = async () => {
    if (sinSaldo) { router.push('/recargar'); return; }
    setStep('loading');
    try {
      const res = await fetch('/api/juego/unirse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evento_juego_id: evento.id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? 'Error al procesar la solicitud');
        setStep('error');
        return;
      }
      const result: JoinResult = {
        ok:             true,
        vidas_asignadas: data.vidas_asignadas ?? vidasTotal(evento),
        saldo_nuevo:    data.saldo_nuevo     ?? saldoNuevo,
        mensaje:        data.mensaje         ?? `¡Inscrito en ${nombreEvento(evento)}!`,
        jugador_evento: data.jugador_evento,
      };
      setResultado(result);
      setStep('success');
      // Notificar al padre después de 1.5s para mostrar animación
      setTimeout(() => onSuccess(result), 1500);
    } catch {
      setErrorMsg('Error de conexión. Intenta nuevamente.');
      setStep('error');
    }
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500&display=swap');
        .jem-overlay{
          position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(4px);
          z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;
          animation:jemFadeIn .2s ease;
        }
        @keyframes jemFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes jemSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes jemPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        @keyframes jemSpin{to{transform:rotate(360deg)}}
        @keyframes jemBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .jem-modal{
          width:100%;max-width:420px;background:#0f1420;
          border:1px solid rgba(255,255,255,.08);border-radius:16px;
          overflow:hidden;animation:jemSlideUp .25s ease;position:relative;
          font-family:'Roboto',sans-serif;
        }
        .jem-header{
          padding:20px 20px 0;position:relative;
        }
        .jem-close{
          position:absolute;top:16px;right:16px;background:rgba(255,255,255,.06);
          border:none;border-radius:6px;color:rgba(255,255,255,.4);cursor:pointer;
          padding:6px;display:flex;transition:all .15s;
        }
        .jem-close:hover{background:rgba(255,255,255,.1);color:#fff;}
        .jem-tipo-badge{
          display:inline-flex;align-items:center;gap:5px;padding:4px 10px;
          border-radius:4px;font-family:'Oswald',sans-serif;font-size:10px;
          font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;
        }
        .jem-title{
          font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;
          color:#fff;line-height:1.2;margin-bottom:4px;padding-right:32px;
        }
        .jem-subtitle{
          font-size:12px;color:rgba(255,255,255,.35);margin-bottom:18px;
        }
        .jem-body{padding:0 20px 20px;}
        .jem-divider{height:1px;background:rgba(255,255,255,.06);margin:16px 0;}
        /* COSTO Y VIDAS */
        .jem-economía{
          background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);
          border-radius:10px;padding:14px;
        }
        .jem-row{
          display:flex;align-items:center;justify-content:space-between;
          padding:6px 0;font-size:13px;
        }
        .jem-row-label{color:rgba(255,255,255,.4);display:flex;align-items:center;gap:6px;}
        .jem-row-val{font-family:'Oswald',sans-serif;font-weight:700;font-size:14px;}
        .jem-row-sep{border-top:1px dashed rgba(255,255,255,.08);margin:6px 0;}
        .jem-total-row{
          display:flex;align-items:center;justify-content:space-between;
          padding-top:8px;margin-top:2px;
        }
        .jem-total-label{font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;color:rgba(255,255,255,.3);letter-spacing:1px;text-transform:uppercase;}
        .jem-total-val{font-family:'Oswald',sans-serif;font-size:24px;font-weight:700;}
        /* BONUS */
        .jem-bonus{
          background:rgba(141,198,63,.05);border:1px solid rgba(141,198,63,.2);
          border-radius:8px;padding:12px;margin-top:10px;
        }
        .jem-bonus-title{
          font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;
          color:#8dc63f;letter-spacing:1.5px;text-transform:uppercase;
          display:flex;align-items:center;gap:5px;margin-bottom:6px;
        }
        .jem-bonus-desc{font-size:12px;color:rgba(255,255,255,.6);line-height:1.5;}
        .jem-bonus-expira{font-size:10px;color:rgba(245,158,11,.6);margin-top:4px;display:flex;align-items:center;gap:4px;}
        /* SALDO INSUFICIENTE */
        .jem-insuf{
          background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);
          border-radius:8px;padding:12px;margin-top:10px;
        }
        .jem-insuf-title{
          font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;
          color:#ef4444;letter-spacing:1px;text-transform:uppercase;
          display:flex;align-items:center;gap:5px;margin-bottom:6px;
        }
        .jem-insuf-desc{font-size:12px;color:rgba(255,255,255,.5);line-height:1.5;}
        /* SALDO PREVIEW */
        .jem-saldo-preview{
          background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);
          border-radius:8px;padding:12px;margin-top:10px;
          display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;
        }
        .jem-saldo-item{text-align:center;}
        .jem-saldo-lbl{font-size:9px;color:rgba(255,255,255,.25);letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;}
        .jem-saldo-num{font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;}
        .jem-arrow{color:rgba(255,255,255,.2);font-size:16px;}
        /* BOTONES */
        .jem-footer{display:flex;gap:8px;padding:0 20px 20px;}
        .jem-btn{
          flex:1;padding:13px;border:none;border-radius:8px;
          font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;
          letter-spacing:.5px;cursor:pointer;transition:all .2s;
          display:flex;align-items:center;justify-content:center;gap:6px;
        }
        .jem-btn-cancel{
          background:rgba(255,255,255,.06);color:rgba(255,255,255,.4);
        }
        .jem-btn-cancel:hover{background:rgba(255,255,255,.1);color:#fff;}
        .jem-btn-confirm{
          background:var(--jem-color,#8dc63f);color:#0a0d14;
        }
        .jem-btn-confirm:hover{filter:brightness(1.1);}
        .jem-btn-confirm:disabled{opacity:.5;cursor:not-allowed;filter:none;}
        .jem-btn-recarga{
          background:rgba(245,158,11,.12);color:#f59e0b;
          border:1px solid rgba(245,158,11,.25);
        }
        .jem-btn-recarga:hover{background:#f59e0b;color:#0a0d14;}
        /* STATES */
        .jem-state{
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          padding:40px 20px;text-align:center;
        }
        .jem-spin{animation:jemSpin .8s linear infinite;}
        .jem-bounce{animation:jemBounce 1s ease infinite;}
        .jem-state-title{
          font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;
          color:#fff;margin-top:14px;margin-bottom:6px;
        }
        .jem-state-sub{font-size:13px;color:rgba(255,255,255,.4);line-height:1.5;}
        .jem-vidas-big{
          font-family:'Oswald',sans-serif;font-size:36px;font-weight:700;
          color:#8dc63f;display:flex;align-items:center;gap:8px;margin-top:8px;
        }
      `}</style>

      <div className="jem-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="jem-modal" style={{ '--jem-color': color } as React.CSSProperties}>

          {/* ── LOADING ── */}
          {step === 'loading' && (
            <div className="jem-state">
              <Loader2 size={40} className="jem-spin" style={{ color }} />
              <div className="jem-state-title">Procesando...</div>
              <div className="jem-state-sub">Descontando PX y asignando tus vidas</div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === 'success' && resultado && (
            <div className="jem-state">
              <CheckCircle size={48} className="jem-bounce" style={{ color: '#8dc63f' }} />
              <div className="jem-state-title">¡Inscripción exitosa!</div>
              <div className="jem-state-sub">{resultado.mensaje}</div>
              <div className="jem-vidas-big">
                <Heart size={30} fill="#8dc63f" />
                {resultado.vidas_asignadas} vidas
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', marginTop: 8 }}>
                Saldo restante: <span style={{ color: '#38bdf8', fontWeight: 700 }}>{resultado.saldo_nuevo} PX</span>
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {step === 'error' && (
            <div className="jem-state">
              <AlertTriangle size={40} style={{ color: '#ef4444' }} />
              <div className="jem-state-title">Error</div>
              <div className="jem-state-sub">{errorMsg}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button className="jem-btn jem-btn-cancel" onClick={onClose}>Cerrar</button>
                <button className="jem-btn jem-btn-confirm" onClick={() => setStep('confirm')}>Reintentar</button>
              </div>
            </div>
          )}

          {/* ── CONFIRM ── */}
          {step === 'confirm' && (
            <>
              <div className="jem-header">
                <button className="jem-close" onClick={onClose}><X size={14} /></button>
                <div
                  className="jem-tipo-badge"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                >
                  {TIPO_ICON[tipo] ?? '🎮'} {tipo}
                </div>
                <div className="jem-title">{nombreEvento(evento)}</div>
                {premioEvento(evento) > 0 && (
                  <div className="jem-subtitle">
                    Premio total: <strong style={{ color: '#a855f7' }}>{premioEvento(evento).toLocaleString()} PX</strong>
                  </div>
                )}
              </div>

              <div className="jem-body">
                {/* Economía */}
                <div className="jem-economía">
                  <div className="jem-row">
                    <span className="jem-row-label">
                      <ShoppingCart size={13} style={{ color }} /> Costo de entrada
                    </span>
                    <span className="jem-row-val" style={{ color }}>
                      {costo} PX
                    </span>
                  </div>

                  <div className="jem-row">
                    <span className="jem-row-label">
                      <Heart size={13} style={{ color: '#8dc63f' }} /> Vidas base
                    </span>
                    <span className="jem-row-val" style={{ color: '#fff' }}>
                      {vidasBase(evento)} ❤️
                    </span>
                  </div>

                  {vidasBonus(evento) > 0 && (
                    <div className="jem-row">
                      <span className="jem-row-label">
                        <Gift size={13} style={{ color: '#f59e0b' }} /> Vidas bonus
                      </span>
                      <span className="jem-row-val" style={{ color: '#f59e0b' }}>
                        +{vidasBonus(evento)} 🎁
                      </span>
                    </div>
                  )}

                  {premioEvento(evento) > 0 && (
                    <div className="jem-row">
                      <span className="jem-row-label">
                        <TrendingUp size={13} style={{ color: '#a855f7' }} /> Premio si ganas
                      </span>
                      <span className="jem-row-val" style={{ color: '#a855f7' }}>
                        {premioEvento(evento).toLocaleString()} PX
                      </span>
                    </div>
                  )}

                  <div className="jem-row-sep" />

                  <div className="jem-total-row">
                    <span className="jem-total-label">Total vidas</span>
                    <span className="jem-total-val" style={{ color }}>
                      {vidasTotal(evento)} ❤️
                    </span>
                  </div>
                </div>

                {/* Bonus activo */}
                {evento.bonus_activo && vidasBonus(evento) > 0 && (
                  <div className="jem-bonus">
                    <div className="jem-bonus-title">
                      <Gift size={11} /> Bonus activo
                    </div>
                    <div className="jem-bonus-desc">
                      {evento.bonus_descripcion ?? `Recibes ${vidasBonus(evento)} vidas extra de regalo`}
                    </div>
                    {evento.bonus_expira_en && (
                      <div className="jem-bonus-expira">
                        ⏱ Válido hasta:{' '}
                        {new Date(evento.bonus_expira_en).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'long', year: 'numeric',
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Saldo insuficiente */}
                {sinSaldo && (
                  <div className="jem-insuf">
                    <div className="jem-insuf-title">
                      <AlertTriangle size={12} /> Saldo insuficiente
                    </div>
                    <div className="jem-insuf-desc">
                      Necesitas <strong style={{ color: '#ef4444' }}>{costo} PX</strong> para entrar.
                      Te faltan <strong style={{ color: '#f59e0b' }}>{falta} PX</strong>.
                    </div>
                  </div>
                )}

                {/* Preview saldo */}
                {!sinSaldo && (
                  <div className="jem-saldo-preview">
                    <div className="jem-saldo-item">
                      <div className="jem-saldo-lbl">Saldo actual</div>
                      <div className="jem-saldo-num" style={{ color: '#38bdf8' }}>{saldoActual} PX</div>
                    </div>
                    <span className="jem-arrow">→</span>
                    <div className="jem-saldo-item">
                      <div className="jem-saldo-lbl">Costo</div>
                      <div className="jem-saldo-num" style={{ color: '#ef4444' }}>-{costo} PX</div>
                    </div>
                    <span className="jem-arrow">→</span>
                    <div className="jem-saldo-item">
                      <div className="jem-saldo-lbl">Saldo nuevo</div>
                      <div className="jem-saldo-num" style={{ color: saldoNuevo > 0 ? '#8dc63f' : '#f59e0b' }}>
                        {saldoNuevo} PX
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="jem-footer">
                <button className="jem-btn jem-btn-cancel" onClick={onClose}>
                  Cancelar
                </button>
                {sinSaldo ? (
                  <button className="jem-btn jem-btn-recarga" onClick={() => router.push('/recargar')}>
                    <Zap size={14} /> Recargar PX
                  </button>
                ) : (
                  <button
                    className="jem-btn jem-btn-confirm"
                    onClick={handleUnirse}
                    style={{ background: color }}
                  >
                    <Heart size={14} fill="currentColor" />
                    Confirmar — {costo} PX
                  </button>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
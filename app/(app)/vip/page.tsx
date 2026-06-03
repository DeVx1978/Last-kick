"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Star, Trophy, Heart, CheckCircle,
  Loader2, ArrowLeft, Clock, Target,
  ChevronRight, Zap, Calendar, Users, Lock
} from "lucide-react";

interface EventoVip {
  id: string;
  name: string;
  slug: string;
  status: string;
  costo_px: number;
  premio_px: number;
  vip_costo_entrada: number;
  vip_limite_jugadores: number;
  vip_acceso: string;
  vip_descripcion: string;
  vip_premio_garantizado: number;
  vip_max_ganadores: number;
  vip_cuotas_activas: boolean;
  fecha_inicio: string;
  descripcion: string;
  inscrito?: boolean;
  participantes?: number;
}

interface Perfil {
  id: string;
  pitchx_balance: number;
}

export default function VipPage() {
  const router = useRouter();
  const [eventos,      setEventos]      = useState<EventoVip[]>([]);
  const [perfil,       setPerfil]       = useState<Perfil | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [inscribiendo, setInscribiendo] = useState<string | null>(null);
  const [toast,        setToast]        = useState<{msg:string;type:"ok"|"err"|"warn"}|null>(null);

  const showToast = (msg: string, type: "ok"|"err"|"warn" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: p } = await supabase
        .from("profiles").select("id, pitchx_balance")
        .eq("id", user.id).maybeSingle();
      if (p) setPerfil({ id: p.id, pitchx_balance: p.pitchx_balance ?? 0 });

      // Eventos VIP = tournaments donde es_vip = true
      const { data: evs } = await supabase
        .from("tournaments").select("*")
        .eq("es_vip", true)
        .in("status", ["ACTIVO", "PROXIMO"])
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!evs || evs.length === 0) {
        setEventos([]); setLoading(false); return;
      }

      const torneoIds = evs.map((e: any) => e.id);

      // Verificar inscripciones
      const { data: entradas } = await supabase
        .from("tournament_entries").select("tournament_id")
        .eq("user_id", user.id)
        .in("tournament_id", torneoIds);
      const inscritosIds = new Set((entradas || []).map((e: any) => e.tournament_id));

      // Contar participantes
      const enriquecidos = await Promise.all(evs.map(async (ev: any) => {
        const { count } = await supabase
          .from("tournament_entries")
          .select("*", { count: "exact", head: true })
          .eq("tournament_id", ev.id);

        return {
          id:                    ev.id,
          name:                  ev.name,
          slug:                  ev.slug,
          status:                ev.status,
          costo_px:              ev.costo_px ?? 0,
          premio_px:             ev.premio_px ?? 0,
          vip_costo_entrada:     ev.vip_costo_entrada ?? ev.costo_px ?? 0,
          vip_limite_jugadores:  ev.vip_limite_jugadores ?? 0,
          vip_acceso:            ev.vip_acceso ?? "TODOS",
          vip_descripcion:       ev.vip_descripcion ?? "",
          vip_premio_garantizado:ev.vip_premio_garantizado ?? 0,
          vip_max_ganadores:     ev.vip_max_ganadores ?? 1,
          vip_cuotas_activas:    ev.vip_cuotas_activas ?? false,
          fecha_inicio:          ev.fecha_inicio ?? "",
          descripcion:           ev.descripcion ?? "",
          inscrito:              inscritosIds.has(ev.id),
          participantes:         count ?? 0,
        };
      }));

      setEventos(enriquecidos);
    } catch (err) {
      console.error("[VipPage]", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { cargar(); }, [cargar]);

  const inscribirse = async (evento: EventoVip) => {
    if (!perfil) return;
    const saldo = perfil.pitchx_balance ?? 0;
    const costo = evento.vip_costo_entrada || evento.costo_px;

    if (saldo < costo) {
      showToast(`Necesitas ${costo} PX. Tu saldo: ${saldo} PX`, "warn");
      return;
    }

    // Verificar límite de jugadores
    if (evento.vip_limite_jugadores > 0 && (evento.participantes ?? 0) >= evento.vip_limite_jugadores) {
      showToast("Este evento VIP está lleno", "err");
      return;
    }

    setInscribiendo(evento.id);
    try {
      if (costo > 0) {
        const { error } = await supabase
          .from("profiles")
          .update({ pitchx_balance: saldo - costo })
          .eq("id", perfil.id);
        if (error) throw error;
      }

      const { error: entradaError } = await supabase
        .from("tournament_entries").insert({
          user_id:         perfil.id,
          tournament_id:   evento.id,
          vidas:           1,
          vidas_iniciales: 1,
          status:          "ACTIVO",
          nivel_ingreso:   8,
          fecha_ingreso:   new Date().toISOString(),
        });

      if (entradaError) {
        await supabase.from("profiles").update({ pitchx_balance: saldo }).eq("id", perfil.id);
        throw entradaError;
      }

      setPerfil(prev => prev ? { ...prev, pitchx_balance: saldo - costo } : null);
      showToast(`¡Inscrito en ${evento.name}!`, "ok");
      setTimeout(() => router.push(`/campo-de-batalla/${evento.slug}`), 1000);
    } catch (err: any) {
      showToast(err.message ?? "Error al inscribirse", "err");
    } finally {
      setInscribiendo(null);
    }
  };

  const fmtFecha = (f: string) => new Date(f).toLocaleDateString("es-CO", { day:"2-digit", month:"short", year:"numeric" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0a0d14;color:#fff;font-family:'Roboto',sans-serif;}
        .vw{min-height:100vh;background:#0a0d14;}
        .vh{background:#0f1420;border-bottom:1px solid rgba(168,85,247,.15);padding:0 20px;height:56px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:100;}
        .vh-back{background:none;border:none;color:rgba(255,255,255,.4);cursor:pointer;padding:6px;display:flex;border-radius:6px;transition:all .15s;}
        .vh-back:hover{background:rgba(255,255,255,.08);color:#fff;}
        .vh-title{font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;color:#fff;}
        .vh-badge{font-family:'Oswald',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;color:#a855f7;background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.2);border-radius:3px;padding:2px 6px;text-transform:uppercase;}
        .vh-saldo{margin-left:auto;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;color:#38bdf8;}
        .vb{padding:20px;max-width:700px;margin:0 auto;}
        .vip-banner{background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.2);border-radius:10px;padding:16px;margin-bottom:20px;display:flex;gap:12px;align-items:flex-start;}
        .vip-banner-t{font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;color:#a855f7;margin-bottom:4px;}
        .vip-banner-s{font-size:12px;color:rgba(255,255,255,.4);line-height:1.6;}
        .vip-card{background:#111827;border:1px solid rgba(168,85,247,.2);border-radius:12px;overflow:hidden;margin-bottom:16px;transition:border-color .2s;}
        .vip-card:hover{border-color:rgba(168,85,247,.4);}
        .vip-top{padding:16px;background:rgba(168,85,247,.04);border-bottom:1px solid rgba(168,85,247,.1);}
        .vip-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;}
        .vip-badge{font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;color:#a855f7;display:flex;align-items:center;gap:5px;}
        .vip-nombre{font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;color:#fff;margin-bottom:6px;}
        .vip-desc{font-size:12px;color:rgba(168,85,247,.7);margin-bottom:10px;line-height:1.5;}
        .vip-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:14px 16px;background:rgba(255,255,255,.02);border-bottom:1px solid rgba(168,85,247,.1);}
        .vip-stat{text-align:center;padding:8px;}
        .vip-stat-v{font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;color:#a855f7;}
        .vip-stat-l{font-size:9px;color:rgba(255,255,255,.25);letter-spacing:1px;text-transform:uppercase;margin-top:2px;}
        .vip-footer{padding:12px 16px;background:rgba(255,255,255,.02);border-top:1px solid rgba(168,85,247,.1);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
        .vip-btn{padding:10px 20px;border:none;border-radius:7px;font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;letter-spacing:.5px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:5px;}
        .vip-btn-join{background:#a855f7;color:#fff;}.vip-btn-join:hover{background:#9333ea;}
        .vip-btn-join:disabled{opacity:.5;cursor:not-allowed;}
        .vip-btn-inscrito{background:rgba(141,198,63,.1);color:#8dc63f;border:1px solid rgba(141,198,63,.2);}
        .vip-btn-saldo{background:rgba(245,158,11,.1);color:#f59e0b;border:1px solid rgba(245,158,11,.2);}
        .vip-btn-lleno{background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.2);cursor:not-allowed;}
        .empty{text-align:center;padding:60px 20px;}
        .empty svg{color:rgba(255,255,255,.08);margin:0 auto 12px;display:block;}
        .empty-t{font-family:'Oswald',sans-serif;font-size:15px;color:rgba(255,255,255,.2);}
        .empty-s{font-size:12px;color:rgba(255,255,255,.1);margin-top:6px;}
        .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:8px;font-size:13px;font-weight:500;z-index:999;white-space:nowrap;}
        .toast.ok{background:#8dc63f;color:#0a0d14;}
        .toast.err{background:#ef4444;color:#fff;}
        .toast.warn{background:#f59e0b;color:#0a0d14;}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="vw">
        <header className="vh">
          <button className="vh-back" onClick={() => router.push("/radar")}><ArrowLeft size={16}/></button>
          <div className="vh-title">Eventos VIP</div>
          <span className="vh-badge">⭐ Exclusivo</span>
          {perfil && <span className="vh-saldo">{(perfil.pitchx_balance ?? 0).toLocaleString()} PX</span>}
        </header>

        <div className="vb">
          <div className="vip-banner">
            <Star size={18} style={{ color:"#a855f7",flexShrink:0,marginTop:2 }}/>
            <div>
              <div className="vip-banner-t">Eventos exclusivos VIP</div>
              <div className="vip-banner-s">
                Acceso limitado · Premios garantizados · Máxima emoción<br/>
                Inscríbete y demuestra que eres el mejor predictor.
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display:"flex",justifyContent:"center",padding:60 }}>
              <Loader2 size={28} style={{ color:"#a855f7",animation:"spin 1s linear infinite" }}/>
            </div>
          ) : eventos.length === 0 ? (
            <div className="empty">
              <Star size={40}/>
              <div className="empty-t">Sin eventos VIP disponibles</div>
              <div className="empty-s">Los eventos VIP aparecerán aquí cuando estén activos</div>
            </div>
          ) : (
            eventos.map(ev => {
              const saldo = perfil?.pitchx_balance ?? 0;
              const costo = ev.vip_costo_entrada || ev.costo_px;
              const sinSaldo = saldo < costo;
              const lleno = ev.vip_limite_jugadores > 0 && (ev.participantes ?? 0) >= ev.vip_limite_jugadores;

              return (
                <div key={ev.id} className="vip-card">
                  <div className="vip-top">
                    <div className="vip-head">
                      <div className="vip-badge">
                        <Star size={12} fill="currentColor"/> VIP EXCLUSIVO
                      </div>
                      <div style={{ fontFamily:"'Oswald',sans-serif",fontSize:22,fontWeight:700,color:"#a855f7" }}>
                        {(ev.vip_premio_garantizado || ev.premio_px || 0).toLocaleString()} PX
                      </div>
                    </div>
                    <div className="vip-nombre">{ev.name}</div>
                    {ev.vip_descripcion && <div className="vip-desc">⭐ {ev.vip_descripcion}</div>}
                    {ev.descripcion && !ev.vip_descripcion && <div className="vip-desc">{ev.descripcion}</div>}
                    <div style={{ display:"flex",gap:12,flexWrap:"wrap",fontSize:11,color:"rgba(255,255,255,.4)" }}>
                      {ev.fecha_inicio && (
                        <span style={{ display:"flex",alignItems:"center",gap:4 }}>
                          <Calendar size={11}/>{fmtFecha(ev.fecha_inicio)}
                        </span>
                      )}
                      <span style={{ display:"flex",alignItems:"center",gap:4 }}>
                        <Target size={11}/>Acceso: <strong style={{color:"#fff",marginLeft:3}}>{ev.vip_acceso}</strong>
                      </span>
                      <span style={{ display:"flex",alignItems:"center",gap:4 }}>
                        <Trophy size={11}/>Top <strong style={{color:"#a855f7",marginLeft:3}}>{ev.vip_max_ganadores}</strong> ganadores
                      </span>
                    </div>
                  </div>

                  <div className="vip-stats">
                    <div className="vip-stat">
                      <div className="vip-stat-v">{costo} PX</div>
                      <div className="vip-stat-l">Entrada</div>
                    </div>
                    <div className="vip-stat">
                      <div className="vip-stat-v">{ev.participantes}</div>
                      <div className="vip-stat-l">
                        {ev.vip_limite_jugadores > 0 ? `/ ${ev.vip_limite_jugadores}` : 'Inscritos'}
                      </div>
                    </div>
                    <div className="vip-stat">
                      <div className="vip-stat-v" style={{color: lleno ? '#ef4444' : '#8dc63f'}}>
                        {lleno ? 'LLENO' : 'ABIERTO'}
                      </div>
                      <div className="vip-stat-l">Estado</div>
                    </div>
                  </div>

                  <div className="vip-footer">
                    <div style={{ fontSize:11,color:"rgba(255,255,255,.25)" }}>
                      Tu saldo: <span style={{ color:"#38bdf8",fontWeight:700 }}>{saldo} PX</span>
                    </div>
                    {ev.inscrito ? (
                      <button className="vip-btn vip-btn-inscrito"
                        onClick={() => router.push(`/campo-de-batalla/${ev.slug}`)}>
                        <ChevronRight size={12}/> Inscrito — Jugar ahora
                      </button>
                    ) : lleno ? (
                      <button className="vip-btn vip-btn-lleno" disabled>
                        <Lock size={12}/> Evento lleno
                      </button>
                    ) : sinSaldo ? (
                      <button className="vip-btn vip-btn-saldo" onClick={() => router.push("/radar")}>
                        <Zap size={12}/> Recargar PX
                      </button>
                    ) : (
                      <button
                        className="vip-btn vip-btn-join"
                        onClick={() => inscribirse(ev)}
                        disabled={inscribiendo === ev.id}>
                        {inscribiendo === ev.id
                          ? <><Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/> Procesando...</>
                          : <><Star size={12} fill="currentColor"/> Inscribirse — {costo} PX</>
                        }
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
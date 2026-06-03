"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Trophy, Target, Zap, Heart, CheckCircle,
  Loader2, ArrowLeft, Star, Calendar, Clock, Users
} from "lucide-react";

interface PartidoCombinada {
  orden: number;
  partido_id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  cuota_1?: number;
  cuota_x?: number;
  cuota_2?: number;
}

interface Combinada {
  id: string;
  name: string;
  slug: string;
  tipo_evento: string;
  status: string;
  costo_px: number;
  premio_px: number;
  fecha_inicio: string;
  descripcion: string;
  partidos_combinada: PartidoCombinada[];
  inscrito?: boolean;
  participantes?: number;
}

interface Perfil {
  id: string;
  pitchx_balance: number;
}

const TIPO_CONFIG: Record<string, { color: string; icon: string; descripcion: string }> = {
  DOBLE:    { color:"#8dc63f", icon:"⚡", descripcion:"Acierta 2 partidos" },
  TRIPLE:   { color:"#f59e0b", icon:"🔥", descripcion:"Acierta 3 partidos" },
  BASICA:   { color:"#38bdf8", icon:"🎯", descripcion:"Acierta 4 partidos" },
  ELITE:    { color:"#a855f7", icon:"👑", descripcion:"Acierta todos" },
  COMBINADA:{ color:"#f59e0b", icon:"🎯", descripcion:"Acierta todos los partidos" },
};

export default function CombinadasPage() {
  const router = useRouter();
  const [combinadas,   setCombinadas]   = useState<Combinada[]>([]);
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

      // Combinadas = tournaments donde tipo_evento = 'COMBINADA' y status ACTIVO
      const { data: combs } = await supabase
        .from("tournaments")
        .select("*")
        .eq("tipo_evento", "COMBINADA")
        .in("status", ["ACTIVO", "PROXIMO"])
        .order("fecha_inicio", { ascending: true });

      if (!combs || combs.length === 0) {
        setCombinadas([]); setLoading(false); return;
      }

      // Verificar inscripciones del usuario
      const torneoIds = combs.map((c: any) => c.id);
      const { data: entradas } = await supabase
        .from("tournament_entries")
        .select("tournament_id")
        .eq("user_id", user.id)
        .in("tournament_id", torneoIds);
      const inscritosIds = new Set((entradas || []).map((e: any) => e.tournament_id));

      // Contar participantes
      const enriquecidas = await Promise.all(combs.map(async (c: any) => {
        const { count } = await supabase
          .from("tournament_entries")
          .select("*", { count: "exact", head: true })
          .eq("tournament_id", c.id);

        return {
          id:                  c.id,
          name:                c.name,
          slug:                c.slug,
          tipo_evento:         c.tipo_evento,
          status:              c.status,
          costo_px:            c.costo_px ?? 0,
          premio_px:           c.premio_px ?? 0,
          fecha_inicio:        c.fecha_inicio ?? "",
          descripcion:         c.descripcion ?? "",
          partidos_combinada:  Array.isArray(c.partidos_combinada) ? c.partidos_combinada : [],
          inscrito:            inscritosIds.has(c.id),
          participantes:       count ?? 0,
        };
      }));

      setCombinadas(enriquecidas);
    } catch (err) {
      console.error("[CombinadasPage]", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { cargar(); }, [cargar]);

  const inscribirse = async (combinada: Combinada) => {
    if (!perfil) return;
    const saldo = perfil.pitchx_balance ?? 0;
    if (saldo < combinada.costo_px) {
      showToast(`Necesitas ${combinada.costo_px} PX. Tu saldo: ${saldo} PX`, "warn");
      return;
    }
    setInscribiendo(combinada.id);
    try {
      if (combinada.costo_px > 0) {
        const { error } = await supabase
          .from("profiles")
          .update({ pitchx_balance: saldo - combinada.costo_px })
          .eq("id", perfil.id);
        if (error) throw error;
      }

      const { error: entradaError } = await supabase
        .from("tournament_entries")
        .insert({
          user_id:         perfil.id,
          tournament_id:   combinada.id,
          vidas:           combinada.partidos_combinada.length,
          vidas_iniciales: combinada.partidos_combinada.length,
          status:          "ACTIVO",
          nivel_ingreso:   1,
          fecha_ingreso:   new Date().toISOString(),
        });

      if (entradaError) {
        await supabase.from("profiles").update({ pitchx_balance: saldo }).eq("id", perfil.id);
        throw entradaError;
      }

      setPerfil(prev => prev ? { ...prev, pitchx_balance: saldo - combinada.costo_px } : null);
      showToast(`¡Inscrito en ${combinada.name}!`, "ok");
      setTimeout(() => router.push(`/campo-de-batalla/${combinada.slug}`), 1000);
    } catch (err: any) {
      showToast(err.message ?? "Error al inscribirse", "err");
    } finally {
      setInscribiendo(null);
    }
  };

  const fmtHora  = (f: string) => new Date(f).toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" });
  const fmtFecha = (f: string) => new Date(f).toLocaleDateString("es-CO", { weekday:"long", day:"2-digit", month:"long" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0a0d14;color:#fff;font-family:'Roboto',sans-serif;}
        .cw{min-height:100vh;background:#0a0d14;}
        .ch{background:#0f1420;border-bottom:1px solid rgba(255,255,255,.07);padding:0 20px;height:56px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:100;}
        .ch-back{background:none;border:none;color:rgba(255,255,255,.4);cursor:pointer;padding:6px;display:flex;border-radius:6px;transition:all .15s;}
        .ch-back:hover{background:rgba(255,255,255,.08);color:#fff;}
        .ch-title{font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;color:#fff;}
        .ch-badge{font-family:'Oswald',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;color:#f59e0b;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);border-radius:3px;padding:2px 6px;text-transform:uppercase;}
        .ch-saldo{margin-left:auto;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;color:#38bdf8;}
        .cb{padding:20px;max-width:700px;margin:0 auto;}
        .comb-card{background:#111827;border:1px solid rgba(255,255,255,.07);border-radius:12px;overflow:hidden;margin-bottom:14px;transition:border-color .2s;}
        .comb-card:hover{border-color:rgba(255,255,255,.12);}
        .comb-top{padding:14px;border-left:3px solid var(--cc,#f59e0b);}
        .comb-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;}
        .comb-tipo{font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;display:flex;align-items:center;gap:5px;}
        .comb-nombre{font-family:'Oswald',sans-serif;font-size:17px;font-weight:700;color:#fff;margin-bottom:6px;}
        .comb-stats{display:flex;gap:14px;flex-wrap:wrap;}
        .comb-stat{font-size:11px;color:rgba(255,255,255,.35);display:flex;align-items:center;gap:4px;}
        .comb-stat strong{color:rgba(255,255,255,.7);}
        .partidos-list{padding:10px 14px;background:rgba(255,255,255,.02);border-top:1px solid rgba(255,255,255,.05);}
        .partido-item{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);}
        .partido-item:last-child{border-bottom:none;}
        .partido-num{font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;color:rgba(255,255,255,.2);min-width:16px;}
        .partido-equipos{flex:1;font-size:12px;color:rgba(255,255,255,.7);}
        .partido-hora{font-size:10px;color:rgba(255,255,255,.25);}
        .comb-footer{padding:10px 14px;background:rgba(255,255,255,.02);border-top:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
        .comb-btn{padding:9px 18px;border:none;border-radius:7px;font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;letter-spacing:.5px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:5px;}
        .comb-btn-join{color:#0a0d14;}.comb-btn-join:hover{filter:brightness(1.1);}
        .comb-btn-join:disabled{opacity:.5;cursor:not-allowed;}
        .comb-btn-inscrito{background:rgba(141,198,63,.1);color:#8dc63f;border:1px solid rgba(141,198,63,.2);}
        .comb-btn-saldo{background:rgba(245,158,11,.1);color:#f59e0b;border:1px solid rgba(245,158,11,.2);}
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

      <div className="cw">
        <header className="ch">
          <button className="ch-back" onClick={() => router.push("/radar")}><ArrowLeft size={16}/></button>
          <div><div className="ch-title">Combinadas</div></div>
          <span className="ch-badge">🎯 Mundial 2026</span>
          {perfil && <span className="ch-saldo">{(perfil.pitchx_balance ?? 0).toLocaleString()} PX</span>}
        </header>

        <div className="cb">
          {loading ? (
            <div style={{ display:"flex",justifyContent:"center",padding:60 }}>
              <Loader2 size={28} style={{ color:"#f59e0b",animation:"spin 1s linear infinite" }}/>
            </div>
          ) : combinadas.length === 0 ? (
            <div className="empty">
              <Target size={40}/>
              <div className="empty-t">Sin combinadas disponibles</div>
              <div className="empty-s">El admin debe crear combinadas desde el panel</div>
            </div>
          ) : (
            combinadas.map(c => {
              const cfg = TIPO_CONFIG[c.tipo_evento] ?? TIPO_CONFIG.COMBINADA;
              const saldo = perfil?.pitchx_balance ?? 0;
              const sinSaldo = saldo < c.costo_px;
              return (
                <div key={c.id} className="comb-card" style={{ "--cc": cfg.color } as React.CSSProperties}>
                  <div className="comb-top">
                    <div className="comb-head">
                      <div className="comb-tipo" style={{ color: cfg.color }}>
                        {cfg.icon} COMBINADA
                      </div>
                      <div style={{ fontFamily:"'Oswald',sans-serif",fontSize:20,fontWeight:700,color:"#a855f7" }}>
                        {c.premio_px.toLocaleString()} PX
                      </div>
                    </div>
                    <div className="comb-nombre">{c.name}</div>
                    {c.descripcion && (
                      <div style={{ fontSize:12,color:"rgba(255,255,255,.35)",marginBottom:8 }}>{c.descripcion}</div>
                    )}
                    <div className="comb-stats">
                      <div className="comb-stat"><Target size={11}/><strong>{c.partidos_combinada.length}</strong> partidos</div>
                      <div className="comb-stat"><Zap size={11}/>Costo: <strong style={{ color:cfg.color }}>{c.costo_px} PX</strong></div>
                      <div className="comb-stat"><Users size={11}/><strong>{c.participantes}</strong> inscritos</div>
                      <div className="comb-stat"><Star size={11}/>{cfg.descripcion}</div>
                      {c.fecha_inicio && (
                        <div className="comb-stat"><Calendar size={11}/>{new Date(c.fecha_inicio).toLocaleDateString("es-CO",{day:"2-digit",month:"short"})}</div>
                      )}
                    </div>
                  </div>

                  {c.partidos_combinada.length > 0 && (
                    <div className="partidos-list">
                      {c.partidos_combinada
                        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
                        .map((p, i) => (
                          <div key={i} className="partido-item">
                            <span className="partido-num">{p.orden ?? i+1}</span>
                            <span className="partido-equipos">
                              {p.home_team ?? "—"} <span style={{ color:"rgba(255,255,255,.25)" }}>vs</span> {p.away_team ?? "—"}
                            </span>
                            <span className="partido-hora">
                              {p.match_date ? fmtHora(p.match_date) : "—"}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  )}

                  <div className="comb-footer">
                    <div style={{ fontSize:11,color:"rgba(255,255,255,.25)" }}>
                      Tu saldo: <span style={{ color:"#38bdf8",fontWeight:700 }}>{saldo} PX</span>
                    </div>
                    {c.inscrito ? (
                      <button className="comb-btn comb-btn-inscrito"
                        onClick={() => router.push(`/campo-de-batalla/${c.slug}`)}>
                        <CheckCircle size={12}/> Inscrito — Jugar
                      </button>
                    ) : sinSaldo ? (
                      <button className="comb-btn comb-btn-saldo" onClick={() => router.push("/radar")}>
                        <Zap size={12}/> Recargar PX
                      </button>
                    ) : (
                      <button
                        className="comb-btn comb-btn-join"
                        style={{ background: cfg.color }}
                        onClick={() => inscribirse(c)}
                        disabled={inscribiendo === c.id}
                      >
                        {inscribiendo === c.id
                          ? <><Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/> Procesando...</>
                          : <><Heart size={12} fill="currentColor"/> Inscribirse — {c.costo_px} PX</>
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
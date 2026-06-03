"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Zap, Trophy, Heart, CheckCircle, X,
  Loader2, ArrowLeft, Clock, Target, Star,
  ChevronRight, AlertTriangle, Calendar
} from "lucide-react";

interface EventoIndividual {
  id: string;
  nombre: string;
  partido_id: string;
  precio_px: number;
  premio_px: number;
  estado: string;
  slug: string;
  created_at: string;
  partido?: {
    home_team: string;
    away_team: string;
    match_date: string;
    phase: string;
    status: string;
  };
  inscrito?: boolean;
}

interface Perfil {
  id: string;
  pitchx_balance: number;
}

export default function IndividualPage() {
  const router = useRouter();
  const [eventos,      setEventos]      = useState<EventoIndividual[]>([]);
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

      // Partidos individuales = matches donde tournament_id IS NULL
      const { data: matches } = await supabase
        .from("matches").select("*")
        .is("tournament_id", null)
        .in("status", ["PROXIMAMENTE", "EN_VIVO"])
        .order("match_date", { ascending: true });

      if (!matches || matches.length === 0) {
        setEventos([]); setLoading(false); return;
      }

      // Verificar cuáles ya tiene predichos el jugador
      const matchIds = matches.map((m: any) => m.id);
      const { data: predicciones } = await supabase
        .from("predictions").select("match_id")
        .eq("user_id", user.id).in("match_id", matchIds);
      const predichoIds = new Set((predicciones || []).map((pr: any) => pr.match_id));

      const enriquecidos = matches.map((m: any) => ({
        id:         m.id,
        nombre:     `${m.home_team} vs ${m.away_team}`,
        slug:       m.id,
        partido_id: m.id,
        precio_px:  m.costo_operacion ?? 0,
        premio_px:  0,
        estado:     m.status,
        created_at: m.created_at,
        inscrito:   predichoIds.has(m.id),
        partido: {
          home_team:  m.home_team,
          away_team:  m.away_team,
          match_date: m.match_date,
          phase:      m.phase || "Individual",
          status:     m.status,
        },
      }));

      setEventos(enriquecidos);
    } catch (err) {
      console.error("[IndividualPage]", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { cargar(); }, [cargar]);

  const inscribirse = async (evento: EventoIndividual) => {
    if (!perfil) return;
    const saldo = perfil.pitchx_balance ?? 0;
    if (saldo < evento.precio_px) {
      showToast(`Necesitas ${evento.precio_px} PX. Tu saldo: ${saldo} PX`, "warn");
      return;
    }
    setInscribiendo(evento.id);
    try {
      if (evento.precio_px > 0) {
        const { error } = await supabase
          .from("profiles")
          .update({ pitchx_balance: saldo - evento.precio_px })
          .eq("id", perfil.id);
        if (error) throw error;
        setPerfil(prev => prev ? { ...prev, pitchx_balance: saldo - evento.precio_px } : null);
      }
      showToast("¡Entrando al partido!", "ok");
      setTimeout(() => router.push(`/campo-de-batalla/${evento.slug}`), 800);
    } catch (err: any) {
      showToast(err.message ?? "Error", "err");
    } finally {
      setInscribiendo(null);
    }
  };

  const fmtFecha = (f: string) => new Date(f).toLocaleDateString("es-CO", { day:"2-digit", month:"short" });
  const fmtHora  = (f: string) => new Date(f).toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0a0d14;color:#fff;font-family:'Roboto',sans-serif;}
        .iw{min-height:100vh;background:#0a0d14;}
        .ih{background:#0f1420;border-bottom:1px solid rgba(255,255,255,.07);padding:0 20px;height:56px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:100;}
        .ih-back{background:none;border:none;color:rgba(255,255,255,.4);cursor:pointer;padding:6px;display:flex;border-radius:6px;transition:all .15s;}
        .ih-back:hover{background:rgba(255,255,255,.08);color:#fff;}
        .ih-title{font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;color:#fff;}
        .ih-badge{font-family:'Oswald',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;color:#ef4444;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:3px;padding:2px 6px;text-transform:uppercase;}
        .ih-saldo{margin-left:auto;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;color:#38bdf8;}
        .ib{padding:20px;max-width:700px;margin:0 auto;}
        .info-banner{background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:14px;margin-bottom:20px;display:flex;gap:12px;align-items:flex-start;}
        .info-banner-t{font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;color:#ef4444;margin-bottom:4px;}
        .info-banner-s{font-size:12px;color:rgba(255,255,255,.4);line-height:1.6;}
        .ev-card{background:#111827;border:1px solid rgba(255,255,255,.07);border-radius:12px;overflow:hidden;margin-bottom:14px;border-left:3px solid #ef4444;}
        .ev-top{padding:14px;}
        .ev-vs{font-family:'Oswald',sans-serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:8px;line-height:1.2;}
        .ev-meta{display:flex;gap:12px;flex-wrap:wrap;}
        .ev-meta-item{font-size:11px;color:rgba(255,255,255,.35);display:flex;align-items:center;gap:4px;}
        .ev-meta-item strong{color:rgba(255,255,255,.6);}
        .ev-reglas{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px 14px;background:rgba(255,255,255,.02);border-top:1px solid rgba(255,255,255,.05);}
        .ev-regla{text-align:center;padding:8px;}
        .ev-regla-v{font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;color:#ef4444;}
        .ev-regla-l{font-size:9px;color:rgba(255,255,255,.25);letter-spacing:1px;text-transform:uppercase;margin-top:2px;}
        .ev-footer{padding:10px 14px;background:rgba(255,255,255,.02);border-top:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
        .ev-btn{padding:9px 18px;border:none;border-radius:7px;font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;letter-spacing:.5px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:5px;}
        .ev-btn-join{background:#ef4444;color:#fff;}.ev-btn-join:hover{background:#dc2626;}
        .ev-btn-join:disabled{opacity:.5;cursor:not-allowed;}
        .ev-btn-inscrito{background:rgba(141,198,63,.1);color:#8dc63f;border:1px solid rgba(141,198,63,.2);}
        .ev-btn-saldo{background:rgba(245,158,11,.1);color:#f59e0b;border:1px solid rgba(245,158,11,.2);}
        .empty{text-align:center;padding:60px 20px;}
        .empty svg{color:rgba(255,255,255,.08);margin:0 auto 12px;display:block;}
        .empty-t{font-family:'Oswald',sans-serif;font-size:15px;color:rgba(255,255,255,.2);margin-bottom:8px;}
        .empty-s{font-size:12px;color:rgba(255,255,255,.15);}
        .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:8px;font-size:13px;font-weight:500;z-index:999;white-space:nowrap;}
        .toast.ok{background:#8dc63f;color:#0a0d14;}
        .toast.err{background:#ef4444;color:#fff;}
        .toast.warn{background:#f59e0b;color:#0a0d14;}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="iw">
        <header className="ih">
          <button className="ih-back" onClick={() => router.push("/radar")}><ArrowLeft size={16}/></button>
          <div>
            <div className="ih-title">Individual</div>
          </div>
          <span className="ih-badge">⚡ Muerte súbita</span>
          {perfil && <span className="ih-saldo">{(perfil.pitchx_balance ?? 0).toLocaleString()} PX</span>}
        </header>

        <div className="ib">
          <div className="info-banner">
            <AlertTriangle size={18} style={{ color:"#ef4444",flexShrink:0,marginTop:2 }}/>
            <div>
              <div className="info-banner-t">Modalidad muerte súbita</div>
              <div className="info-banner-s">
                1 partido · 10 preguntas · 2.5 minutos · Dificultad máxima<br/>
                Si fallas una pregunta, pierdes todo. No hay segunda oportunidad.
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display:"flex",justifyContent:"center",padding:60 }}>
              <Loader2 size={28} style={{ color:"#ef4444",animation:"spin 1s linear infinite" }}/>
            </div>
          ) : eventos.length === 0 ? (
            <div className="empty">
              <Zap size={40}/>
              <div className="empty-t">Sin partidos individuales activos</div>
              <div className="empty-s">El equipo está preparando nuevos partidos. ¡Vuelve pronto!</div>
            </div>
          ) : (
            eventos.map(ev => {
              const saldo = perfil?.pitchx_balance ?? 0;
              const sinSaldo = saldo < ev.precio_px;

              return (
                <div key={ev.id} className="ev-card">
                  <div className="ev-top">
                    <div className="ev-vs">
                      {ev.partido?.home_team ?? ev.nombre}
                      <span style={{color:"rgba(255,255,255,.2)"}}> vs </span>
                      {ev.partido?.away_team ?? ""}
                    </div>
                    <div className="ev-meta">
                      {ev.partido?.match_date && (
                        <>
                          <div className="ev-meta-item"><Calendar size={11}/><strong>{fmtFecha(ev.partido.match_date)}</strong></div>
                          <div className="ev-meta-item"><Clock size={11}/><strong>{fmtHora(ev.partido.match_date)}</strong></div>
                        </>
                      )}
                      {ev.partido?.phase && (
                        <div className="ev-meta-item"><Target size={11}/>{ev.partido.phase}</div>
                      )}
                      <div className="ev-meta-item">
                        <Trophy size={11}/>Premio: <strong style={{color:"#a855f7"}}>{ev.premio_px.toLocaleString()} PX</strong>
                      </div>
                    </div>
                  </div>

                  <div className="ev-reglas">
                    <div className="ev-regla"><div className="ev-regla-v">10</div><div className="ev-regla-l">Preguntas</div></div>
                    <div className="ev-regla"><div className="ev-regla-v">2:30</div><div className="ev-regla-l">Minutos</div></div>
                    <div className="ev-regla"><div className="ev-regla-v">8</div><div className="ev-regla-l">Dificultad</div></div>
                  </div>

                  <div className="ev-footer">
                    <div style={{ fontSize:11,color:"rgba(255,255,255,.25)" }}>
                      Costo: <span style={{ color:"#ef4444",fontWeight:700,fontFamily:"'Oswald',sans-serif" }}>{ev.precio_px} PX</span>
                      {" · "}Saldo: <span style={{ color:"#38bdf8",fontWeight:700 }}>{saldo} PX</span>
                    </div>
                    {ev.inscrito ? (
                      <button className="ev-btn ev-btn-inscrito"
                        onClick={() => router.push(`/campo-de-batalla/${ev.slug}`)}>
                        <ChevronRight size={12}/> Jugar ahora
                      </button>
                    ) : sinSaldo ? (
                      <button className="ev-btn ev-btn-saldo"
                        onClick={() => router.push("/radar")}>
                        <Zap size={12}/> Recargar PX
                      </button>
                    ) : (
                      <button
                        className="ev-btn ev-btn-join"
                        onClick={() => inscribirse(ev)}
                        disabled={inscribiendo === ev.id}>
                        {inscribiendo === ev.id
                          ? <><Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/> Procesando...</>
                          : <><Zap size={12}/> Jugar — {ev.precio_px} PX</>
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
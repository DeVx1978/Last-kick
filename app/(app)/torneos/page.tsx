"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, Trophy, Calendar, Clock, MapPin,
  ChevronRight, Loader2, Heart, Zap, Users,
  Star, Activity, RefreshCw
} from "lucide-react";

interface Torneo {
  id: string;
  name: string;
  slug: string;
  status: string;
  tipo_evento: string;
  es_vip: boolean;
  costo_px: number;
  premio_px: number;
  vidas_base: number;
  vidas_bonus: number;
  descripcion: string;
  fecha_inicio: string;
  fecha_cierre: string;
  featured: boolean;
  sort_order: number;
  bonus_activo: boolean;
  bonus_px: number;
  bonus_descripcion: string;
}

interface Partido {
  id: string;
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  match_date: string;
  stadium: string;
  city: string;
  phase: string;
  status: string;
  cuota_1: number;
  cuota_x: number;
  cuota_2: number;
  home_score: number;
  away_score: number;
}

interface Perfil {
  id: string;
  pitchx_balance: number;
  lives: number;
}

export default function TorneosPage() {
  const router = useRouter();
  const [torneos,          setTorneos]          = useState<Torneo[]>([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState<Torneo | null>(null);
  const [partidos,         setPartidos]         = useState<Partido[]>([]);
  const [perfil,           setPerfil]           = useState<Perfil | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [loadingPartidos,  setLoadingPartidos]  = useState(false);
  const [filtro,           setFiltro]           = useState("TODOS");
  const [inscribiendo,     setInscribiendo]     = useState(false);
  const [inscrito,         setInscrito]         = useState(false);
  const [toast,            setToast]            = useState<{msg:string;type:"ok"|"err"|"warn"}|null>(null);

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
        .from("profiles").select("id, pitchx_balance, lives")
        .eq("id", user.id).maybeSingle();
      if (p) setPerfil({ id: p.id, pitchx_balance: p.pitchx_balance ?? 0, lives: p.lives ?? 0 });

      const { data: ts } = await supabase
        .from("tournaments").select("*")
        .eq("tipo_evento", "TORNEO")
        .eq("es_vip", false)
        .in("status", ["ACTIVO", "PROXIMO"])
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (ts && ts.length > 0) {
        setTorneos(ts as Torneo[]);
        setTorneoSeleccionado(ts[0]);
        await cargarPartidos(ts[0].id, user.id);
      }
    } catch (err) {
      console.error("[TorneosPage]", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const cargarPartidos = async (torneoId: string, userId?: string) => {
    setLoadingPartidos(true);
    try {
      const { data: pts } = await supabase
        .from("matches").select("*")
        .eq("tournament_id", torneoId)
        .order("match_date", { ascending: true });
      setPartidos((pts as Partido[]) ?? []);

      if (userId) {
        const { data: entrada } = await supabase
          .from("tournament_entries").select("id")
          .eq("tournament_id", torneoId)
          .eq("user_id", userId).maybeSingle();
        setInscrito(!!entrada);
      }
    } finally {
      setLoadingPartidos(false);
    }
  };

  const seleccionarTorneo = async (torneo: Torneo) => {
    setTorneoSeleccionado(torneo);
    setFiltro("TODOS");
    const { data: { user } } = await supabase.auth.getUser();
    await cargarPartidos(torneo.id, user?.id);
  };

  const inscribirse = async () => {
    if (!perfil || !torneoSeleccionado) return;
    const saldo = perfil.pitchx_balance ?? 0;
    if (saldo < torneoSeleccionado.costo_px) {
      showToast(`Necesitas ${torneoSeleccionado.costo_px} PX. Tu saldo: ${saldo} PX`, "warn");
      return;
    }
    setInscribiendo(true);
    try {
      if (torneoSeleccionado.costo_px > 0) {
        const { error } = await supabase
          .from("profiles")
          .update({ pitchx_balance: saldo - torneoSeleccionado.costo_px })
          .eq("id", perfil.id);
        if (error) throw error;
      }

      const { error: entradaError } = await supabase
        .from("tournament_entries").insert({
          user_id:         perfil.id,
          tournament_id:   torneoSeleccionado.id,
          vidas:           torneoSeleccionado.vidas_base + (torneoSeleccionado.vidas_bonus || 0),
          vidas_iniciales: torneoSeleccionado.vidas_base + (torneoSeleccionado.vidas_bonus || 0),
          status:          "ACTIVO",
          nivel_ingreso:   1,
          fecha_ingreso:   new Date().toISOString(),
        });

      if (entradaError) {
        await supabase.from("profiles").update({ pitchx_balance: saldo }).eq("id", perfil.id);
        throw entradaError;
      }

      setPerfil(prev => prev ? { ...prev, pitchx_balance: saldo - torneoSeleccionado.costo_px } : null);
      setInscrito(true);
      showToast(`¡Inscrito en ${torneoSeleccionado.name}!`, "ok");
      setTimeout(() => router.push(`/campo-de-batalla/${torneoSeleccionado.slug}`), 1000);
    } catch (err: any) {
      showToast(err.message ?? "Error al inscribirse", "err");
    } finally {
      setInscribiendo(false);
    }
  };

  useEffect(() => { cargar(); }, [cargar]);

  const fmtFecha = (f: string) => new Date(f).toLocaleDateString("es-CO", { day:"2-digit", month:"short", year:"numeric" });
  const fmtHora  = (f: string) => new Date(f).toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" });

  const partidosFiltrados = partidos.filter(p => {
    if (filtro === "TODOS") return true;
    if (filtro === "EN_VIVO") return p.status === "EN_VIVO";
    if (filtro === "PROXIMOS") return p.status === "PROXIMAMENTE";
    if (filtro === "FINALIZADOS") return p.status === "FINALIZADO";
    return true;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0a0d14;color:#fff;font-family:'Roboto',sans-serif;}
        .tw{min-height:100vh;background:#0a0d14;}
        .th{background:#0f1420;border-bottom:1px solid rgba(255,255,255,.07);padding:0 20px;height:56px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:100;}
        .th-back{background:none;border:none;color:rgba(255,255,255,.4);cursor:pointer;padding:6px;display:flex;border-radius:6px;transition:all .15s;}
        .th-back:hover{background:rgba(255,255,255,.08);color:#fff;}
        .th-title{font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;color:#fff;}
        .th-badge{font-family:'Oswald',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;color:#8dc63f;background:rgba(141,198,63,.1);border:1px solid rgba(141,198,63,.2);border-radius:3px;padding:2px 6px;text-transform:uppercase;}
        .th-saldo{margin-left:auto;display:flex;align-items:center;gap:12px;}
        .th-stat{font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;}
        .tb{display:grid;grid-template-columns:260px 1fr;gap:0;min-height:calc(100vh - 56px);}
        @media(max-width:800px){.tb{grid-template-columns:1fr;}}
        .tl{background:#0b0e1a;border-right:1px solid rgba(255,255,255,.06);padding:16px;overflow-y:auto;}
        @media(max-width:800px){.tl{border-right:none;border-bottom:1px solid rgba(255,255,255,.06);padding:12px;display:flex;gap:8px;overflow-x:auto;}}
        .torneo-item{padding:12px 14px;border-radius:8px;cursor:pointer;margin-bottom:8px;border:1px solid rgba(255,255,255,.06);transition:all .15s;}
        .torneo-item:hover{border-color:rgba(141,198,63,.2);background:rgba(141,198,63,.04);}
        .torneo-item.activo{border-color:#8dc63f;background:rgba(141,198,63,.08);}
        @media(max-width:800px){.torneo-item{margin-bottom:0;flex-shrink:0;white-space:nowrap;}}
        .torneo-nombre{font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;color:#fff;margin-bottom:4px;}
        .torneo-meta{font-size:10px;color:rgba(255,255,255,.3);}
        .tr{padding:20px;overflow-y:auto;}
        .torneo-header{background:#111827;border:1px solid rgba(141,198,63,.12);border-radius:10px;padding:20px;margin-bottom:16px;}
        .torneo-header-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;}
        .torneo-nombre-big{font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;color:#fff;margin-bottom:6px;}
        .torneo-desc{font-size:12px;color:rgba(255,255,255,.4);line-height:1.6;margin-bottom:12px;}
        .torneo-stats{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;}
        .t-stat{display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,.4);}
        .t-stat strong{color:#fff;font-family:'Oswald',sans-serif;}
        .bonus-bar{background:rgba(141,198,63,.08);border:1px solid rgba(141,198,63,.2);border-radius:6px;padding:8px 12px;display:flex;align-items:center;gap:8px;margin-bottom:14px;}
        .btn-inscribirse{width:100%;padding:13px;background:#8dc63f;border:none;border-radius:8px;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;color:#0a0d14;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;}
        .btn-inscribirse:hover{background:#7ab52f;}
        .btn-inscribirse:disabled{opacity:.5;cursor:not-allowed;}
        .btn-inscrito{width:100%;padding:13px;background:rgba(141,198,63,.1);border:1px solid rgba(141,198,63,.25);border-radius:8px;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;color:#8dc63f;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;}
        .btn-sin-saldo{width:100%;padding:13px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);border-radius:8px;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;color:#f59e0b;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;}
        .filtros{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}
        .filtro-btn{padding:5px 12px;border:1px solid rgba(255,255,255,.08);border-radius:6px;background:transparent;color:rgba(255,255,255,.35);font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;cursor:pointer;letter-spacing:.5px;transition:all .15s;}
        .filtro-btn.on{background:rgba(141,198,63,.1);border-color:rgba(141,198,63,.3);color:#8dc63f;}
        .partido-card{background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:10px;margin-bottom:10px;overflow:hidden;transition:border-color .2s;}
        .partido-card:hover{border-color:rgba(141,198,63,.2);}
        .partido-header{padding:10px 16px;background:rgba(255,255,255,.02);border-bottom:1px solid rgba(255,255,255,.04);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
        .partido-hora{display:flex;align-items:center;gap:6px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:600;color:#fff;}
        .partido-meta{display:flex;align-items:center;gap:8px;font-size:11px;color:rgba(255,255,255,.3);}
        .partido-status{font-size:9px;font-weight:700;padding:3px 8px;border-radius:3px;font-family:'Oswald',sans-serif;letter-spacing:.5px;}
        .s-prox{background:rgba(245,158,11,.12);color:#f59e0b;}
        .s-vivo{background:rgba(239,68,68,.12);color:#ef4444;}
        .s-fin{background:rgba(56,189,248,.12);color:#38bdf8;}
        .partido-equipos{padding:16px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;}
        .equipo-local{display:flex;flex-direction:column;align-items:flex-start;gap:6px;}
        .equipo-visit{display:flex;flex-direction:column;align-items:flex-end;gap:6px;}
        .equipo-nombre{font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;color:#fff;}
        .equipo-sub{font-size:10px;color:rgba(255,255,255,.25);}
        .flag-img{width:36px;height:24px;object-fit:cover;border-radius:3px;box-shadow:0 2px 8px rgba(0,0,0,.4);}
        .equipo-row{display:flex;align-items:center;gap:8px;}
        .vs-box{text-align:center;}
        .vs-txt{font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;color:rgba(255,255,255,.3);padding:6px 10px;border:1px solid rgba(255,255,255,.08);border-radius:6px;background:rgba(255,255,255,.03);}
        .vs-score{font-family:'Oswald',sans-serif;font-size:26px;font-weight:700;color:#fff;letter-spacing:4px;}
        .cuotas-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;padding:0 16px 14px;}
        .cuota-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:6px;}
        .cuota-lbl{font-size:9px;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.5px;}
        .cuota-val{font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;color:#fff;}
        .empty{text-align:center;padding:60px 20px;color:rgba(255,255,255,.2);}
        .empty-t{font-family:'Oswald',sans-serif;font-size:15px;color:rgba(255,255,255,.3);margin-top:12px;}
        .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:8px;font-size:13px;font-weight:500;z-index:999;white-space:nowrap;}
        .toast.ok{background:#8dc63f;color:#0a0d14;}
        .toast.err{background:#ef4444;color:#fff;}
        .toast.warn{background:#f59e0b;color:#0a0d14;}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="tw">
        <header className="th">
          <button className="th-back" onClick={() => router.push("/radar")}><ArrowLeft size={16}/></button>
          <div className="th-title">Torneos</div>
          <span className="th-badge">🏆 Mundial 2026</span>
          {perfil && (
            <div className="th-saldo">
              <span className="th-stat" style={{color:"#8dc63f"}}>{perfil.lives} ❤️</span>
              <span className="th-stat" style={{color:"#38bdf8"}}>{(perfil.pitchx_balance ?? 0).toLocaleString()} PX</span>
            </div>
          )}
        </header>

        {loading ? (
          <div style={{display:"flex",justifyContent:"center",padding:60}}>
            <Loader2 size={28} style={{color:"#8dc63f",animation:"spin 1s linear infinite"}}/>
          </div>
        ) : (
          <div className="tb">
            {/* LISTA DE TORNEOS */}
            <div className="tl">
              {torneos.length === 0 ? (
                <div style={{fontSize:12,color:"rgba(255,255,255,.3)",padding:16}}>Sin torneos activos</div>
              ) : torneos.map(t => (
                <div key={t.id}
                  className={`torneo-item ${torneoSeleccionado?.id === t.id ? 'activo' : ''}`}
                  onClick={() => seleccionarTorneo(t)}>
                  <div className="torneo-nombre">{t.name}</div>
                  <div className="torneo-meta">
                    {t.costo_px} PX · Premio: {(t.premio_px||0).toLocaleString()} PX
                  </div>
                </div>
              ))}
            </div>

            {/* DETALLE DEL TORNEO */}
            <div className="tr">
              {torneoSeleccionado && (
                <>
                  <div className="torneo-header">
                    <div className="torneo-header-top">
                      <div style={{flex:1}}>
                        <div className="torneo-nombre-big">{torneoSeleccionado.name}</div>
                        {torneoSeleccionado.descripcion && (
                          <div className="torneo-desc">{torneoSeleccionado.descripcion}</div>
                        )}
                        <div className="torneo-stats">
                          <div className="t-stat"><Heart size={13} style={{color:"#8dc63f"}}/> Costo: <strong>{torneoSeleccionado.costo_px} PX</strong></div>
                          <div className="t-stat"><Trophy size={13} style={{color:"#a855f7"}}/> Premio: <strong>{(torneoSeleccionado.premio_px||0).toLocaleString()} PX</strong></div>
                          <div className="t-stat"><Zap size={13} style={{color:"#f59e0b"}}/> Vidas: <strong>{torneoSeleccionado.vidas_base + (torneoSeleccionado.vidas_bonus||0)} ❤️</strong></div>
                          {torneoSeleccionado.fecha_inicio && (
                            <div className="t-stat"><Calendar size={13}/> Inicio: <strong>{fmtFecha(torneoSeleccionado.fecha_inicio)}</strong></div>
                          )}
                          <div className="t-stat"><Activity size={13}/> Partidos: <strong>{partidos.length}</strong></div>
                        </div>
                      </div>
                    </div>

                    {torneoSeleccionado.bonus_activo && (
                      <div className="bonus-bar">
                        <Star size={14} style={{color:"#8dc63f",flexShrink:0}}/>
                        <span style={{fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:700,color:"#8dc63f",letterSpacing:1}}>BONUS ACTIVO</span>
                        <span style={{fontSize:11,color:"rgba(255,255,255,.5)"}}>{torneoSeleccionado.bonus_descripcion || `+${torneoSeleccionado.bonus_px} PX extra`}</span>
                      </div>
                    )}

                    {inscrito ? (
                      <button className="btn-inscrito" onClick={() => router.push(`/campo-de-batalla/${torneoSeleccionado.slug}`)}>
                        <ChevronRight size={16}/> Ya estás inscrito — Ir al campo de batalla
                      </button>
                    ) : (perfil?.pitchx_balance ?? 0) < torneoSeleccionado.costo_px ? (
                      <button className="btn-sin-saldo" onClick={() => router.push("/radar")}>
                        <Zap size={14}/> Saldo insuficiente — Recargar PX
                      </button>
                    ) : (
                      <button className="btn-inscribirse" onClick={inscribirse} disabled={inscribiendo}>
                        {inscribiendo
                          ? <><Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/> Procesando...</>
                          : <><Heart size={14} fill="currentColor"/> Inscribirse — {torneoSeleccionado.costo_px} PX</>
                        }
                      </button>
                    )}
                  </div>

                  {/* FILTROS */}
                  <div className="filtros">
                    {["TODOS","EN_VIVO","PROXIMOS","FINALIZADOS"].map(f => (
                      <button key={f} className={`filtro-btn ${filtro===f?"on":""}`} onClick={() => setFiltro(f)}>
                        {f}
                        <span style={{opacity:.6,marginLeft:4}}>
                          ({f==="TODOS"?partidos.length:partidos.filter(p=>
                            f==="EN_VIVO"?p.status==="EN_VIVO":
                            f==="PROXIMOS"?p.status==="PROXIMAMENTE":
                            p.status==="FINALIZADO"
                          ).length})
                        </span>
                      </button>
                    ))}
                    <button className="filtro-btn" onClick={() => seleccionarTorneo(torneoSeleccionado)}>
                      <RefreshCw size={10}/>
                    </button>
                  </div>

                  {/* PARTIDOS */}
                  {loadingPartidos ? (
                    <div style={{textAlign:"center",padding:40}}>
                      <Loader2 size={22} style={{color:"#8dc63f",animation:"spin 1s linear infinite",margin:"0 auto",display:"block"}}/>
                    </div>
                  ) : partidosFiltrados.length === 0 ? (
                    <div className="empty">
                      <Activity size={32} style={{margin:"0 auto",opacity:.3,display:"block"}}/>
                      <div className="empty-t">Sin partidos en esta categoría</div>
                    </div>
                  ) : partidosFiltrados.map(m => (
                    <div key={m.id} className="partido-card">
                      <div className="partido-header">
                        <div className="partido-hora">
                          <Clock size={12} style={{color:"#8dc63f"}}/>
                          {fmtHora(m.match_date)} · {fmtFecha(m.match_date)}
                        </div>
                        <div className="partido-meta">
                          {m.city && <span style={{display:"flex",alignItems:"center",gap:3}}><MapPin size={10}/>{m.city}</span>}
                          {m.phase && <span>{m.phase}</span>}
                        </div>
                        <span className={`partido-status ${m.status==="EN_VIVO"?"s-vivo":m.status==="FINALIZADO"?"s-fin":"s-prox"}`}>
                          {m.status==="EN_VIVO"?"● EN VIVO":m.status==="FINALIZADO"?"FINALIZADO":"PRÓXIMO"}
                        </span>
                      </div>
                      <div className="partido-equipos">
                        <div className="equipo-local">
                          <div className="equipo-row">
                            <img src={`https://flagcdn.com/w80/${m.home_flag||'un'}.png`}
                              className="flag-img" alt={m.home_team}
                              onError={e=>(e.currentTarget.style.display='none')}/>
                            <span className="equipo-nombre">{m.home_team}</span>
                          </div>
                          <span className="equipo-sub">Local</span>
                        </div>
                        <div className="vs-box">
                          {m.status === "FINALIZADO"
                            ? <div className="vs-score">{m.home_score} — {m.away_score}</div>
                            : <div className="vs-txt">VS</div>}
                        </div>
                        <div className="equipo-visit">
                          <div className="equipo-row" style={{flexDirection:"row-reverse"}}>
                            <img src={`https://flagcdn.com/w80/${m.away_flag||'un'}.png`}
                              className="flag-img" alt={m.away_team}
                              onError={e=>(e.currentTarget.style.display='none')}/>
                            <span className="equipo-nombre">{m.away_team}</span>
                          </div>
                          <span className="equipo-sub" style={{textAlign:"right"}}>Visitante</span>
                        </div>
                      </div>
                      {(m.cuota_1 || m.cuota_x || m.cuota_2) && (
                        <div className="cuotas-row">
                          <div className="cuota-item">
                            <span className="cuota-lbl">{m.home_team.split(' ')[0]}</span>
                            <span className="cuota-val">{m.cuota_1||'—'}</span>
                          </div>
                          <div className="cuota-item">
                            <span className="cuota-lbl">Empate</span>
                            <span className="cuota-val">{m.cuota_x||'—'}</span>
                          </div>
                          <div className="cuota-item">
                            <span className="cuota-lbl">{m.away_team.split(' ')[0]}</span>
                            <span className="cuota-val">{m.cuota_2||'—'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
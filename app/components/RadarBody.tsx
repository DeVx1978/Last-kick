"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useRouter } from "next/navigation";
import PerfilExtendido from '@/app/components/PerfilExtendido';
import JoinEventModal, { type EventoJuego } from '@/app/components/game/JoinEventModal';
import {
  Crosshair, Zap, Trophy, ScrollText, User, LogOut,
  Heart, Activity, QrCode, ChevronRight, Star, Shield,
  Lock, AlertCircle, CheckCircle, X, Menu, BarChart2,
  Flame, TrendingUp, Clock, Wallet, Gift, Bell,
  Users, Award, ArrowUpRight, Copy, ExternalLink,
  ChevronDown, DollarSign, AlertTriangle
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/* ══════════════════════════════════════════════════════════════════════════
   TIPOS
   ══════════════════════════════════════════════════════════════════════════ */
interface UsuarioPerfil {
  id: string; nombre: string; nombre_completo: string;
  email: string; telefono: string; pais: string;
  pais_codigo: string; moneda: string; vidas: number;
  creditos: number; racha: number; mejor_racha: number;
  total_predicciones: number; predicciones_correctas: number;
  estado_juego: "VIVO" | "EN_COMA" | "ELIMINADO";
  avatar_url: string; codigo_jugador: string; codigo_referido: string;
}
interface Evento {
  id: string; nombre: string; slug: string; descripcion: string;
  tipo_evento: "PUBLICO" | "PRIVADO" | "VIP" | "INDIVIDUAL" | "COMBINADA" | "TORNEO";
  estado: "ACTIVO" | "CERRADO" | "FINALIZADO" | "LIQUIDADO";
  costo_vidas: number; costo_creditos: number;
  cuota_local: number | null; cuota_empate: number | null; cuota_visitante: number | null;
  equipo_local: string | null; equipo_visitante: string | null;
  sede: string | null; imagen_url: string | null;
  fecha_evento: string | null; acumulado_actual: number;
  bonus_activo?: boolean;
  bonus_px?: number;
  bonus_descripcion?: string;
  costo_px?: number;
  vidas_base?: number;
  vidas_bonus?: number;
}
interface Ganancia {
  id: string; evento_nombre: string; premio_creditos: number;
  premio_pozo: number; estado: "PENDIENTE_RETIRO" | "RETIRADO"; fecha: string;
}
interface GananciaReferido {
  id: string; referido_nombre: string; tipo_evento: string;
  creditos_ganados: number; estado: string; created_at: string;
}
interface Referido {
  id: string; nombre: string; estado_juego: string;
  created_at: string; total_recargas: number; comision_generada: number;
}
interface Transaccion {
  id: string; tipo: string; creditos: number;
  vidas: number; descripcion: string; created_at: string;
}
interface Notificacion {
  id: string; tipo: string; titulo: string; mensaje: string;
  leida: boolean; referencia_id: string | null; fecha_creacion: string;
}
interface MetodoPago {
  metodo_clave: string; metodo_nombre: string; descripcion: string;
}
interface ConfigPlataforma {
  minimo_retiro: number; moneda: string;
  comision_retiro: number; comision_referido: number;
}
interface FormRetiro {
  creditos_solicitados: string; nombre_beneficiario: string;
  numero_documento: string; tipo_documento: string;
  metodo_pago: string; numero_cuenta: string;
  banco: string; tipo_cuenta: string;
  metodo_retiro: "TRANSFERENCIA" | "PUNTO_FISICO";
}
type Tab = "radar" | "perfil" | "ganancias" | "historial" | "recargar" | "retiro" | "referidos" | "notificaciones" | "predicciones";

/* ── Toast ── */
const Toast = ({ msg, type, onClose }: { msg: string; type: "ok"|"err"|"warn"; onClose: () => void }) => (
  <div style={{
    position:"fixed",bottom:24,right:24,zIndex:9999,
    background:type==="ok"?"#8dc63f":type==="err"?"#ef4444":"#f59e0b",
    color:"#0a0d14",padding:"12px 18px",borderRadius:4,
    fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,
    letterSpacing:".5px",display:"flex",alignItems:"center",gap:10,
    boxShadow:"0 8px 32px rgba(0,0,0,0.5)",maxWidth:360,animation:"slideIn .3s ease"
  }}>
    {type==="ok"?<CheckCircle size={16}/>:<AlertCircle size={16}/>}
    <span style={{flex:1}}>{msg}</span>
    <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#0a0d14",padding:0}}>
      <X size={14}/>
    </button>
  </div>
);

/* ── Barra retiro ── */
const BarraRetiro = ({ actual, minimo, moneda }: { actual:number; minimo:number; moneda:string }) => {
  const pct = Math.min((actual/minimo)*100,100);
  const falta = Math.max(minimo-actual,0);
  const listo = actual >= minimo;
  return (
    <div style={{background:"#121820",border:`1px solid ${listo?"rgba(141,198,63,.4)":"rgba(255,255,255,.06)"}`,borderRadius:4,padding:"16px 18px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:11,color:"rgba(255,255,255,.4)",textTransform:"uppercase",letterSpacing:1}}>Progreso hacia el mínimo de retiro</span>
        <span style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:listo?"#8dc63f":"rgba(255,255,255,.4)"}}>{Math.round(pct)}%</span>
      </div>
      <div style={{height:6,background:"#0a0d14",borderRadius:2,overflow:"hidden",marginBottom:10}}>
        <div style={{height:"100%",width:`${pct}%`,background:listo?"#8dc63f":"#f59e0b",borderRadius:2,transition:"width .6s ease"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <span style={{fontFamily:"'Oswald',sans-serif",fontSize:18,fontWeight:700,color:"#fff"}}>{actual.toLocaleString()}</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,.4)",marginLeft:4}}>créditos</span>
        </div>
        {listo?(
          <span style={{padding:"4px 12px",background:"rgba(141,198,63,.12)",border:"1px solid rgba(141,198,63,.3)",borderRadius:4,fontSize:10,fontWeight:700,color:"#8dc63f",letterSpacing:1}}>✔ RETIRO DISPONIBLE</span>
        ):(
          <span style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>Faltan <b style={{color:"#f59e0b"}}>{falta.toLocaleString()}</b> créditos (mín. {minimo.toLocaleString()} {moneda})</span>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════════════════════════ */
export default function RadarBody() {
  const router = useRouter();

  const [tab,        setTab]        = useState<Tab>("radar");
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoJuego | null>(null);
  const [saldoPx,    setSaldoPx]    = useState<number>(0);
  const [sideOpen,   setSideOpen]   = useState(false);
  const [notiOpen,   setNotiOpen]   = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState<{msg:string;type:"ok"|"err"|"warn"}|null>(null);
  const [filter, setFilter] = useState<"todos"|"TORNEO"|"VIP"|"COMBINADA"|"INDIVIDUAL">("todos");
  const [pin,        setPin]        = useState("");
  const [pinLoad,    setPinLoad]    = useState(false);
  const [betAmts,    setBetAmts]    = useState<Record<string,string>>({});
  const [activating, setActivating] = useState<string|null>(null);
  
  const [codigoGananciaActivo, setCodigoGananciaActivo] = useState<any>(null); 

  const [perfil,        setPerfil]        = useState<UsuarioPerfil|null>(null);
  const [eventos,       setEventos]       = useState<Evento[]>([]);
  const [ganancias,     setGanancias]     = useState<Ganancia[]>([]);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [metodosPago,   setMetodosPago]   = useState<MetodoPago[]>([]);
  const [gananciasRef,  setGananciasRef]  = useState<GananciaReferido[]>([]);
  const [referidos,     setReferidos]     = useState<Referido[]>([]);
  const [notificaciones,setNotificaciones]= useState<Notificacion[]>([]);
  const [misPredicciones, setMisPredicciones] = useState<any[]>([]);
  const [loadingPredicciones, setLoadingPredicciones] = useState(false);
  const [filtroPred, setFiltroPred] = useState<'TODAS'|'ACERTADAS'|'FALLADAS'|'PENDIENTES'>('TODAS');
  const [config,        setConfig]        = useState<ConfigPlataforma>({
    minimo_retiro:50000, moneda:"COP", comision_retiro:10, comision_referido:5
  });
  const [formRetiro, setFormRetiro] = useState<FormRetiro>({
  creditos_solicitados:"", nombre_beneficiario:"",
  numero_documento:"", tipo_documento:"CEDULA",
  metodo_pago:"", numero_cuenta:"", banco:"", tipo_cuenta:"",
  metodo_retiro: "TRANSFERENCIA"
});
  const [perfilJugador, setPerfilJugador] = useState<any>(null);
  const [tasaCambio,    setTasaCambio]    = useState<number>(1);
  const [simboloMoneda, setSimboloMoneda] = useState<string>("$");

  const showToast = (msg:string, type:"ok"|"err"|"warn"="ok") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),4000);
  };

  /* ── Token para el backend ── */
  const getHeaders = async (): Promise<Record<string,string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
    };
  };

  /* ── Fetch con timeout — evita esperar al backend caído ── */
  const fetchConTimeout = async (url: string, options: RequestInit, timeoutMs = 3000): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  /* ══════════════════════════════════════════════════════════════════════════
     CARGAR DATOS
     ══════════════════════════════════════════════════════════════════════════ */
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const headers = await getHeaders();

      /* ── 1. Perfil: combinar backend + Supabase ── */
      let saldoBackend = 0;
      try {
        const resPerfil = await fetchConTimeout(`${API_URL}/usuarios/perfil`, { headers });
        if (resPerfil.ok) {
          const p = await resPerfil.json();
          saldoBackend = Number(p.saldo || 0);
        }
      } catch {}

      const { data: p } = await supabase
        .from("profiles").select("*").eq("id", user.id).maybeSingle();

      if (p) {
        setPerfil({
          id:                     user.id,
          nombre:                 p.username      || p.full_name || "RECLUTA",
          nombre_completo:        p.full_name     || "",
          email:                  user.email      || "",
          telefono:               p.phone         || "",
          pais:                   p.country       || "Colombia",
          pais_codigo:            p.country_code  || "+57",
          moneda:                 p.moneda        || "COP",
          vidas:                  p.lives         || 0,
          creditos:               saldoBackend > 0 ? saldoBackend : (p.pitchx_balance || 0),
          racha:                  p.streak        || 0,
          mejor_racha:            p.best_streak   || 0,
          total_predicciones:     p.total_predictions  || 0,
          predicciones_correctas: p.correct_predictions || 0,
          estado_juego:           p.status        || "VIVO",
          avatar_url:             p.avatar_url    || "",
          codigo_jugador:         p.player_code   || "",
          codigo_referido:        p.referral_code || `LK-${user.id.substring(0,6).toUpperCase()}`,
        });

        /* ── Config plataforma (Supabase) ── */
        const paisCodigo = (p.country_code || "+57").replace("+","");
        const paisKey = paisCodigo==="57"?"CO":paisCodigo==="593"?"EC":
                        paisCodigo==="52"?"MX":paisCodigo==="54"?"AR":
                        paisCodigo==="51"?"PE":paisCodigo==="58"?"VE":"CO";
        const { data: cfgs } = await supabase.from("platform_config").select("key,value")
          .in("key",[`min_withdrawal_${paisKey}`,`platform_currency_${paisKey}`,
                     "commission_withdrawal","commission_referral"]);
        if (cfgs) {
          const cfg:Record<string,string> = {};
          cfgs.forEach((c:any) => { cfg[c.key]=c.value; });
          setConfig({
            minimo_retiro: parseFloat(cfg[`min_withdrawal_${paisKey}`] || "50000"), // esto es en moneda local
            moneda:            cfg[`platform_currency_${paisKey}`]            || "COP",
            comision_retiro:   parseFloat(cfg["commission_withdrawal"]        || "10"),
            comision_referido: parseFloat(cfg["commission_referral"]          || "5"),
          });
        }

        /* ── Métodos de pago (Supabase) ── */
        const { data: metodos } = await supabase.from("payment_methods")
          .select("method_key,method_name,description")
          .eq("country_code", p.country_code || "+57")
          .eq("is_active",true).order("sort_order");
        if (metodos) setMetodosPago(metodos.map((m:any) => ({
          metodo_clave: m.method_key, metodo_nombre: m.method_name,
          descripcion: m.description || "",
        })));

        /* ── Referidos (Supabase) ── */
        const codigoRef = p.referral_code || `LK-${user.id.substring(0,6).toUpperCase()}`;
        const { data: refs } = await supabase.from("profiles")
          .select("id,username,status,created_at,pitchx_balance")
          .eq("referido_por", codigoRef)
          .order("created_at",{ascending:false});
        if (refs) setReferidos(refs.map((r:any) => ({
          id: r.id, nombre: r.username || "RECLUTA",
          estado_juego: r.status || "VIVO", created_at: r.created_at,
          total_recargas: 0, comision_generada: 0,
        })));
      }

      /* ── Código de ganancia activo ── */
      if (user) {
        const { data: cgActivo } = await supabase
          .from("codigos_ganancia")
          .select("*")
          .eq("jugador_id", user.id)
          .eq("estado", "ACTIVO")
          .gt("expira_en", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setCodigoGananciaActivo(cgActivo ?? null);
      }

      /* ── 2. Eventos: backend con timeout 3s, luego Supabase ── */
      let eventosOk = false;
      try {
        const resEvs = await fetchConTimeout(`${API_URL}/eventos/activos`, { headers }, 3000);
        if (resEvs.ok) {
          const evs = await resEvs.json();
          const lista = Array.isArray(evs) ? evs : (evs.data || []);
          if (lista.length > 0) {
            setEventos(lista.map((e: any) => ({
              id:              e.id,
              nombre:          e.nombre         || e.name        || "",
              slug:            e.slug           || e.id,
              descripcion:     e.descripcion    || e.description || "",
              tipo_evento: e.tipo_evento === "VIP" ? "VIP"
           : e.tipo_evento === "COMBINADA" ? "COMBINADA"
           : e.tipo_evento === "INDIVIDUAL" ? "INDIVIDUAL"
           : e.tipo_evento === "PRIVADO" ? "PRIVADO" 
           : e.tipo_evento === "TORNEO" ? "TORNEO" : "PUBLICO",
              estado:          e.estado         || "ACTIVO",
              costo_vidas:     Number(e.costo_vidas    || 0),
              costo_creditos:  Number(e.costo_creditos || 0),
              cuota_local:     e.cuota_local     || e.cuota_1 || null,
              cuota_empate:    e.cuota_empate    || e.cuota_x || null,
              cuota_visitante: e.cuota_visitante || e.cuota_2 || null,
              equipo_local:    e.equipo_local    || null,
              equipo_visitante:e.equipo_visitante|| null,
              sede:            e.sede            || null,
              imagen_url:      e.imagen_url      || null,
              fecha_evento:    e.fecha_evento    || e.fecha_inicio || null,
              acumulado_actual:Number(e.acumulado_actual || 0),
            })));
            eventosOk = true;
          }
        }
      } catch {}

      if (!eventosOk) {
        console.log('Cargando desde Supabase fallback...');
        // Fallback inmediato: tournaments + matches individuales de Supabase
        const { data: evs } = await supabase
          .from("tournaments").select("*")
          .in("status",["activo","ACTIVO","active"])
          .order("created_at",{ascending:false});

        const { data: matchesInd } = await supabase
          .from("matches").select("*")
          .is("tournament_id", null)
          .in("status",["PROXIMAMENTE","ACTIVO","EN_VIVO"])
          .order("match_date",{ascending:true});

        const eventosTorneos = (evs||[]).map((e:any) => ({
          id: e.id, nombre: e.name, slug: e.slug,
          descripcion: e.descripcion || '',
          tipo_evento: (e.es_vip ? "VIP" : e.tipo_evento === "COMBINADA" ? "COMBINADA" : "TORNEO") as any,
          estado: "ACTIVO" as const, costo_vidas: e.vidas_base || 0,
          costo_creditos: e.costo_px || 0, cuota_local: null,
          cuota_empate: null, cuota_visitante: null,
          equipo_local: null, equipo_visitante: null,
          sede: null, imagen_url: null, fecha_evento: e.fecha_inicio || null,
          acumulado_actual: 0,
          bonus_activo: e.bonus_activo || false,
          bonus_px: e.bonus_px || 0,
          bonus_descripcion: e.bonus_descripcion || "",
          costo_px: e.costo_px || 0,
          vidas_base: e.vidas_base || 0,
          vidas_bonus: e.vidas_bonus || 0,
        }));

        const eventosIndividuales = (matchesInd||[]).map((m:any) => ({
          id: m.id, nombre: `${m.home_team} vs ${m.away_team}`, slug: m.id,
          descripcion: m.phase || '',
          tipo_evento: "INDIVIDUAL" as any,
          estado: "ACTIVO" as const, costo_vidas: 0,
          costo_creditos: m.costo_operacion || 0,
          cuota_local: m.cuota_1 || null,
          cuota_empate: m.cuota_x || null,
          cuota_visitante: m.cuota_2 || null,
          equipo_local: m.home_team || null,
          equipo_visitante: m.away_team || null,
          sede: m.stadium || null, imagen_url: null,
          fecha_evento: m.match_date || null,
          acumulado_actual: 0,
          bonus_activo: false, bonus_px: 0, bonus_descripcion: "",
          costo_px: m.costo_operacion || 0, vidas_base: 0, vidas_bonus: 0,
        }));

        setEventos([...eventosTorneos, ...eventosIndividuales]);
      }

      /* ── 3. Historial: backend con timeout 3s, luego Supabase ── */
      let historialOk = false;
      try {
        const resDash = await fetchConTimeout(`${API_URL}/usuario/dashboard`, { headers }, 3000);
        if (resDash.ok) {
          const dash = await resDash.json();
          const movs = dash.movimientos || dash.data || [];
          if (movs.length > 0) {
            setTransacciones(movs.map((t:any) => ({
              id:          t.id          || String(Math.random()),
              tipo:        t.tipo        || t.type        || "MOVIMIENTO",
              creditos:    Number(t.monto || t.creditos   || t.amount || 0),
              vidas:       Number(t.vidas || 0),
              descripcion: t.descripcion || t.description || "",
              created_at:  t.creado_en   || t.created_at  || new Date().toISOString(),
            })));
            historialOk = true;
          }
        }
      } catch {}

      if (!historialOk) {
        const { data: txs } = await supabase
          .from("px_transactions").select("*")
          .eq("user_id", user.id)
          .order("created_at",{ascending:false}).limit(30);
        if (txs) setTransacciones(txs.map((t:any) => ({
          id: t.id, tipo: t.type || "TRANSACCION", creditos: t.amount,
          vidas: 0, descripcion: t.description || "", created_at: t.created_at,
        })));
      }

      /* ── 4. Predicciones ganadoras: backend con timeout ── */
      try {
        const resPreds = await fetchConTimeout(`${API_URL}/usuario/predicciones`, { headers }, 3000);
        if (resPreds.ok) {
          const preds = await resPreds.json();
          const lista = Array.isArray(preds) ? preds : (preds.data || []);
          const ganadas = lista.filter((p:any) =>
            p.estado === "GANADORA_TOTAL" || p.is_correct === true
          );
          setGanancias(ganadas.map((p:any) => ({
            id:              p.id,
            evento_nombre:   p.evento?.nombre || p.evento_nombre || "Evento",
            premio_creditos: Number(p.premio_creditos || p.points_earned || 0),
            premio_pozo:     Number(p.premio_pozo || 0),
            estado:          "PENDIENTE_RETIRO" as const,
            fecha:           p.fecha_creacion || p.sealed_at || p.created_at || "",
          })));
        }
      } catch { setGanancias([]); }

      /* ── 5. Ganancias referidos + Notificaciones (Supabase) ── */
      const { data: gainRefs } = await supabase.from("referral_earnings")
        .select("*").eq("referrer_id", user.id)
        .order("created_at",{ascending:false});
      if (gainRefs) setGananciasRef(gainRefs.map((r:any) => ({
        id: r.id, referido_nombre: r.referred_id,
        tipo_evento: r.event_type, creditos_ganados: r.earned_px,
        estado: r.status, created_at: r.created_at,
      })));

      const { data: notis } = await supabase.from("notifications")
        .select("id,type,title,message,read,reference_id,created_at")
        .eq("user_id", user.id)
        .order("created_at",{ascending:false}).limit(20);
      if (notis) setNotificaciones(notis.map((n:any) => ({
        id: n.id, tipo: n.type, titulo: n.title, mensaje: n.message,
        leida: n.read, referencia_id: n.reference_id || null,
        fecha_creacion: n.created_at,
      })));
      
      /* ── 6. Perfil extendido + tasa de cambio ── */
      if (user) {
        const { data: pj } = await supabase
          .from("perfiles_jugador")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (pj) {
          setPerfilJugador(pj);
          setFormRetiro(f => ({
            ...f,
            nombre_beneficiario: pj.titular_cuenta || "",
            numero_documento:    pj.numero_documento || "",
            tipo_documento:      pj.tipo_documento || "CEDULA",
            numero_cuenta:       pj.numero_cuenta || "",
            banco:               pj.banco || "",
            tipo_cuenta:         pj.tipo_cuenta || "",
          }));
        }
        const { data: perfilPais } = await supabase.from("profiles").select("country_code").eq("id", user.id).maybeSingle();
        const paisCodigo = ((perfilPais?.country_code) || "+57").replace("+","");
        const paisKey2 = paisCodigo==="57"?"CO":paisCodigo==="593"?"EC":paisCodigo==="52"?"MX":paisCodigo==="51"?"PE":"CO";
        const { data: tasa } = await supabase
          .from("tasas_cambio")
          .select("tasa_usd, simbolo")
          .eq("pais_codigo", paisKey2)
          .maybeSingle();
        if (tasa) {
          setTasaCambio(Number(tasa.tasa_usd));
          setSimboloMoneda(tasa.simbolo);
        }
      }

    } catch(e) {
      console.error("RadarBody error:", e);
      showToast("Error al cargar datos","err");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(()=>{ cargarDatos(); },[cargarDatos]);

  /* ── Cerrar sesión ── */
  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  /* ── Marcar notificación leída ── */
  const cargarMisPredicciones = async () => {
  if (!perfil) return;
  setLoadingPredicciones(true);
  try {
    const { data } = await supabase
      .from('predictions')
      .select(`
        id, question_id, answer_id, is_correct, sealed_at,
        matches!inner(id, home_team, away_team, match_date, home_flag, away_flag, result),
        tournaments(name, tipo_evento)
      `)
      .eq('user_id', perfil.id)
      .eq('question_id', '0c3dc09c-a149-4aed-8301-5cd84249721c')
      .order('sealed_at', { ascending: false })
      .limit(100);
    if (data) setMisPredicciones(data);
  } catch(e) { console.error(e); }
  finally { setLoadingPredicciones(false); }
};
  const marcarLeida = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotificaciones(ns => ns.map(n => n.id===id ? {...n, leida:true} : n));
  };

  /* ── Activar evento ── */
  const activarEvento = async (ev: Evento) => {
    if (!perfil) return;
    if (ev.costo_vidas > 0 && perfil.vidas < ev.costo_vidas) {
      showToast(`Necesitas ${ev.costo_vidas} vida(s). ¡Recarga!`,"warn");
      setTab("recargar"); return;
    }
    if (ev.costo_creditos > 0 && perfil.creditos < ev.costo_creditos) {
      showToast(`Necesitas ${ev.costo_creditos} créditos. ¡Recarga!`,"warn");
      setTab("recargar"); return;
    }
    router.push(`/campo-de-batalla/${ev.slug}`);
  };

  /* ── Apuesta ── */
  const hacerApuesta = async (ev: Evento, resultado: "1"|"X"|"2") => {
    const monto = parseFloat(betAmts[ev.id]||"0");
    if (!monto||monto<50) { showToast("Mínimo 50 créditos por apuesta","warn"); return; }
    if (!perfil||monto>perfil.creditos) { showToast("Créditos insuficientes","err"); return; }
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_URL}/apuestas`, {
        method:"POST", headers,
        body: JSON.stringify({
          evento_id: ev.id, resultado_elegido: resultado,
          monto_creditos: monto,
          cuota_al_apostar: resultado==="1"?ev.cuota_local:resultado==="X"?ev.cuota_empate:ev.cuota_visitante
        })
      });
      if (!res.ok) throw new Error();
      showToast(`Apuesta de ${monto} créditos en "${resultado}" registrada`,"ok");
      setBetAmts(b=>({...b,[ev.id]:""}));
      await cargarDatos();
    } catch { showToast("Error al registrar la apuesta","err"); }
  };

  /* ── Canjear PIN ── */
  const canjearPin = async () => {
    if (!pin.trim()) { showToast("Ingresa un código PIN","warn"); return; }
    setPinLoad(true);
    try {
      const headers = await getHeaders();
      try {
        const res = await fetchConTimeout(`${API_URL}/auth/canjear-pin`, {
          method:"POST", headers,
          body: JSON.stringify({ codigo: pin.trim().toUpperCase() })
        }, 3000);
        if (res.ok) {
          const data = await res.json();
          if (data.vidas>0)    showToast(`+${data.vidas} vidas añadidas ✔`,"ok");
          if (data.creditos>0) showToast(`+${data.creditos} créditos añadidos ✔`,"ok");
          setPin(""); await cargarDatos(); return;
        }
      } catch {}
      // Fallback Supabase
      const { data: { user } } = await supabase.auth.getUser();
      const { data: pinData } = await supabase.from("pin_codes")
        .select("id,lives_amount,px_amount,used,expires_at")
        .eq("code", pin.trim().toUpperCase()).eq("used",false).maybeSingle();
      if (!pinData) { showToast("Código inválido o ya utilizado","err"); return; }
      if (pinData.expires_at && new Date(pinData.expires_at) < new Date()) {
        showToast("Este código ha expirado","err"); return;
      }
      await supabase.from("pin_codes")
        .update({ used:true, used_by:user?.id, used_at:new Date().toISOString() })
        .eq("id",pinData.id);
      if (pinData.lives_amount>0 && perfil)
        await supabase.from("profiles")
          .update({ lives: perfil.vidas + pinData.lives_amount }).eq("id",perfil.id);
      if (pinData.px_amount>0 && perfil)
        await supabase.from("profiles")
          .update({ pitchx_balance: perfil.creditos + pinData.px_amount }).eq("id",perfil.id);
      if (pinData.lives_amount>0) showToast(`+${pinData.lives_amount} vidas añadidas ✔`,"ok");
      if (pinData.px_amount>0)    showToast(`+${pinData.px_amount} créditos añadidos ✔`,"ok");
      setPin(""); await cargarDatos();
    } catch { showToast("Error al validar el código","err"); }
    finally { setPinLoad(false); }
  };

  /* ── Solicitar retiro ── */
  const enviarRetiro = async () => {
    if (!perfil) return;
    const monto = parseFloat(formRetiro.creditos_solicitados);
    if (!monto || monto <= 0) { showToast("Ingresa un monto válido","warn"); return; }
    if (monto > perfil.creditos) { showToast("No tienes suficientes créditos","err"); return; }
    const minimoEnPx = config.minimo_retiro / tasaCambio;
    const minimoLibre = minimoEnPx / (1 - config.comision_retiro / 100);
    if (perfil.creditos < minimoLibre) {
      showToast(`Mínimo: ${Math.ceil(minimoLibre).toLocaleString()} créditos`,"warn"); return;
    }
    if (!formRetiro.nombre_beneficiario || !formRetiro.numero_documento
      || !formRetiro.metodo_pago || !formRetiro.numero_cuenta) {
      showToast("Completa todos los campos obligatorios","warn"); return;
    }
    try {
      const { data: retiroData, error } = await supabase.from("withdrawal_requests").insert({
        user_id:              perfil.id,
        creditos_solicitados: monto,
        monto_local:          monto * tasaCambio,
        moneda:               config.moneda,
        porcentaje_comision:  config.comision_retiro,
        monto_comision:       monto * config.comision_retiro / 100,
        monto_neto:           monto * (1 - config.comision_retiro / 100),
        nombre_beneficiario:  formRetiro.nombre_beneficiario,
        numero_documento:     formRetiro.numero_documento,
        tipo_documento:       formRetiro.tipo_documento,
        metodo_pago:          formRetiro.metodo_pago,
        numero_cuenta:        formRetiro.numero_cuenta,
        banco:                formRetiro.banco,
        tipo_cuenta:          formRetiro.tipo_cuenta,
        estado:               formRetiro.metodo_retiro === 'PUNTO_FISICO' ? 'APROBADO' : 'PENDIENTE',
        metodo_retiro:        formRetiro.metodo_retiro,
        }).select().single();

      if (error) throw error;

      // Si es PUNTO_FISICO → generar código inmediatamente
      if (formRetiro.metodo_retiro === 'PUNTO_FISICO' && retiroData) {
        const paisCodigo = (perfil.pais_codigo ?? '+57').replace('+','');
        const paisKey = paisCodigo==='57'?'CO':paisCodigo==='593'?'EC':paisCodigo==='52'?'MX':paisCodigo==='51'?'PE':paisCodigo==='54'?'AR':paisCodigo==='56'?'CL':paisCodigo==='58'?'VE':paisCodigo==='506'?'CR':paisCodigo==='507'?'PA':paisCodigo==='1'?'US':paisCodigo==='591'?'BO':paisCodigo==='55'?'BR':paisCodigo==='34'?'ES':'CO';
        const { data: tasa } = await supabase
          .from('tasas_cambio').select('tasa_usd,moneda').eq('pais_codigo', paisKey).maybeSingle();
        const tasaUsd = Number(tasa?.tasa_usd ?? 1);
        const expira = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
        const codigo = `${paisKey}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
        const montoNeto = monto * (1 - config.comision_retiro / 100);
        const { error: cgErr = null } = await supabase.from('codigos_ganancia').insert({
          jugador_id:  perfil.id,
          retiro_id:   retiroData.id,
          codigo,
          monto_px:    montoNeto,
          moneda:      tasa?.moneda ?? 'COP',
          monto_local: montoNeto * tasaUsd,
          tasa_cambio: tasaUsd,
          pais_codigo: paisKey,
          estado:      'ACTIVO',
          expira_en:   expira,
        });

        console.log('CG error:', cgErr);
        showToast(`✓ Código generado: ${codigo}`, 'ok');
      } else {
        showToast('Solicitud enviada. El equipo la revisará en 24–72h', 'ok');
      }

      setFormRetiro({
        creditos_solicitados:'', nombre_beneficiario:'',
        numero_documento:'', tipo_documento:'CEDULA',
        metodo_pago:'', numero_cuenta:'', banco:'', tipo_cuenta:'',
        metodo_retiro: 'TRANSFERENCIA'
      });
      await cargarDatos();
    } catch (err: any) {
      showToast(err.message ?? 'Error al enviar la solicitud','err');
    }
  };

  /* ── Helpers ── */
  const notiNoLeidas         = notificaciones.filter(n=>!n.leida).length;
  const totalGanancias       = ganancias.reduce((s,g)=>s+g.premio_creditos+g.premio_pozo,0);
  const gananciasDisponibles = ganancias.filter(g=>g.estado==="PENDIENTE_RETIRO")
                                 .reduce((s,g)=>s+g.premio_creditos+g.premio_pozo,0);
  const totalComisionRef     = gananciasRef.filter(g=>g.estado==="ACREDITADO")
                                 .reduce((s,g)=>s+g.creditos_ganados,0);
  const minimoEnPx = tasaCambio > 0 ? config.minimo_retiro / tasaCambio : config.minimo_retiro;
  const listo_retiro = perfil ? perfil.creditos >= minimoEnPx : false;
  const statusColor          = perfil?.estado_juego==="VIVO"?"#8dc63f":perfil?.estado_juego==="EN_COMA"?"#f59e0b":"#ef4444";
  const precisionPct         = perfil&&perfil.total_predicciones>0
                                 ? Math.round((perfil.predicciones_correctas/perfil.total_predicciones)*100) : 0;
  
  const eventosFiltrados = eventos.filter(ev => filter === "todos" || ev.tipo_evento === filter);

  const NAV = [
    { id:"radar",     icon:<Crosshair size={16}/>, label:"Radar"            },
    { id:"ganancias", icon:<Award size={16}/>,     label:"Mis ganancias"    },
    { id:"perfil",    icon:<User size={16}/>,      label:"Mi perfil"        },
    { id:"historial", icon:<ScrollText size={16}/>,label:"Historial"        },
    { id:"recargar",  icon:<Zap size={16}/>,       label:"Recargar"         },
    { id:"retiro",    icon:<Wallet size={16}/>,    label:"Solicitar retiro" },
    { id:"referidos", icon:<Users size={16}/>,     label:"Mis referidos"    },
    { id:"predicciones", icon:<Activity size={16}/>, label:"Mis predicciones" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500&display=swap');
        /* ── AJUSTES QUIRÚRGICOS: COLOR DE MONTOS Y BOTÓN DE RETIRO ── */
        /* Cambiar el color del texto de los montos en el Historial a verde oficial de forma limpia */
        .tx-amt.tx-pos { 
          color: #8dc63f !important; 
          font-weight: bold !important;
        }
        .tx-amt.tx-neg { 
          color: #ef4444 !important; 
          font-weight: bold !important;
        }
        
        /* Corregir el botón verde de retiros para que no se estire al 100% de la pantalla */
        .btn-g { 
          max-width: 320px !important; 
          width: 100% !important; 
          margin: 16px auto !important; 
          display: flex !important; 
          justify-content: center !important; 
          align-items: center !important; 
          border-radius: 4px !important;
        }
        @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        *{margin:0;padding:0;box-sizing:border-box;}
        .rd{display:flex;min-height:100vh;background:#0a0d14;font-family:'Roboto',sans-serif;color:#fff;}
        .rd-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;}
        @media(max-width:900px){.rd-ov.open{display:block;}}
        .sb{width:240px;background:#0b0e1a;border-right:1px solid rgba(141,198,63,.1);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:50;transition:transform .3s;overflow-y:auto;}
        @media(max-width:900px){.sb{transform:translateX(-100%);}.sb.open{transform:translateX(0);}}
        .sb-logo{padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.05);flex-shrink:0;}
        .sb-logo img{height:30px;width:auto;object-fit:contain;filter:drop-shadow(0 0 10px rgba(141,198,63,.3));}
        .sb-logo-fb{font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;color:#8dc63f;letter-spacing:2px;}
        .sb-player{padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:10px;flex-shrink:0;}
        .sb-av{width:38px;height:38px;border-radius:50%;background:rgba(141,198,63,.1);border:1.5px solid rgba(141,198,63,.3);display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-size:15px;font-weight:700;color:#8dc63f;flex-shrink:0;overflow:hidden;}
        .sb-av img{width:100%;height:100%;object-fit:cover;}
        .sb-pi-name{font-size:13px;font-weight:500;color:#fff;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;}
        .sb-pi-code{font-size:10px;color:rgba(255,255,255,.28);margin-top:3px;font-family:monospace;}
        .sb-bals{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(255,255,255,.05);border-top:1px solid rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.05);flex-shrink:0;}
        .sb-bal{background:#0b0e1a;padding:11px 14px;text-align:center;}
        .sb-bal-v{font-family:'Oswald',sans-serif;font-size:20px;font-weight:700;color:#8dc63f;line-height:1;}
        .sb-bal-l{font-size:9px;color:rgba(255,255,255,.25);letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;}
        .sb-nav{flex:1;padding:10px 0;overflow-y:auto;}
        .sb-grp{font-size:9px;color:rgba(255,255,255,.18);letter-spacing:2px;text-transform:uppercase;padding:10px 20px 4px;}
        .sb-item{display:flex;align-items:center;gap:10px;width:100%;padding:10px 20px;background:transparent;border:none;border-left:2px solid transparent;color:rgba(255,255,255,.35);font-family:'Roboto',sans-serif;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;text-align:left;}
        .sb-item:hover{color:rgba(255,255,255,.75);background:rgba(255,255,255,.03);}
        .sb-item.on{color:#8dc63f;background:linear-gradient(90deg,rgba(141,198,63,.08),transparent);border-left-color:#8dc63f;}
        .sb-pill{margin-left:auto;font-size:9px;padding:2px 7px;border-radius:3px;font-weight:700;letter-spacing:.5px;background:rgba(141,198,63,.12);color:#8dc63f;}
        .sb-pill-warn{background:rgba(245,158,11,.12);color:#f59e0b;}
        .sb-foot{padding:12px 20px;border-top:1px solid rgba(255,255,255,.05);flex-shrink:0;}
        .sb-out{display:flex;align-items:center;gap:8px;width:100%;padding:8px 0;background:transparent;border:none;color:rgba(239,68,68,.45);font-size:11px;font-family:'Roboto',sans-serif;cursor:pointer;transition:color .2s;}
        .sb-out:hover{color:#ef4444;}
        .mn{flex:1;margin-left:240px;display:flex;flex-direction:column;height:100vh;overflow-y:auto;}
        @media(max-width:900px){.mn{margin-left:0;}}
        .tb{padding:13px 24px;background:#0b0e1a;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40;}
        .tb-l{display:flex;align-items:center;gap:12px;}
        .tb-ham{display:none;background:transparent;border:none;color:rgba(255,255,255,.5);cursor:pointer;padding:4px;}
        @media(max-width:900px){.tb-ham{display:flex;}}
        .tb-title{font-family:'Oswald',sans-serif;font-size:13px;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:2px;text-transform:uppercase;}
        .tb-r{display:flex;align-items:center;gap:12px;}
        .tb-live{display:flex;align-items:center;gap:6px;font-size:10px;color:#8dc63f;font-weight:600;letter-spacing:1px;}
        .tb-dot{width:5px;height:5px;border-radius:50%;background:#8dc63f;animation:blink 1.5s infinite;}
        .noti-btn{position:relative;background:transparent;border:none;color:rgba(255,255,255,.4);cursor:pointer;padding:6px;border-radius:6px;transition:all .15s;display:flex;align-items:center;}
        .noti-btn:hover{color:#fff;background:rgba(255,255,255,.06);}
        .noti-badge{position:absolute;top:2px;right:2px;width:16px;height:16px;background:#ef4444;border-radius:50%;font-size:9px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;}
        .noti-panel{position:absolute;top:calc(100% + 8px);right:0;width:320px;background:#0f1420;border:1px solid rgba(255,255,255,.08);border-radius:10px;box-shadow:0 16px 48px rgba(0,0,0,.6);z-index:100;animation:fadeIn .2s ease;overflow:hidden;}
        .noti-head{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;}
        .noti-head-t{font-family:'Oswald',sans-serif;font-size:12px;font-weight:600;color:#fff;letter-spacing:1px;text-transform:uppercase;}
        .noti-item{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;transition:background .15s;}
        .noti-item:hover{background:rgba(255,255,255,.03);}
        .noti-item.unread{border-left:2px solid #8dc63f;}
        .noti-item-title{font-size:12px;font-weight:600;color:#fff;margin-bottom:3px;}
        .noti-item-msg{font-size:11px;color:rgba(255,255,255,.4);line-height:1.5;}
        .noti-item-date{font-size:10px;color:rgba(255,255,255,.2);margin-top:4px;}
        .noti-empty{padding:24px;text-align:center;font-size:12px;color:rgba(255,255,255,.3);}
        .bd{flex:1;padding:20px 24px;}
        @media(max-width:600px){.bd{padding:14px;}}
        @media(max-width:900px){.bd{padding-bottom:80px;}}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;}
        @media(max-width:700px){.stats{grid-template-columns:repeat(2,1fr);}}
        .stat-c{background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:12px 14px;display:flex;align-items:center;gap:10px;}
        .stat-ico{width:34px;height:34px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .ico-g{background:rgba(141,198,63,.1);color:#8dc63f;}.ico-b{background:rgba(56,189,248,.1);color:#38bdf8;}
        .ico-a{background:rgba(245,158,11,.1);color:#f59e0b;}.ico-r{background:rgba(239,68,68,.1);color:#ef4444;}
        .ico-p{background:rgba(168,85,247,.1);color:#a855f7;}
        .stat-v{font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;color:#fff;line-height:1;}
        .stat-l{font-size:9px;color:rgba(255,255,255,.28);letter-spacing:1px;text-transform:uppercase;margin-top:2px;}
        .sec-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;}
        .sec-t{font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:2px;text-transform:uppercase;display:flex;align-items:center;gap:8px;}
        .sec-t::before{content:'';width:3px;height:13px;background:#8dc63f;border-radius:2px;flex-shrink:0;}
        .flt-row{display:flex;gap:5px;flex-wrap:wrap;}
        .flt{padding:4px 10px;background:transparent;border:1px solid rgba(255,255,255,.08);border-radius:4px;color:rgba(255,255,255,.3);font-size:10px;font-weight:600;cursor:pointer;letter-spacing:.5px;text-transform:uppercase;transition:all .15s;}
        .flt:hover{border-color:rgba(141,198,63,.3);color:rgba(255,255,255,.6);}
        .flt.on{border-color:#8dc63f;color:#8dc63f;background:rgba(141,198,63,.06);}
        
        /* ── ESTILOS REDISEÑADOS PARA EL RADAR (CODERE STYLE) ── */
        .hero-banner { width: 100%; height: 220px; border-radius: 4px; background: linear-gradient(90deg, #0a0d14 10%, transparent 80%), url('/img/pintura1.jpg') center/cover no-repeat; position: relative; margin-bottom: 24px; display: flex; align-items: center; padding: 30px 40px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
        .hero-badge { position: absolute; top: 16px; left: 40px; background: #8dc63f; color: #0a0d14; font-family: 'Oswald', sans-serif; font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 2px; letter-spacing: 1px; }
        .hero-title { font-family: 'Oswald', sans-serif; font-size: 32px; font-weight: 700; color: #fff; text-transform: uppercase; line-height: 1.1; max-width: 400px; margin-bottom: 8px; text-shadow: 0 2px 10px rgba(0,0,0,0.8); }
        .hero-subtitle { font-size: 13px; color: rgba(255,255,255,0.7); max-width: 350px; line-height: 1.5; }

        .ev-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
        .ev-row { display: flex; flex-direction: column; background: #121820; border: 1px solid #1A222D; border-radius: 4px; transition: background 0.15s; }
        .ev-row:hover { background: #151C26; border-color: rgba(141,198,63,0.3); }
        .ev-row.vip { border-left: 3px solid #f59e0b; }
        
        .ev-main { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; width: 100%; flex-wrap: wrap; gap: 16px; }
        .ev-info { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 200px; }
        
        .ev-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .ev-league { font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; }
        .ev-time { font-size: 10px; color: #fff; background: #1A222D; padding: 2px 6px; border-radius: 2px; }
        .b-vip { font-size: 9px; font-weight: 700; color: #f59e0b; padding: 2px 4px; border: 1px solid rgba(245,158,11,0.3); border-radius: 2px; }
        .b-pub { font-size: 9px; font-weight: 700; color: #8dc63f; padding: 2px 4px; border: 1px solid rgba(141,198,63,0.3); border-radius: 2px; }
        
        .ev-teams { display: flex; flex-direction: column; gap: 4px; }
        .ev-team { font-family: 'Roboto', sans-serif; font-size: 13px; font-weight: 500; color: #fff; display: flex; align-items: center; gap: 6px; }
        .ev-team::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.2); }
        
        .ev-meta { font-size: 10px; color: #8dc63f; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-top: 2px; }

        .ev-odds-box { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .odd-btn { width: 68px; height: 48px; background: #262D37; border-radius: 3px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; }
        .odd-btn:hover { background: #8dc63f; color: #0a0d14; }
        .odd-btn:hover .odd-lbl { color: #0a0d14; opacity: 0.8; }
        .odd-lbl { font-size: 9px; color: rgba(255,255,255,0.4); text-transform: uppercase; font-weight: 600; margin-bottom: 2px; transition: color 0.15s; }
        .odd-val { font-family: 'Oswald', sans-serif; font-size: 14px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }

        .ev-bet-bar { width: 100%; border-top: 1px solid #1A222D; padding: 8px 16px; display: flex; gap: 8px; align-items: center; background: rgba(0,0,0,0.1); }
        .ev-bet-in { flex: 1; background: #0b0e1a !important; border: 1px solid #262D37; border-radius: 3px; padding: 8px 12px; color: #fff !important; font-size: 12px; outline: none; transition: border-color 0.2s; }
        .ev-bet-in:focus { border-color: #8dc63f; }
        .ev-btn { padding: 8px 24px; border: none; border-radius: 3px; font-family: 'Oswald', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .btn-verde { background: #8dc63f; color: #0a0d14; } .btn-verde:hover { background: #7ab52f; }
        .btn-gris { background: #262D37; color: rgba(255,255,255,0.4); } .btn-gris:hover { background: #323C4A; color: #fff; }

        .panel{background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:20px;margin-bottom:16px;}
        .panel-title{font-family:'Oswald',sans-serif;font-size:13px;font-weight:600;color:#fff;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:8px;}
        .panel-desc{font-size:12px;color:rgba(255,255,255,.3);line-height:1.65;margin-bottom:14px;}
        .lbl{font-size:10px;color:rgba(255,255,255,.3);letter-spacing:1px;text-transform:uppercase;margin-bottom:5px;}
        .inp{width:100%;background:#000 !important;border:1px solid rgba(255,255,255,.08);border-radius:6px;padding:10px 14px;color:#fff !important;font-size:12px;font-family:'Roboto',sans-serif;outline:none;transition:border-color .2s;margin-bottom:10px;}
        .inp:focus{border-color:#00C853;}
        .inp::placeholder{color:rgba(255,255,255,.18);font-size:11px;}
        .inp-pin{font-family:'Oswald',sans-serif;font-size:14px;letter-spacing:3px;color:#00C853 !important;}
        select.inp option{background:#111827;}
        .inp-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        @media(max-width:500px){.inp-row{grid-template-columns:1fr;}}
        .btn-row{display:flex;gap:10px;margin-top:4px;}
        @media(max-width:500px){.btn-row{flex-direction:column;}}
        .gan-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:14px 16px;display:flex;align-items:center;gap:12px;margin-bottom:8px;transition:border-color .15s;}
        .gan-card:hover{border-color:rgba(141,198,63,.2);}
        .gan-card.pendiente{border-left:3px solid #8dc63f;}.gan-card.retirado{border-left:3px solid rgba(255,255,255,.1);}
        .perf-grid{display:grid;grid-template-columns:260px 1fr;gap:20px;}
        @media(max-width:820px){.perf-grid{grid-template-columns:1fr;}}
        .id-card{background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:24px;display:flex;flex-direction:column;align-items:center;gap:14px;}
        .id-av{width:80px;height:80px;border-radius:50%;background:rgba(141,198,63,.1);border:2px solid rgba(141,198,63,.3);display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-size:30px;font-weight:700;color:#8dc63f;overflow:hidden;}
        .id-av img{width:100%;height:100%;object-fit:cover;}
        .id-name{font-family:'Oswald',sans-serif;font-size:17px;font-weight:700;color:#fff;text-align:center;}
        .id-code{font-family:monospace;font-size:11px;color:rgba(255,255,255,.3);letter-spacing:1px;}
        .id-status{padding:5px 14px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;}
        .id-fields{width:100%;display:flex;flex-direction:column;gap:10px;border-top:1px solid rgba(255,255,255,.06);padding-top:14px;}
        .id-f-lbl{font-size:9px;color:rgba(255,255,255,.2);letter-spacing:1.5px;text-transform:uppercase;}
        .id-f-val{font-size:13px;color:rgba(255,255,255,.7);font-weight:500;margin-top:2px;}
        .barcode{height:30px;width:100%;background:repeating-linear-gradient(90deg,rgba(141,198,63,.3) 0,rgba(141,198,63,.3) 2px,transparent 2px,transparent 4px,rgba(141,198,63,.15) 4px,rgba(141,198,63,.15) 5px,transparent 5px,transparent 8px);border-radius:2px;opacity:.5;}
        .prec-bar-bg{width:100%;height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;}
        .prec-bar{height:100%;background:#8dc63f;border-radius:3px;transition:width .5s ease;}
        .ref-code-box{background:rgba(141,198,63,.06);border:1px solid rgba(141,198,63,.2);border-radius:8px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;}
        .ref-code{font-family:'Oswald',sans-serif;font-size:20px;font-weight:700;color:#8dc63f;letter-spacing:3px;}
        .copy-btn{padding:7px 14px;background:rgba(141,198,63,.15);border:none;border-radius:5px;color:#8dc63f;font-size:11px;font-weight:700;cursor:pointer;font-family:'Oswald',sans-serif;letter-spacing:.5px;transition:background .15s;}
        .copy-btn:hover{background:rgba(141,198,63,.25);}
        .bn{display:none;position:fixed;bottom:0;left:0;right:0;background:#0b0e1a;border-top:1px solid rgba(255,255,255,.06);z-index:48;padding:8px 0 env(safe-area-inset-bottom);}
        @media(max-width:900px){.bn{display:flex;}}
        .bn-wrap{display:flex;justify-content:space-around;align-items:center;width:100%;}
        .bn-btn{display:flex;flex-direction:column;align-items:center;gap:4px;background:transparent;border:none;color:rgba(255,255,255,.3);font-size:9px;font-family:'Roboto',sans-serif;font-weight:500;cursor:pointer;padding:4px 6px;transition:color .15s;flex:1;text-align:center;}
        .bn-btn.on{color:#8dc63f;}
        .spin-ico{animation:spin .8s linear infinite;}

        /* ── REPARACIÓN TÁCTICA: BOTONES Y FORMULARIOS (ESTILO CODERE) ── */
        .btn-g { padding: 12px 24px; background: #8dc63f; border: none; border-radius: 4px; color: #0a0d14; font-family: 'Oswald', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; cursor: pointer; transition: background 0.15s; }
        .btn-g:hover { background: #7ab52f; }
        .btn-g:disabled { opacity: 0.5; cursor: not-allowed; background: #262D37; color: rgba(255,255,255,0.3); }
        .inp { width: 100%; background: #121820 !important; border: 1px solid #1A222D; border-radius: 4px; padding: 12px 14px; color: #fff !important; font-size: 13px; font-family: 'Roboto', sans-serif; outline: none; transition: border-color 0.2s; margin-bottom: 12px; }
        .inp:focus { border-color: #8dc63f; }
        .inp::placeholder { color: rgba(255,255,255,0.3); }
        select.inp { appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5%201.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 14px top 50%; background-size: 10px auto; }
        .tx-item, .ref-item, .gan-card { background: #121820 !important; border: 1px solid #1A222D !important; border-radius: 4px !important; padding: 12px 16px !important; margin-bottom: 8px !important; }
        .tx-item:hover, .ref-item:hover, .gan-card:hover { background: #151C26 !important; border-color: rgba(141,198,63,0.2) !important; }
        .tx-desc, .ref-item rgba, .gan-card rgba { color: rgba(255, 255, 255, 0.4) !important; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      <div className={`rd-ov ${sideOpen?"open":""}`} onClick={()=>setSideOpen(false)}/>

      <div className="rd">
        {/* ═════ SIDEBAR ═════ */}
        <aside className={`sb ${sideOpen?"open":""}`}>
          <div className="sb-logo">
            <img src="/img/kicklast02.png" alt="Kick Last"
              onError={e=>{
                const el=e.currentTarget as HTMLImageElement;
                el.style.display="none";
                const fb=el.nextElementSibling as HTMLElement;
                if(fb) fb.style.display="block";
              }}/>
            <span className="sb-logo-fb" style={{display:"none"}}>KICK LAST</span>
          </div>
          {perfil&&(
            <div className="sb-player">
              <div className="sb-av">
                {perfil.avatar_url?<img src={perfil.avatar_url} alt={perfil.nombre}/>:perfil.nombre.charAt(0).toUpperCase()}
              </div>
              <div style={{overflow:"hidden"}}>
                <div className="sb-pi-name">{perfil.nombre}</div>
                <div className="sb-pi-code">{perfil.codigo_jugador}</div>
              </div>
            </div>
          )}
          {perfil&&(
            <div className="sb-bals">
              <div className="sb-bal">
                <div className="sb-bal-v">{perfil.vidas}</div>
                <div className="sb-bal-l">Vidas</div>
              </div>
              <div className="sb-bal">
                <div className="sb-bal-v">{perfil.creditos>=1000?`${(perfil.creditos/1000).toFixed(1)}K`:perfil.creditos}</div>
                <div className="sb-bal-l">Créditos</div>
              </div>
            </div>
          )}
          <nav className="sb-nav">
            <div className="sb-grp">Panel de juego</div>
            {NAV.slice(0,4).map(n=>(
              <button key={n.id} className={`sb-item ${tab===n.id?"on":""}`}
                onClick={()=>{setTab(n.id as Tab);setSideOpen(false);}}>
                {n.icon} {n.label}
                {n.id==="radar"&&<span className="sb-pill">Live</span>}
                {n.id==="ganancias"&&gananciasDisponibles>0&&<span className="sb-pill sb-pill-warn">!</span>}
              </button>
            ))}
            <div className="sb-grp">Economía</div>
            {NAV.slice(4).map(n=>(
              <button key={n.id} className={`sb-item ${tab===n.id?"on":""}`}
                onClick={()=>{setTab(n.id as Tab);setSideOpen(false);}}>
                {n.icon} {n.label}
                {n.id==="retiro"&&listo_retiro&&<span className="sb-pill">✔</span>}
              </button>
            ))}
          </nav>
          <div className="sb-foot">
            <button className="sb-out" onClick={signOut}><LogOut size={15}/> Cerrar sesión</button>
          </div>
        </aside>

        {/* ═════ MAIN ═════ */}
        <div className="mn">
          <div className="tb">
            <div className="tb-l">
              <button className="tb-ham" onClick={()=>setSideOpen(true)}><Menu size={22}/></button>
              <span className="tb-title">
                {tab==="radar"&&"Radar — mercados"}
                {tab==="ganancias"&&"Mis ganancias"}
                {tab==="perfil"&&"Mi perfil"}
                {tab==="historial"&&"Historial"}
                {tab==="recargar"&&"Recargar"}
                {tab==="retiro"&&"Solicitar retiro"}
                {tab==="referidos"&&"Mis referidos"}
                {tab==="predicciones"&&"Mis predicciones"}
                {tab==="notificaciones"&&"Notificaciones"}
              </span>
            </div>
            <div className="tb-r">
              <span className="tb-live"><span className="tb-dot"/> Sistema activo · Mundial 2026</span>
              <div style={{position:"relative"}}>
                <button className="noti-btn" onClick={()=>setNotiOpen(o=>!o)}>
                  <Bell size={18}/>
                  {notiNoLeidas>0&&<span className="noti-badge">{notiNoLeidas>9?"9+":notiNoLeidas}</span>}
                </button>
                {notiOpen&&(
                  <div className="noti-panel">
                    <div className="noti-head">
                      <span className="noti-head-t">Notificaciones</span>
                      <button onClick={()=>setNotiOpen(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",cursor:"pointer"}}><X size={14}/></button>
                    </div>
                    {notificaciones.length===0?(
                      <div className="noti-empty">Sin notificaciones</div>
                    ):(
                      notificaciones.slice(0,8).map(n=>(
                        <div key={n.id} className={`noti-item ${!n.leida?"unread":""}`} onClick={()=>marcarLeida(n.id)}>
                          <div className="noti-item-title">{n.titulo}</div>
                          <div className="noti-item-msg">{n.mensaje}</div>
                          <div className="noti-item-date">{new Date(n.fecha_creacion).toLocaleDateString("es-CO",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bd">
            {/* ── RADAR ── */}
            {tab==="radar"&&(
              <>
                {gananciasDisponibles>0&&(
                  <div style={{background:"rgba(141,198,63,.08)",border:"1px solid rgba(141,198,63,.25)",borderRadius:8,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:16,cursor:"pointer"} as any} onClick={()=>setTab("ganancias")}>
                    <Award size={18} style={{color:"#8dc63f",flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:"#8dc63f"}}>¡Tienes ganancias disponibles!</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginTop:2}}>{gananciasDisponibles.toLocaleString()} créditos pendientes de retiro</div>
                    </div>
                    <ChevronRight size={16} style={{color:"#8dc63f"}}/>
                  </div>
                )}
                
                <div className="stats">
                  <div className="stat-c"><div className="stat-ico ico-g"><Heart size={16}/></div><div><div className="stat-v">{perfil?.vidas??"—"}</div><div className="stat-l">Vidas</div></div></div>
                  <div className="stat-c"><div className="stat-ico ico-b"><BarChart2 size={16}/></div><div><div className="stat-v">{perfil?.creditos?.toLocaleString()??"—"}</div><div className="stat-l">Créditos</div></div></div>
                  <div className="stat-c"><div className="stat-ico ico-a"><Flame size={16}/></div><div><div className="stat-v">{perfil?.racha??0}</div><div className="stat-l">Racha</div></div></div>
                  <div className="stat-c"><div className="stat-ico ico-g"><Activity size={16}/></div><div><div className="stat-v" style={{fontSize:13,color:statusColor}}>{perfil?.estado_juego??"VIVO"}</div><div className="stat-l">Estado</div></div></div>
                </div>

                <div className="hero-banner">
                  <span className="hero-badge">DESTACADO</span>
                  <div>
                    <h1 className="hero-title"></h1>
                    <p className="hero-subtitle"></p>
                  </div>
                </div>

                <div className="flt-row">
                  {[{id:"todos",l:"Todos los eventos"},{id:"TORNEO",l:"Torneos"},{id:"COMBINADA",l:"Combinadas"},{id:"INDIVIDUAL",l:"Individual"},{id:"VIP",l:"VIP ⭐"}].map(f=>(
                    <button key={f.id} className={`flt ${filter===f.id?"on":""}`} onClick={()=>setFilter(f.id as any)}>{f.l}</button>
                  ))}
                </div>

                {loading?(
                  <div className="empty"><Activity size={32} className="spin-ico" style={{margin:"0 auto"}}/><div className="empty-t">Cargando mercados...</div></div>
                ):eventosFiltrados.length===0?(
                  <div className="empty"><Trophy size={32} style={{margin:"0 auto",opacity:0.3}}/><div className="empty-t">No hay eventos activos</div></div>
                ):(
                  <div className="ev-list">
                    <div className="sec-h"><div className="sec-t">Mercados Principales</div></div>
                    {eventosFiltrados.map(ev=>{
                      const sinSaldo=(ev.costo_vidas>0&&(perfil?.vidas??0)<ev.costo_vidas)||(ev.costo_creditos>0&&(perfil?.creditos??0)<ev.costo_creditos);
                      const hasOdds=ev.cuota_local&&ev.cuota_empate&&ev.cuota_visitante;
                      
                      return (
                        <div key={ev.id} className={`ev-row ${ev.tipo_evento==="VIP"?"vip":""}`}>
                          <div className="ev-main">
                            
                            <div className="ev-info">
                              <div className="ev-head">
                                <span className="ev-league">{ev.sede || "Mundial FIFA 2026"}</span>
                                {ev.fecha_evento && <span className="ev-time">{new Date(ev.fecha_evento).toLocaleDateString("es-CO",{month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"})}</span>}
                                {ev.tipo_evento === "VIP" && <span className="b-vip">⭐ VIP</span>}
                                {ev.bonus_activo && (ev.bonus_px ?? 0) > 0 && <span className="b-pub">🎁 BONUS</span>}
                              </div>
                              <div className="ev-teams">
                                <div className="ev-team">{ev.equipo_local || ev.nombre}</div>
                                {ev.equipo_visitante && <div className="ev-team">{ev.equipo_visitante}</div>}
                              </div>
                              <div className="ev-meta">
                                {ev.costo_vidas > 0 ? `${ev.costo_vidas} Vidas de ingreso` : `${ev.costo_creditos} PX de ingreso`}
                              </div>
                            </div>

                            {hasOdds ? (
                              <div className="ev-odds-box">
                                {[{lbl:"1", val:ev.cuota_local, r:"1"}, {lbl:"X", val:ev.cuota_empate, r:"X"}, {lbl:"2", val:ev.cuota_visitante, r:"2"}].map(o => (
                                  <div key={o.r} className="odd-btn" onClick={() => hacerApuesta(ev, o.r as any)}>
                                    <span className="odd-lbl">{o.lbl}</span>
                                    <span className="odd-val">{o.val}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="ev-odds-box">
                                {sinSaldo ? (
                                  <button className="ev-btn btn-gris" onClick={()=>setTab("recargar")}><Zap size={12}/> Recargar PX</button>
                                ) : (
                                  <button className="btn-g" onClick={async ()=>{
                                    const { data: { user } } = await supabase.auth.getUser();
                                    if (!user) { router.push('/login'); return; }
                                    if (ev.tipo_evento === 'INDIVIDUAL') { router.push('/individual'); return; }
                                    if (ev.tipo_evento === 'COMBINADA') { router.push('/combinadas'); return; }
                                    const { data: entrada } = await supabase.from('tournament_entries').select('id').eq('user_id', user.id).eq('tournament_id', ev.id).maybeSingle();
                                    if (entrada) { router.push(`/campo-de-batalla/${ev.slug}`); } else { setEventoSeleccionado(ev as unknown as EventoJuego); }
                                  }}>
                                    Entrar al evento
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {hasOdds && (
                            <div className="ev-bet-bar">
                              <input type="number" className="ev-bet-in" placeholder="Ingresa monto a apostar (mín. 50 PX)" value={betAmts[ev.id]||""} onChange={e=>setBetAmts(b=>({...b,[ev.id]:e.target.value}))}/>
                              {sinSaldo ? (
                                <button className="ev-btn btn-gris" onClick={()=>setTab("recargar")}><Zap size={12}/> Recargar PX</button>
                              ) : (
                                <button className="ev-btn btn-verde" onClick={async ()=>{
                                  const { data: { user } } = await supabase.auth.getUser();
                                  if (!user) { router.push('/login'); return; }
                                  if (ev.tipo_evento === 'INDIVIDUAL') { router.push('/individual'); return; }
                                  if (ev.tipo_evento === 'COMBINADA') { router.push('/combinadas'); return; }
                                  const { data: entrada } = await supabase.from('tournament_entries').select('id').eq('user_id', user.id).eq('tournament_id', ev.id).maybeSingle();
                                  if (entrada) { router.push(`/campo-de-batalla/${ev.slug}`); } else { setEventoSeleccionado(ev as unknown as EventoJuego); }
                                }}>
                                  <ChevronRight size={14}/> Entrar
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── GANANCIAS ── */}
            {tab==="ganancias"&&(
              <>
                <div className="stats" style={{marginBottom:20}}>
                  <div className="stat-c"><div className="stat-ico ico-g"><Award size={16}/></div><div><div className="stat-v">{totalGanancias.toLocaleString()}</div><div className="stat-l">Total ganado</div></div></div>
                  <div className="stat-c"><div className="stat-ico ico-a"><Wallet size={16}/></div><div><div className="stat-v">{gananciasDisponibles.toLocaleString()}</div><div className="stat-l">Disponible</div></div></div>
                  <div className="stat-c"><div className="stat-ico ico-p"><Gift size={16}/></div><div><div className="stat-v">{totalComisionRef.toLocaleString()}</div><div className="stat-l">Por referidos</div></div></div>
                  <div className="stat-c"><div className="stat-ico ico-b"><DollarSign size={16}/></div><div><div className="stat-v">{config.moneda}</div><div className="stat-l">Tu moneda</div></div></div>
                </div>
                {codigoGananciaActivo && (
                  <div style={{background:"#121820", border:"1px solid #1A222D", borderLeft:"3px solid #8dc63f", borderRadius:4, padding:"16px 18px", marginBottom:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                      <div style={{background:"rgba(141,198,63,0.1)", padding:6, borderRadius:4}}>
                        <Trophy size={16} style={{color:"#8dc63f",flexShrink:0}}/>
                      </div>
                      <div>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:"#fff",textTransform:"uppercase",letterSpacing:1}}>Ticket de Ganancia Activo</div>
                        <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginTop:2}}>Presenta este código en un punto físico para cobrar.</div>
                      </div>
                    </div>
                    <div style={{background:"#0a0d14", border:"1px solid #1A222D", borderRadius:4, padding:"16px", marginBottom:12, textAlign:"center"}}>
                      <div style={{fontSize:10,color:"rgba(255,255,255,.4)",letterSpacing:2,textTransform:"uppercase",marginBottom:4,fontFamily:"'Oswald',sans-serif"}}>CÓDIGO DE RETIRO</div>
                      <div style={{fontFamily:"monospace",fontSize:24,fontWeight:700,color:"#8dc63f",letterSpacing:4}}>{codigoGananciaActivo.codigo}</div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                      <div style={{background:"#0a0d14", border:"1px solid #1A222D", borderRadius:4, padding:"10px 12px"}}>
                        <div style={{fontSize:9,color:"rgba(255,255,255,.4)",textTransform:"uppercase",marginBottom:2}}>Monto a cobrar</div>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:700,color:"#fff"}}>{simboloMoneda}{Number(codigoGananciaActivo.monto_local??0).toLocaleString("es-CO")} {codigoGananciaActivo.moneda}</div>
                      </div>
                      <div style={{background:"#0a0d14", border:"1px solid #1A222D", borderRadius:4, padding:"10px 12px"}}>
                        <div style={{fontSize:9,color:"rgba(255,255,255,.4)",textTransform:"uppercase",marginBottom:2}}>Vence</div>
                        <div style={{fontSize:12,color:"#f59e0b",fontWeight:600}}>{new Date(codigoGananciaActivo.expira_en).toLocaleDateString("es-CO",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
                      </div>
                    </div>
                    <button onClick={()=>{navigator.clipboard.writeText(codigoGananciaActivo.codigo);showToast("Código copiado","ok");}} style={{width:"100%",padding:"12px",background:"#262D37",border:"none",borderRadius:4,color:"#fff",fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",transition:"background 0.2s",textTransform:"uppercase",letterSpacing:1}}>
                      Copiar código
                    </button>
                  </div>
                )}
                <BarraRetiro actual={perfil?.creditos??0} minimo={config.minimo_retiro} moneda={config.moneda}/>
                <div style={{marginBottom:20}}>
                  {listo_retiro?(
                    <button className="btn-g" onClick={()=>setTab("retiro")}><Wallet size={15} style={{marginRight:8}}/>Solicitar retiro ahora</button>
                  ):(
                    <button className="btn-g" style={{width:"100%",background:"rgba(255,255,255,.06)",color:"rgba(255,255,255,.3)",cursor:"not-allowed"}} disabled><Lock size={15} style={{marginRight:8}}/>Retiro bloqueado — mínimo {config.minimo_retiro.toLocaleString()} créditos</button>
                  )}
                </div>
                <div className="sec-h"><div className="sec-t">Historial de premios</div></div>
                {ganancias.length===0?(
                  <div className="empty"><Trophy size={32} style={{margin:"0 auto",opacity:.3}}/><div className="empty-t">Aún no tienes ganancias</div><div className="empty-s">Participa en eventos y predicciones para ganar créditos</div></div>
                ):(
                  ganancias.map(g=>(
                    <div className={`tx-amt ${tx.creditos>0?"tx-pos":"tx-neg"}`}>
                      <div style={{width:36,height:36,borderRadius:8,flexShrink:0,background:g.estado==="PENDIENTE_RETIRO"?"rgba(141,198,63,.1)":"rgba(255,255,255,.04)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <Trophy size={16} style={{color:g.estado==="PENDIENTE_RETIRO"?"#8dc63f":"rgba(255,255,255,.3)"}}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:600,color:"#fff"}}>{g.evento_nombre}</div>
                        <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginTop:3}}>{new Date(g.fecha).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"})}</div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:700,color:"#8dc63f"} as any}>+{(g.premio_creditos+g.premio_pozo).toLocaleString()}</div>
                        <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:3,letterSpacing:.5,background:g.estado==="PENDIENTE_RETIRO"?"rgba(141,198,63,.12)":"rgba(255,255,255,.06)",color:g.estado==="PENDIENTE_RETIRO"?"#8dc63f":"rgba(255,255,255,.3)"}}>{g.estado==="PENDIENTE_RETIRO"?"DISPONIBLE":"RETIRADO"}</span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* ── PERFIL ── */}
            {tab==="perfil"&&perfil&&(<>
              <div className="perf-grid">
                <div className="id-card">
                  <div className="id-av">{perfil.avatar_url?<img src={perfil.avatar_url} alt={perfil.nombre}/>:perfil.nombre.charAt(0).toUpperCase()}</div>
                  <div className="id-name">{perfil.nombre}</div>
                  <div className="id-code">{perfil.codigo_jugador}</div>
                  <div className="id-status" style={{background:`${statusColor}18`,color:statusColor}}>• {perfil.estado_juego}</div>
                  <div className="id-fields">
                    {[{lbl:"Nombre completo",val:perfil.nombre_completo},{lbl:"Correo",val:perfil.email},{lbl:"País",val:`${perfil.pais} (${perfil.moneda})`},{lbl:"Teléfono",val:perfil.telefono||"—"}].map(f=>(
                      <div key={f.lbl}><div className="id-f-lbl">{f.lbl}</div><div className="id-f-val">{f.val||"—"}</div></div>
                    ))}
                  </div>
                  <div className="barcode"/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div className="stats" style={{marginBottom:0}}>
                    <div className="stat-c"><div className="stat-ico ico-g"><Heart size={16}/></div><div><div className="stat-v">{perfil.vidas}</div><div className="stat-l">Vidas</div></div></div>
                    <div className="stat-c"><div className="stat-ico ico-b"><BarChart2 size={16}/></div><div><div className="stat-v">{perfil.creditos.toLocaleString()}</div><div className="stat-l">Créditos</div></div></div>
                    <div className="stat-c"><div className="stat-ico ico-a"><Flame size={16}/></div><div><div className="stat-v">{perfil.racha}</div><div className="stat-l">Racha</div></div></div>
                    <div className="stat-c"><div className="stat-ico ico-g"><Star size={16}/></div><div><div className="stat-v">{perfil.mejor_racha}</div><div className="stat-l">Mejor racha</div></div></div>
                  </div>
                  <div className="panel">
                    <div className="panel-title"><TrendingUp size={15} style={{color:"#8dc63f"}}/> Precisión</div>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:12,color:"rgba(255,255,255,.4)"}}>
                      <span>{perfil.predicciones_correctas} correctas de {perfil.total_predicciones}</span>
                      <span style={{color:"#8dc63f",fontWeight:700}}>{precisionPct}%</span>
                    </div>
                    <div className="prec-bar-bg"><div className="prec-bar" style={{width:`${precisionPct}%`}}/></div>
                  </div>
                  <div className="panel">
                    <div className="panel-title"><Gift size={15} style={{color:"#8dc63f"}}/> Mi código de referido</div>
                    <div className="ref-code-box">
                      <span className="ref-code">{perfil.codigo_referido}</span>
                      <button className="copy-btn" onClick={()=>{
                        navigator.clipboard.writeText(`${window.location.origin}/register?ref=${perfil.codigo_referido}`);
                        showToast("Enlace copiado al portapapeles","ok");
                      }}>Copiar enlace</button>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-title"><Shield size={15} style={{color:"#8dc63f"}}/> Seguridad</div>
                    <div className="panel-desc" style={{marginBottom:0}}>Tu cuenta está verificada. Para cambiar contraseña usa "Recuperar contraseña" en el login.</div>
                  </div>
                </div>
              </div>
              <PerfilExtendido userId={perfil.id}/>
            </>)}

            {/* ── HISTORIAL ── */}
            {tab==="historial"&&(
              <>
                <div className="sec-h" style={{marginBottom:16}}><div className="sec-t">Historial de transacciones</div></div>
                {transacciones.length===0?(
                  <div className="empty"><ScrollText size={32} style={{margin:"0 auto",opacity:.3}}/><div className="empty-t">Sin transacciones aún</div></div>
                ):(
                  transacciones.map(tx=>{
                    const pos=tx.creditos>0||tx.vidas>0;
                    return(
                      <div key={tx.id} className="tx-item">
                        <div style={{width:32,height:32,borderRadius:8,background:pos?"rgba(141,198,63,.1)":"rgba(239,68,68,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {pos?<TrendingUp size={14} style={{color:"#8dc63f"}}/>:<Activity size={14} style={{color:"#ef4444"}}/>}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div className="tx-type">{tx.tipo.replace(/_/g," ")}</div>
                          <div className="tx-desc">{tx.descripcion||"—"}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          {tx.creditos!==0&&<div className={`tx-amt ${tx.creditos>0?"tx-pos":"tx-neg"}`}>{tx.creditos>0?"+":""}{tx.creditos} cr</div>}
                          {tx.vidas!==0&&<div className={`tx-amt ${tx.vidas>0?"tx-pos":"tx-neg"}`} style={{fontSize:12}}>{tx.vidas>0?"+":""}{tx.vidas} vida{Math.abs(tx.vidas)!==1?"s":""}</div>}
                          <div style={{fontSize:10,color:"rgba(255,255,255,.2)",marginTop:2}}>{new Date(tx.created_at).toLocaleDateString("es-CO")}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* ── RECARGAR ── */}
            {tab==="recargar"&&(
              <>
                <div className="panel">
                  <div className="panel-title"><QrCode size={15} style={{color:"#8dc63f"}}/> Canjear código PIN</div>
                  <div className="panel-desc">Compraste un código en un punto autorizado — ingrésalo aquí para recargar tus vidas o créditos.</div>
                  <div className="btn-row">
                    <input type="text" className="inp inp-pin" placeholder="LASTKICK-XXXX-XXXX"
                      value={pin} onChange={e=>setPin(e.target.value.toUpperCase())} style={{flex:1,marginBottom:0}}/>
                    <button className="btn-g" onClick={canjearPin} disabled={pinLoad}>{pinLoad?"Validando...":"Validar"}</button>
                  </div>
                </div>
                <div className="panel">
                  <div className="panel-title"><Zap size={15} style={{color:"#38bdf8"}}/> Compra digital</div>
                  <div className="panel-desc">Adquiere paquetes con tarjeta, transferencia o cripto mediante nuestra pasarela segura.</div>
                  <button className="btn-g" onClick={()=>router.push("/recharge")}>Ir a la tienda oficial</button>
                </div>
              </>
            )}

            {/* ── RETIRO ── */}
            {tab==="retiro"&&(
              <div className="panel">
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>¿Cómo quieres cobrar?</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <button
                      onClick={()=>setFormRetiro(f=>({...f,metodo_retiro:"TRANSFERENCIA"}))}
                      style={{
                        padding:"14px 12px",border:`1px solid ${formRetiro.metodo_retiro==="TRANSFERENCIA"?"rgba(56,189,248,.4)":"rgba(255,255,255,.08)"}`,
                        borderRadius:8,background:formRetiro.metodo_retiro==="TRANSFERENCIA"?"rgba(56,189,248,.08)":"rgba(255,255,255,.03)",
                        color:formRetiro.metodo_retiro==="TRANSFERENCIA"?"#38bdf8":"rgba(255,255,255,.4)",
                        cursor:"pointer",transition:"all .15s",display:"flex",flexDirection:"column",alignItems:"center",gap:8
                      } as any}
                    >
                      <span style={{fontSize:24}}>🏦</span>
                      <div>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:700,letterSpacing:.5}}>Transferencia</div>
                        <div style={{fontSize:10,marginTop:2,opacity:.7}}>Recibo en mi cuenta bancaria</div>
                      </div>
                    </button>
                    <button
                      onClick={()=>setFormRetiro(f=>({...f,metodo_retiro:"PUNTO_FISICO"}))}
                      style={{
                        padding:"14px 12px",border:`1px solid ${formRetiro.metodo_retiro==="PUNTO_FISICO"?"rgba(141,198,63,.4)":"rgba(255,255,255,.08)"}`,
                        borderRadius:8,background:formRetiro.metodo_retiro==="PUNTO_FISICO"?"rgba(141,198,63,.08)":"rgba(255,255,255,.03)",
                        color:formRetiro.metodo_retiro==="PUNTO_FISICO"?"#8dc63f":"rgba(255,255,255,.4)",
                        cursor:"pointer",transition:"all .15s",display:"flex",flexDirection:"column",alignItems:"center",gap:8
                      } as any}
                    >
                      <span style={{fontSize:24}}>🏪</span>
                      <div>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:700,letterSpacing:.5}}>Punto físico</div>
                        <div style={{fontSize:10,marginTop:2,opacity:.7}}>Cobro en efectivo con código</div>
                      </div>
                    </button>
                  </div>
                </div>

                {formRetiro.metodo_retiro === "PUNTO_FISICO" && (
                  <div style={{
                    padding:"12px 14px",background:"rgba(141,198,63,.06)",
                    border:"1px solid rgba(141,198,63,.2)",borderRadius:8,marginBottom:14,
                    fontSize:12,color:"rgba(141,198,63,.8)",lineHeight:1.6
                  }}>
                    🏪 Al aprobar tu solicitud recibirás un <strong>código de ganancia</strong> válido por 72 horas.
                    Preséntalo en cualquier punto físico de tu ciudad para cobrar en efectivo.
                  </div>
                )}

                <BarraRetiro 
                  actual={perfil?.creditos??0} 
                  minimo={config.minimo_retiro / tasaCambio}
                  moneda={config.moneda}
                />
                
                {!listo_retiro?(
                  <div style={{padding:"16px",background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.15)",borderRadius:8,display:"flex",alignItems:"center",gap:10}}>
                    <AlertTriangle size={16} style={{color:"#f59e0b",flexShrink:0}}/>
                    <span style={{fontSize:12,color:"rgba(245,158,11,.8)",lineHeight:1.5}}>Aún no alcanzas el mínimo de retiro. Sigue prediciendo y recargando para desbloquear esta función.</span>
                  </div>
                ):(
                  <>
                    {formRetiro.creditos_solicitados && parseFloat(formRetiro.creditos_solicitados) > 0 && (
                      <div style={{padding:"12px 14px",background:"rgba(141,198,63,.05)",border:"1px solid rgba(141,198,63,.15)",borderRadius:8,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8} as any}>
                        <div style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>{parseFloat(formRetiro.creditos_solicitados)} PX × {tasaCambio.toLocaleString()} = </div>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:18,fontWeight:700,color:"#8dc63f"}}>{simboloMoneda}{(parseFloat(formRetiro.creditos_solicitados) * tasaCambio * (1 - config.comision_retiro/100)).toLocaleString("es-CO")} {config.moneda}</div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,.25)",width:"100%"}}>Después de comisión del {config.comision_retiro}%</div>
                      </div>
                    )}
                    <div style={{padding:"10px 14px",background:"rgba(56,189,248,.06)",border:"1px solid rgba(56,189,248,.15)",borderRadius:6,marginBottom:16,fontSize:11,color:"rgba(56,189,248,.8)",lineHeight:1.6}}>
                      ℹ️ Se aplica una comisión de <b>{config.comision_retiro}%</b> sobre el monto retirado.
                    </div>
                    <div className="lbl">Créditos a retirar *</div>
                    <input type="number" className="inp" placeholder={`Mínimo ${config.minimo_retiro.toLocaleString()}`}
                      value={formRetiro.creditos_solicitados} onChange={e=>setFormRetiro(f=>({...f,creditos_solicitados:e.target.value}))}/>
                    <div className="lbl">Datos del beneficiario *</div>
                    <div className="inp-row">
                      <input className="inp" placeholder="Nombre completo del beneficiario"
                        value={formRetiro.nombre_beneficiario} onChange={e=>setFormRetiro(f=>({...f,nombre_beneficiario:e.target.value}))}/>
                      <input className="inp" placeholder="Número de documento"
                        value={formRetiro.numero_documento} onChange={e=>setFormRetiro(f=>({...f,numero_documento:e.target.value}))}/>
                    </div>
                    <select className="inp" value={formRetiro.tipo_documento} onChange={e=>setFormRetiro(f=>({...f,tipo_documento:e.target.value}))}>
                      <option value="CEDULA">Cédula de ciudadanía</option>
                      <option value="PASAPORTE">Pasaporte</option>
                      <option value="DNI">DNI</option>
                      <option value="RUT">RUT</option>
                      <option value="CURP">CURP</option>
                      <option value="OTRO">Otro</option>
                    </select>
                    <div className="lbl">Método de pago *</div>
                    <select className="inp" value={formRetiro.metodo_pago} onChange={e=>setFormRetiro(f=>({...f,metodo_pago:e.target.value}))}>
                      <option value="">— Selecciona método —</option>
                      {metodosPago.length>0
                        ?metodosPago.map(m=><option key={m.metodo_clave} value={m.metodo_clave}>{m.metodo_nombre} — {m.descripcion}</option>)
                        :<><option value="nequi">Nequi</option><option value="daviplata">Daviplata</option><option value="transferencia">Transferencia bancaria</option><option value="paypal">PayPal</option></>
                      }
                    </select>
                    <div className="inp-row">
                      <input className="inp" placeholder="Número de cuenta / celular / correo *"
                        value={formRetiro.numero_cuenta} onChange={e=>setFormRetiro(f=>({...f,numero_cuenta:e.target.value}))}/>
                      <input className="inp" placeholder="Banco (opcional)"
                        value={formRetiro.banco} onChange={e=>setFormRetiro(f=>({...f,banco:e.target.value}))}/>
                    </div>
                    <button className="btn-g" style={{width:"100%"}} onClick={enviarRetiro}>Enviar solicitud de retiro</button>
                  </>
                )}
              </div>
            )}

            {/* ── MIS PREDICCIONES ── */}
            {tab==="predicciones"&&(
              <>
                {misPredicciones.length===0&&!loadingPredicciones&&(
                  <button onClick={cargarMisPredicciones} style={{width:"100%",padding:"12px",background:"rgba(141,198,63,.1)",border:"1px solid rgba(141,198,63,.25)",borderRadius:8,color:"#8dc63f",fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",marginBottom:16}}>
                    Cargar mis predicciones
                  </button>
                )}
                {loadingPredicciones&&<div style={{textAlign:"center",padding:40,color:"rgba(255,255,255,.3)"}}>Cargando...</div>}
                {misPredicciones.length>0&&(
                  <>
                    <div className="stats" style={{marginBottom:16}}>
                      <div className="stat-c"><div className="stat-ico ico-g"><Activity size={16}/></div><div><div className="stat-v">{misPredicciones.length}</div><div className="stat-l">Total</div></div></div>
                      <div className="stat-c"><div className="stat-ico ico-g"><CheckCircle size={16}/></div><div><div className="stat-v" style={{color:"#8dc63f"}}>{misPredicciones.filter(p=>p.is_correct===true).length}</div><div className="stat-l">Acertadas</div></div></div>
                      <div className="stat-c"><div className="stat-ico ico-r"><X size={16}/></div><div><div className="stat-v" style={{color:"#ef4444"}}>{misPredicciones.filter(p=>p.is_correct===false).length}</div><div className="stat-l">Falladas</div></div></div>
                      <div className="stat-c"><div className="stat-ico ico-a"><Clock size={16}/></div><div><div className="stat-v" style={{color:"#f59e0b"}}>{misPredicciones.filter(p=>p.is_correct===null).length}</div><div className="stat-l">Pendientes</div></div></div>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                      {(['TODAS','ACERTADAS','FALLADAS','PENDIENTES'] as const).map(f=>(
                        <button key={f} onClick={()=>setFiltroPred(f)} style={{
                          padding:"5px 12px",borderRadius:6,
                          border:`1px solid ${filtroPred===f?"#8dc63f":"rgba(255,255,255,.08)"}`,
                          background:filtroPred===f?"rgba(141,198,63,.1)":"transparent",
                          color:filtroPred===f?"#8dc63f":"rgba(255,255,255,.35)",
                          fontFamily:"'Oswald',sans-serif",fontSize:10,fontWeight:700,
                          cursor:"pointer",letterSpacing:1,
                        }}>{f}</button>
                      ))}
                    </div>
                    {misPredicciones.filter(p=>{
                      if(filtroPred==="ACERTADAS") return p.is_correct===true;
                      if(filtroPred==="FALLADAS") return p.is_correct===false;
                      if(filtroPred==="PENDIENTES") return p.is_correct===null;
                      return true;
                    }).map((pred,i)=>{
                      const m = pred.matches;
                      const t = pred.tournaments;
                      return (
                        <div key={pred.id} className="tx-item" style={{
                          borderLeft:`3px solid ${pred.is_correct===true?"#8dc63f":pred.is_correct===false?"#ef4444":"rgba(245,158,11,.5)"}`,
                        }}>
                          <div style={{width:32,height:32,borderRadius:8,flexShrink:0,
                            background:pred.is_correct===true?"rgba(141,198,63,.1)":pred.is_correct===false?"rgba(239,68,68,.1)":"rgba(245,158,11,.1)",
                            display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {pred.is_correct===true?<CheckCircle size={14} style={{color:"#8dc63f"}}/>:
                             pred.is_correct===false?<X size={14} style={{color:"#ef4444"}}/>:
                             <Clock size={14} style={{color:"#f59e0b"}}/>}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:600,color:"#fff"}}>
                              {m?.home_team} vs {m?.away_team}
                            </div>
                            <div style={{fontSize:10,color:"rgba(255,255,255,.3)",marginTop:2}}>
                              {t?.name||"Individual"} · {t?.tipo_evento||"INDIVIDUAL"}
                            </div>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{
                              fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:700,
                              color:pred.is_correct===true?"#8dc63f":pred.is_correct===false?"#ef4444":"#f59e0b"
                            }}>
                              {pred.is_correct===true?"✓ ACERTASTE":pred.is_correct===false?"✗ FALLASTE":"PENDIENTE"}
                            </div>
                            <div style={{fontSize:10,color:"rgba(255,255,255,.2)",marginTop:2}}>
                              {pred.sealed_at?new Date(pred.sealed_at).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"}):"—"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}

            {/* ── REFERIDOS ── */}
            {tab==="referidos"&&perfil&&(
              <>
                <div className="stats" style={{marginBottom:16}}>
                  <div className="stat-c"><div className="stat-ico ico-g"><Users size={16}/></div><div><div className="stat-v">{referidos.length}</div><div className="stat-l">Referidos</div></div></div>
                  <div className="stat-c"><div className="stat-ico ico-p"><Gift size={16}/></div><div><div className="stat-v">{totalComisionRef.toLocaleString()}</div><div className="stat-l">Créditos ganados</div></div></div>
                  <div className="stat-c"><div className="stat-ico ico-a"><TrendingUp size={16}/></div><div><div className="stat-v">{config.comision_referido}%</div><div className="stat-l">Tu comisión</div></div></div>
                  <div className="stat-c"><div className="stat-ico ico-b"><CheckCircle size={16}/></div><div><div className="stat-v">{gananciasRef.filter(g=>g.estado==="ACREDITADO").length}</div><div className="stat-l">Acreditados</div></div></div>
                </div>
                <div className="panel">
                  <div className="panel-title"><Gift size={15} style={{color:"#8dc63f"}}/> Mi código de referido</div>
                  <div className="ref-code-box">
                    <div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:4}}>Comparte este código o enlace</div>
                      <div className="ref-code">{perfil.codigo_referido}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      <button className="copy-btn" onClick={()=>{navigator.clipboard.writeText(perfil.codigo_referido);showToast("Código copiado","ok");}}><Copy size={12} style={{marginRight:4}}/>Código</button>
                      <button className="copy-btn" onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/register?ref=${perfil.codigo_referido}`);showToast("Enlace de registro copiado","ok");}}><ExternalLink size={12} style={{marginRight:4}}/>Enlace</button>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    {[{paso:"1",desc:"Tu amigo se registra con tu código"},{paso:"2",desc:"Hace su primera recarga"},{paso:"3",desc:`Tú ganas ${config.comision_referido}% automáticamente`}].map(p=>(
                      <div key={p.paso} style={{background:"rgba(141,198,63,.04)",border:"1px solid rgba(141,198,63,.1)",borderRadius:8,padding:"12px 10px",textAlign:"center"}}>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:20,fontWeight:700,color:"#8dc63f",marginBottom:6}}>{p.paso}</div>
                        <div style={{fontSize:11,color:"rgba(255,255,255,.4)",lineHeight:1.5}}>{p.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="sec-h"><div className="sec-t">Mis referidos activos</div></div>
                {referidos.length===0?(
                  <div className="empty"><Users size={32} style={{margin:"0 auto",opacity:.3}}/><div className="empty-t">Aún no tienes referidos</div><div className="empty-s">Comparte tu código y empieza a ganar créditos</div></div>
                ):(
                  referidos.map(r=>(
                    <div key={r.id} className="ref-item">
                      <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(141,198,63,.1)",border:"1.5px solid rgba(141,198,63,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:700,color:"#8dc63f",flexShrink:0}}>{r.nombre.charAt(0).toUpperCase()}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:600,color:"#fff"}}>{r.nombre}</div>
                        <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginTop:2}}>Se unió {new Date(r.created_at).toLocaleDateString("es-CO",{day:"2-digit",month:"short"})} · Estado: <span style={{color:r.estado_juego==="VIVO"?"#8dc63f":"#f59e0b"}}>{r.estado_juego}</span></div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:700,color:"#8dc63f"}}>+{r.comision_generada.toLocaleString()} cr</div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,.25)",marginTop:2}}>comisión ganada</div>
                      </div>
                    </div>
                  ))
                )}
                {gananciasRef.length>0&&(
                  <>
                    <div className="sec-h" style={{marginTop:16}}><div className="sec-t">Historial de comisiones</div></div>
                    {gananciasRef.map(g=>(
                      <div key={g.id} className="tx-item">
                        <div style={{width:32,height:32,borderRadius:8,background:"rgba(168,85,247,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Gift size={14} style={{color:"#a855f7"}}/></div>
                        <div style={{flex:1,minWidth:0}}>
                          <div className="tx-type">{g.tipo_evento.replace(/_/g," ")}</div>
                          <div className="tx-desc">{g.referido_nombre}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div className="tx-amt tx-pos">+{g.creditos_ganados} cr</div>
                          <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:3,letterSpacing:.5,background:g.estado==="ACREDITADO"?"rgba(141,198,63,.12)":"rgba(245,158,11,.12)",color:g.estado==="ACREDITADO"?"#8dc63f":"#f59e0b"}}>{g.estado}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="bn">
        <div className="bn-wrap">
          {NAV.map(n=>(
            <button key={n.id} className={`bn-btn ${tab===n.id?"on":""}`} onClick={()=>setTab(n.id as Tab)}>
              {n.icon}<span>{n.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </nav>

      {eventoSeleccionado && (
        <JoinEventModal
          evento={eventoSeleccionado}
          saldoActual={perfil?.creditos ?? saldoPx}
          onSuccess={(res) => {
            setSaldoPx(res.saldo_nuevo);
            setEventoSeleccionado(null);
          }}
          onClose={() => setEventoSeleccionado(null)}
        />
      )}
    </>
  );
}
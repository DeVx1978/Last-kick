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
  Users, Award, Copy, ExternalLink,
  DollarSign, AlertTriangle, Globe, ChevronDown
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
  bonus_activo?: boolean; bonus_px?: number; bonus_descripcion?: string;
  costo_px?: number; vidas_base?: number; vidas_bonus?: number;
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
interface MetodoPago { metodo_clave: string; metodo_nombre: string; descripcion: string; }
interface ConfigPlataforma {
  minimo_retiro: number; moneda: string; comision_retiro: number; comision_referido: number;
}
interface FormRetiro {
  creditos_solicitados: string; nombre_beneficiario: string;
  numero_documento: string; tipo_documento: string;
  metodo_pago: string; numero_cuenta: string;
  banco: string; tipo_cuenta: string;
  metodo_retiro: "TRANSFERENCIA" | "PUNTO_FISICO";
}
type Tab = "radar" | "perfil" | "ganancias" | "historial" | "recargar" | "referidos" | "notificaciones" | "predicciones";

/* ── Partidos cuotas (diseño listo — motor pendiente) ── */
const PARTIDOS_CUOTAS = [
  { id:"pc1", liga:"Primera A · Col", hora:"Hoy 20:30", local:"Junior", visitante:"Atl. Nacional", vivo:false, c1:"2.55", cx:"1.45", c2:"3.20", fl:"co", fv:"co", ml:null as string|null, mv:null as string|null },
  { id:"pc2", liga:"Copa Colombia", hora:"2T 78'", local:"Independiente", visitante:"Cúcuta", vivo:true, c1:"2.10", cx:"3.50", c2:"3.60", fl:"co", fv:"co", ml:"2", mv:"1" },
  { id:"pc3", liga:"Premier League", hora:"Mañana 10:00", local:"Man. City", visitante:"Aston Villa", vivo:false, c1:"1.25", cx:"6.50", c2:"11", fl:"gb", fv:"gb", ml:null, mv:null },
  { id:"pc4", liga:"Premier League", hora:"Mañana 10:00", local:"Nottingham", visitante:"Bournemouth", vivo:false, c1:"3.35", cx:"4.00", c2:"2.05", fl:"gb", fv:"gb", ml:null, mv:null },
  { id:"pc5", liga:"Mundial 2026", hora:"11 JUN 18:00", local:"México", visitante:"USA", vivo:false, c1:"2.40", cx:"2.80", c2:"2.60", fl:"mx", fv:"us", ml:null, mv:null },
  { id:"pc6", liga:"La Liga", hora:"Hoy 20:00", local:"Real Madrid", visitante:"Barcelona", vivo:false, c1:"2.10", cx:"3.40", c2:"3.20", fl:"es", fv:"es", ml:null, mv:null },
  { id:"pc7", liga:"Bundesliga", hora:"Mañana 14:30", local:"Bayern", visitante:"Dortmund", vivo:false, c1:"1.80", cx:"3.60", c2:"4.50", fl:"de", fv:"de", ml:null, mv:null },
];

/* ── Slides hero ── */
const HERO_SLIDES = [
  { titulo:"MUNDIAL FIFA 2026", sub:"¡Predice y gana en cada partido!", badge:"🏆 TORNEO ESPECIAL" },
  { titulo:"COPA KICK LAST", sub:"El torneo más grande de predicciones", badge:"🎯 EN VIVO" },
  { titulo:"LA LIGA 2025-26", sub:"Predice los marcadores exactos", badge:"⚡ CUOTAS EN VIVO" },
];

/* Imágenes de fondo del hero (Unsplash — libres de uso) */
const HERO_IMGS = [
  "/img/kick6.jpg",
  "/img/kick2.jpg",
  "/img/kick11.jpg",
];

const Toast = ({ msg, type, onClose }: { msg:string; type:"ok"|"err"|"warn"; onClose:()=>void }) => (
  <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:type==="ok"?"#8dc63f":type==="err"?"#ef4444":"#f59e0b",color:"#0a0d14",padding:"11px 16px",borderRadius:4,fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,letterSpacing:".5px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",maxWidth:340,animation:"slideIn .3s ease"}}>
    {type==="ok"?<CheckCircle size={15}/>:<AlertCircle size={15}/>}
    <span style={{flex:1}}>{msg}</span>
    <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#0a0d14",padding:0}}><X size={13}/></button>
  </div>
);

const BarraRetiro = ({ actual, minimo, moneda }: { actual:number; minimo:number; moneda:string }) => {
  const pct=Math.min((actual/minimo)*100,100), falta=Math.max(minimo-actual,0), listo=actual>=minimo;
  return (
    <div style={{background:"#111827",border:`1px solid ${listo?"rgba(141,198,63,.3)":"rgba(255,255,255,.07)"}`,borderRadius:4,padding:"14px 16px",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
        <span style={{fontSize:10,color:"rgba(255,255,255,.4)",textTransform:"uppercase",letterSpacing:1}}>Progreso mínimo de retiro</span>
        <span style={{fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:700,color:listo?"#8dc63f":"rgba(255,255,255,.4)"}}>{Math.round(pct)}%</span>
      </div>
      <div style={{height:6,background:"rgba(255,255,255,.08)",borderRadius:2,overflow:"hidden",marginBottom:9}}>
        <div style={{height:"100%",width:`${pct}%`,background:listo?"#8dc63f":"#f59e0b",borderRadius:2,transition:"width .6s ease"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><span style={{fontFamily:"'Oswald',sans-serif",fontSize:17,fontWeight:700,color:"#fff"}}>{actual.toLocaleString()}</span><span style={{fontSize:10,color:"rgba(255,255,255,.35)",marginLeft:4}}>créditos</span></div>
        {listo
          ?<span style={{padding:"3px 10px",background:"rgba(141,198,63,.12)",border:"1px solid rgba(141,198,63,.3)",borderRadius:3,fontSize:9,fontWeight:700,color:"#8dc63f",letterSpacing:1,fontFamily:"'Oswald',sans-serif"}}>✔ RETIRO DISPONIBLE</span>
          :<span style={{fontSize:10,color:"rgba(255,255,255,.35)"}}>Faltan <b style={{color:"#f59e0b"}}>{falta.toLocaleString()}</b> cr (mín. {minimo.toLocaleString()} {moneda})</span>
        }
      </div>
    </div>
  );
};

export default function RadarBody() {
  const router = useRouter();
  const [tab,setTab]=useState<Tab>("radar");
  const [eventoSeleccionado,setEventoSeleccionado]=useState<EventoJuego|null>(null);
  const [saldoPx,setSaldoPx]=useState<number>(0);
  const [sideOpen,setSideOpen]=useState(false);
  const [notiOpen,setNotiOpen]=useState(false);
  const [loading,setLoading]=useState(true);
  const [toast,setToast]=useState<{msg:string;type:"ok"|"err"|"warn"}|null>(null);
  const [filter,setFilter]=useState<"todos"|"TORNEO"|"VIP"|"COMBINADA"|"INDIVIDUAL"|null>(null);
  const [pin,setPin]=useState("");
  const [pinLoad,setPinLoad]=useState(false);
  const [betAmts,setBetAmts]=useState<Record<string,string>>({});
  const [activating,setActivating]=useState<string|null>(null);
  const [heroIdx,setHeroIdx]=useState(0);
  const [cuotaSel,setCuotaSel]=useState<{id:string;eq:string;cuota:string}|null>(null);
  const [codigoGananciaActivo,setCodigoGananciaActivo]=useState<any>(null);
  const [perfil,setPerfil]=useState<UsuarioPerfil|null>(null);
  const [eventos,setEventos]=useState<Evento[]>([]);
  const [ganancias,setGanancias]=useState<Ganancia[]>([]);
  const [transacciones,setTransacciones]=useState<Transaccion[]>([]);
  const [metodosPago,setMetodosPago]=useState<MetodoPago[]>([]);
  const [gananciasRef,setGananciasRef]=useState<GananciaReferido[]>([]);
  const [referidos,setReferidos]=useState<Referido[]>([]);
  const [notificaciones,setNotificaciones]=useState<Notificacion[]>([]);
  const [misPredicciones,setMisPredicciones]=useState<any[]>([]);
  const [loadingPredicciones,setLoadingPredicciones]=useState(false);
  const [filtroPred,setFiltroPred]=useState<'TODAS'|'ACERTADAS'|'FALLADAS'|'PENDIENTES'>('TODAS');
  const [config,setConfig]=useState<ConfigPlataforma>({minimo_retiro:50000,moneda:"COP",comision_retiro:10,comision_referido:5});
  const [formRetiro,setFormRetiro]=useState<FormRetiro>({creditos_solicitados:"",nombre_beneficiario:"",numero_documento:"",tipo_documento:"CEDULA",metodo_pago:"",numero_cuenta:"",banco:"",tipo_cuenta:"",metodo_retiro:"TRANSFERENCIA"});
  const [perfilJugador,setPerfilJugador]=useState<any>(null);
  const [mostrarFormRetiro,setMostrarFormRetiro]=useState(false);
  const [perfilExpanded,setPerfilExpanded]=useState(false);
  const [tasaCambio,setTasaCambio]=useState<number>(1);
  const [simboloMoneda,setSimboloMoneda]=useState<string>("$");

  const showToast=(msg:string,type:"ok"|"err"|"warn"="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),4000);};

  useEffect(()=>{const t=setInterval(()=>setHeroIdx(i=>(i+1)%HERO_SLIDES.length),5000);return()=>clearInterval(t);},[]);

  const getHeaders=async():Promise<Record<string,string>>=>{
    const{data:{session}}=await supabase.auth.getSession();
    return{"Content-Type":"application/json",...(session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{})};
  };
  const fetchConTimeout=async(url:string,options:RequestInit,ms=3000):Promise<Response>=>{
    const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);
    try{const r=await fetch(url,{...options,signal:c.signal});clearTimeout(t);return r;}catch(e){clearTimeout(t);throw e;}
  };

  const cargarDatos=useCallback(async()=>{
    setLoading(true);
    try{
      const{data:{user}}=await supabase.auth.getUser();
      if(!user){router.push("/login");return;}
      const headers=await getHeaders();
      let saldoBackend=0;
      try{const r=await fetchConTimeout(`${API_URL}/usuarios/perfil`,{headers});if(r.ok){const p=await r.json();saldoBackend=Number(p.saldo||0);}}catch{}
      const{data:p}=await supabase.from("profiles").select("*").eq("id",user.id).maybeSingle();
      if(p){
        setPerfil({id:user.id,nombre:p.username||p.full_name||"RECLUTA",nombre_completo:p.full_name||"",email:user.email||"",telefono:p.phone||"",pais:p.country||"Colombia",pais_codigo:p.country_code||"+57",moneda:p.moneda||"COP",vidas:p.lives||0,creditos:saldoBackend>0?saldoBackend:(p.pitchx_balance||0),racha:p.streak||0,mejor_racha:p.best_streak||0,total_predicciones:p.total_predictions||0,predicciones_correctas:p.correct_predictions||0,estado_juego:p.status||"VIVO",avatar_url:p.avatar_url||"",codigo_jugador:p.player_code||"",codigo_referido:p.referral_code||`LK-${user.id.substring(0,6).toUpperCase()}`});
        const pc=(p.country_code||"+57").replace("+","");
        const pk=pc==="57"?"CO":pc==="593"?"EC":pc==="52"?"MX":pc==="54"?"AR":pc==="51"?"PE":pc==="58"?"VE":"CO";
        const{data:cfgs}=await supabase.from("platform_config").select("key,value").in("key",[`min_withdrawal_${pk}`,`platform_currency_${pk}`,"commission_withdrawal","commission_referral"]);
        if(cfgs){const cfg:Record<string,string>={};cfgs.forEach((c:any)=>{cfg[c.key]=c.value;});setConfig({minimo_retiro:parseFloat(cfg[`min_withdrawal_${pk}`]||"50000"),moneda:cfg[`platform_currency_${pk}`]||"COP",comision_retiro:parseFloat(cfg["commission_withdrawal"]||"10"),comision_referido:parseFloat(cfg["commission_referral"]||"5")});}
        const{data:met}=await supabase.from("payment_methods").select("method_key,method_name,description").eq("country_code",p.country_code||"+57").eq("is_active",true).order("sort_order");
        if(met)setMetodosPago(met.map((m:any)=>({metodo_clave:m.method_key,metodo_nombre:m.method_name,descripcion:m.description||""})));
        const cref=p.referral_code||`LK-${user.id.substring(0,6).toUpperCase()}`;
        const{data:refs}=await supabase.from("profiles").select("id,username,status,created_at,pitchx_balance").eq("referido_por",cref).order("created_at",{ascending:false});
        if(refs)setReferidos(refs.map((r:any)=>({id:r.id,nombre:r.username||"RECLUTA",estado_juego:r.status||"VIVO",created_at:r.created_at,total_recargas:0,comision_generada:0})));
      }
      if(user){const{data:cg}=await supabase.from("codigos_ganancia").select("*").eq("jugador_id",user.id).eq("estado","ACTIVO").gt("expira_en",new Date().toISOString()).order("created_at",{ascending:false}).limit(1).maybeSingle();setCodigoGananciaActivo(cg??null);}
      let evOk=false;
      try{
        const r=await fetchConTimeout(`${API_URL}/eventos/activos`,{headers},3000);
        if(r.ok){const evs=await r.json();const lista=Array.isArray(evs)?evs:(evs.data||[]);
        if(lista.length>0){setEventos(lista.map((e:any)=>({id:e.id,nombre:e.nombre||e.name||"",slug:e.slug||e.id,descripcion:e.descripcion||e.description||"",tipo_evento:e.tipo_evento==="VIP"?"VIP":e.tipo_evento==="COMBINADA"?"COMBINADA":e.tipo_evento==="INDIVIDUAL"?"INDIVIDUAL":e.tipo_evento==="PRIVADO"?"PRIVADO":e.tipo_evento==="TORNEO"?"TORNEO":"PUBLICO",estado:e.estado||"ACTIVO",costo_vidas:Number(e.costo_vidas||0),costo_creditos:Number(e.costo_creditos||0),cuota_local:e.cuota_local||e.cuota_1||null,cuota_empate:e.cuota_empate||e.cuota_x||null,cuota_visitante:e.cuota_visitante||e.cuota_2||null,equipo_local:e.equipo_local||null,equipo_visitante:e.equipo_visitante||null,sede:e.sede||null,imagen_url:e.imagen_url||null,fecha_evento:e.fecha_evento||e.fecha_inicio||null,acumulado_actual:Number(e.acumulado_actual||0)})));evOk=true;}}
      }catch{}
      if(!evOk){
        const{data:evs}=await supabase.from("tournaments").select("*").in("status",["activo","ACTIVO","active"]).order("created_at",{ascending:false});
        const{data:mi}=await supabase.from("matches").select("*").is("tournament_id",null).in("status",["PROXIMAMENTE","ACTIVO","EN_VIVO"]).order("match_date",{ascending:true});
        setEventos([...(evs||[]).map((e:any)=>({id:e.id,nombre:e.name,slug:e.slug,descripcion:e.descripcion||"",tipo_evento:(e.es_vip?"VIP":e.tipo_evento==="COMBINADA"?"COMBINADA":"TORNEO")as any,estado:"ACTIVO"as const,costo_vidas:e.vidas_base||0,costo_creditos:e.costo_px||0,cuota_local:null,cuota_empate:null,cuota_visitante:null,equipo_local:null,equipo_visitante:null,sede:null,imagen_url:null,fecha_evento:e.fecha_inicio||null,acumulado_actual:0,bonus_activo:e.bonus_activo||false,bonus_px:e.bonus_px||0,bonus_descripcion:e.bonus_descripcion||"",costo_px:e.costo_px||0,vidas_base:e.vidas_base||0,vidas_bonus:e.vidas_bonus||0})),...(mi||[]).map((m:any)=>({id:m.id,nombre:`${m.home_team} vs ${m.away_team}`,slug:m.id,descripcion:m.phase||"",tipo_evento:"INDIVIDUAL"as any,estado:"ACTIVO"as const,costo_vidas:0,costo_creditos:m.costo_operacion||0,cuota_local:m.cuota_1||null,cuota_empate:m.cuota_x||null,cuota_visitante:m.cuota_2||null,equipo_local:m.home_team||null,equipo_visitante:m.away_team||null,sede:m.stadium||null,imagen_url:null,fecha_evento:m.match_date||null,acumulado_actual:0,bonus_activo:false,bonus_px:0,bonus_descripcion:"",costo_px:m.costo_operacion||0,vidas_base:0,vidas_bonus:0}))]);
      }
      let hOk=false;
      try{const r=await fetchConTimeout(`${API_URL}/usuario/dashboard`,{headers},3000);if(r.ok){const d=await r.json();const m=d.movimientos||d.data||[];if(m.length>0){setTransacciones(m.map((t:any)=>({id:t.id||String(Math.random()),tipo:t.tipo||t.type||"MOVIMIENTO",creditos:Number(t.monto||t.creditos||t.amount||0),vidas:Number(t.vidas||0),descripcion:t.descripcion||t.description||"",created_at:t.creado_en||t.created_at||new Date().toISOString()})));hOk=true;}}}catch{}
      if(!hOk){const{data:txs}=await supabase.from("px_transactions").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30);if(txs)setTransacciones(txs.map((t:any)=>({id:t.id,tipo:t.type||"TRANSACCION",creditos:t.amount,vidas:0,descripcion:t.description||"",created_at:t.created_at})));}
      try{const r=await fetchConTimeout(`${API_URL}/usuario/predicciones`,{headers},3000);if(r.ok){const pr=await r.json();const lista=Array.isArray(pr)?pr:(pr.data||[]);setGanancias(lista.filter((p:any)=>p.estado==="GANADORA_TOTAL"||p.is_correct===true).map((p:any)=>({id:p.id,evento_nombre:p.evento?.nombre||p.evento_nombre||"Evento",premio_creditos:Number(p.premio_creditos||p.points_earned||0),premio_pozo:Number(p.premio_pozo||0),estado:"PENDIENTE_RETIRO"as const,fecha:p.fecha_creacion||p.sealed_at||p.created_at||""})));}}catch{setGanancias([]);}
      const{data:gr}=await supabase.from("referral_earnings").select("*").eq("referrer_id",user.id).order("created_at",{ascending:false});
      if(gr)setGananciasRef(gr.map((r:any)=>({id:r.id,referido_nombre:r.referred_id,tipo_evento:r.event_type,creditos_ganados:r.earned_px,estado:r.status,created_at:r.created_at})));
      const{data:notis}=await supabase.from("notifications").select("id,type,title,message,read,reference_id,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(20);
      if(notis)setNotificaciones(notis.map((n:any)=>({id:n.id,tipo:n.type,titulo:n.title,mensaje:n.message,leida:n.read,referencia_id:n.reference_id||null,fecha_creacion:n.created_at})));
      if(user){
        const{data:cg2}=await supabase.from("codigos_ganancia").select("*").eq("jugador_id",user.id).eq("estado","ACTIVO").gt("expira_en",new Date().toISOString()).order("created_at",{ascending:false}).limit(1).maybeSingle();
        setCodigoGananciaActivo(cg2??null);
        const{data:pj}=await supabase.from("perfiles_jugador").select("*").eq("user_id",user.id).maybeSingle();
        if(pj){setPerfilJugador(pj);setFormRetiro(f=>({...f,nombre_beneficiario:pj.titular_cuenta||"",numero_documento:pj.numero_documento||"",tipo_documento:pj.tipo_documento||"CEDULA",numero_cuenta:pj.numero_cuenta||"",banco:pj.banco||"",tipo_cuenta:pj.tipo_cuenta||""}));}
        const{data:pp}=await supabase.from("profiles").select("country_code").eq("id",user.id).maybeSingle();
        const pc2=((pp?.country_code)||"+57").replace("+","");
        const pk2=pc2==="57"?"CO":pc2==="593"?"EC":pc2==="52"?"MX":pc2==="51"?"PE":"CO";
        const{data:tasa}=await supabase.from("tasas_cambio").select("tasa_usd,simbolo").eq("pais_codigo",pk2).maybeSingle();
        if(tasa){setTasaCambio(Number(tasa.tasa_usd));setSimboloMoneda(tasa.simbolo);}
      }
    }catch(e){console.error("RadarBody error:",e);showToast("Error al cargar datos","err");}
    finally{setLoading(false);}
  },[router]);

  useEffect(()=>{cargarDatos();},[cargarDatos]);

  const signOut=async()=>{await supabase.auth.signOut();router.push("/");};
  const marcarLeida=async(id:string)=>{await supabase.from("notifications").update({read:true}).eq("id",id);setNotificaciones(ns=>ns.map(n=>n.id===id?{...n,leida:true}:n));};
  const cargarMisPredicciones=async()=>{
    if(!perfil)return;setLoadingPredicciones(true);
    try{const{data}=await supabase.from('predictions').select(`id,question_id,answer_id,is_correct,sealed_at,matches!inner(id,home_team,away_team,match_date,home_flag,away_flag,result),tournaments(name,tipo_evento)`).eq('user_id',perfil.id).eq('question_id','0c3dc09c-a149-4aed-8301-5cd84249721c').order('sealed_at',{ascending:false}).limit(100);if(data)setMisPredicciones(data);}catch(e){console.error(e);}finally{setLoadingPredicciones(false);}
  };
  const activarEvento=async(ev:Evento)=>{
    if(!perfil)return;
    if(ev.costo_vidas>0&&perfil.vidas<ev.costo_vidas){showToast(`Necesitas ${ev.costo_vidas} vida(s). ¡Recarga!`,"warn");setTab("recargar");return;}
    if(ev.costo_creditos>0&&perfil.creditos<ev.costo_creditos){showToast(`Necesitas ${ev.costo_creditos} créditos. ¡Recarga!`,"warn");setTab("recargar");return;}
    router.push(`/campo-de-batalla/${ev.slug}`);
  };
  const hacerApuesta=async(ev:Evento,resultado:"1"|"X"|"2")=>{
    const monto=parseFloat(betAmts[ev.id]||"0");
    if(!monto||monto<50){showToast("Mínimo 50 créditos por apuesta","warn");return;}
    if(!perfil||monto>perfil.creditos){showToast("Créditos insuficientes","err");return;}
    try{const headers=await getHeaders();const res=await fetch(`${API_URL}/apuestas`,{method:"POST",headers,body:JSON.stringify({evento_id:ev.id,resultado_elegido:resultado,monto_creditos:monto,cuota_al_apostar:resultado==="1"?ev.cuota_local:resultado==="X"?ev.cuota_empate:ev.cuota_visitante})});if(!res.ok)throw new Error();showToast(`Apuesta de ${monto} cr en "${resultado}" registrada`,"ok");setBetAmts(b=>({...b,[ev.id]:""}));await cargarDatos();}catch{showToast("Error al registrar la apuesta","err");}
  };
  const canjearPin=async()=>{
    if(!pin.trim()){showToast("Ingresa un código PIN","warn");return;}setPinLoad(true);
    try{
      const headers=await getHeaders();
      try{const r=await fetchConTimeout(`${API_URL}/auth/canjear-pin`,{method:"POST",headers,body:JSON.stringify({codigo:pin.trim().toUpperCase()})},3000);if(r.ok){const d=await r.json();if(d.vidas>0)showToast(`+${d.vidas} vidas añadidas ✔`,"ok");if(d.creditos>0)showToast(`+${d.creditos} créditos añadidos ✔`,"ok");setPin("");await cargarDatos();return;}}catch{}
      const{data:{user}}=await supabase.auth.getUser();
      const{data:pd}=await supabase.from("pin_codes").select("id,lives_amount,px_amount,used,expires_at").eq("code",pin.trim().toUpperCase()).eq("used",false).maybeSingle();
      if(!pd){showToast("Código inválido o ya utilizado","err");return;}
      if(pd.expires_at&&new Date(pd.expires_at)<new Date()){showToast("Este código ha expirado","err");return;}
      await supabase.from("pin_codes").update({used:true,used_by:user?.id,used_at:new Date().toISOString()}).eq("id",pd.id);
      if(pd.lives_amount>0&&perfil)await supabase.from("profiles").update({lives:perfil.vidas+pd.lives_amount}).eq("id",perfil.id);
      if(pd.px_amount>0&&perfil)await supabase.from("profiles").update({pitchx_balance:perfil.creditos+pd.px_amount}).eq("id",perfil.id);
      if(pd.lives_amount>0)showToast(`+${pd.lives_amount} vidas añadidas ✔`,"ok");
      if(pd.px_amount>0)showToast(`+${pd.px_amount} créditos añadidos ✔`,"ok");
      setPin("");await cargarDatos();
    }catch{showToast("Error al validar el código","err");}finally{setPinLoad(false);}
  };
  const enviarRetiro=async()=>{
    if(!perfil)return;const monto=parseFloat(formRetiro.creditos_solicitados);
    if(!monto||monto<=0){showToast("Ingresa un monto válido","warn");return;}
    if(monto>perfil.creditos){showToast("No tienes suficientes créditos","err");return;}
    const minimoEnPx=config.minimo_retiro/tasaCambio;const minimoLibre=minimoEnPx/(1-config.comision_retiro/100);
    if(perfil.creditos<minimoLibre){showToast(`Mínimo: ${Math.ceil(minimoLibre).toLocaleString()} créditos`,"warn");return;}
    if(!formRetiro.nombre_beneficiario||!formRetiro.numero_documento||!formRetiro.metodo_pago||!formRetiro.numero_cuenta){showToast("Completa todos los campos obligatorios","warn");return;}
    try{
      const{data:rd,error}=await supabase.from("withdrawal_requests").insert({user_id:perfil.id,creditos_solicitados:monto,monto_local:monto*tasaCambio,moneda:config.moneda,porcentaje_comision:config.comision_retiro,monto_comision:monto*config.comision_retiro/100,monto_neto:monto*(1-config.comision_retiro/100),nombre_beneficiario:formRetiro.nombre_beneficiario,numero_documento:formRetiro.numero_documento,tipo_documento:formRetiro.tipo_documento,metodo_pago:formRetiro.metodo_pago,numero_cuenta:formRetiro.numero_cuenta,banco:formRetiro.banco,tipo_cuenta:formRetiro.tipo_cuenta,estado:formRetiro.metodo_retiro==='PUNTO_FISICO'?'APROBADO':'PENDIENTE',metodo_retiro:formRetiro.metodo_retiro}).select().single();
      if(error)throw error;
      if(formRetiro.metodo_retiro==='PUNTO_FISICO'&&rd){
        const pc=(perfil.pais_codigo??'+57').replace('+','');
        const pk=pc==='57'?'CO':pc==='593'?'EC':pc==='52'?'MX':pc==='51'?'PE':pc==='54'?'AR':pc==='56'?'CL':pc==='58'?'VE':pc==='506'?'CR':pc==='507'?'PA':pc==='1'?'US':pc==='591'?'BO':pc==='55'?'BR':pc==='34'?'ES':'CO';
        const{data:tasa}=await supabase.from('tasas_cambio').select('tasa_usd,moneda').eq('pais_codigo',pk).maybeSingle();
        const tasaUsd=Number(tasa?.tasa_usd??1);const expira=new Date(Date.now()+72*60*60*1000).toISOString();
        const codigo=`${pk}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
        const montoNeto=monto*(1-config.comision_retiro/100);
        const{error:cgErr}=await supabase.from('codigos_ganancia').insert({jugador_id:perfil.id,retiro_id:rd.id,codigo,monto_px:montoNeto,moneda:tasa?.moneda??'COP',monto_local:montoNeto*tasaUsd,tasa_cambio:tasaUsd,pais_codigo:pk,estado:'ACTIVO',expira_en:expira});
        console.log('CG error:',cgErr);showToast(`✓ Código generado: ${codigo}`,'ok');
      }else{showToast('Solicitud enviada. El equipo la revisará en 24–72h','ok');}
      setFormRetiro({creditos_solicitados:'',nombre_beneficiario:'',numero_documento:'',tipo_documento:'CEDULA',metodo_pago:'',numero_cuenta:'',banco:'',tipo_cuenta:'',metodo_retiro:'TRANSFERENCIA'});
      await cargarDatos();
    }catch(err:any){showToast(err.message??'Error al enviar la solicitud','err');}
  };

  const notiNoLeidas=notificaciones.filter(n=>!n.leida).length;
  const totalGanancias=ganancias.reduce((s,g)=>s+g.premio_creditos+g.premio_pozo,0);
  const gananciasDisponibles=ganancias.filter(g=>g.estado==="PENDIENTE_RETIRO").reduce((s,g)=>s+g.premio_creditos+g.premio_pozo,0);
  const totalComisionRef=gananciasRef.filter(g=>g.estado==="ACREDITADO").reduce((s,g)=>s+g.creditos_ganados,0);
  const minimoEnPx=tasaCambio>0?config.minimo_retiro/tasaCambio:config.minimo_retiro;
  const listo_retiro=perfil?perfil.creditos>=minimoEnPx:false;
  const statusColor=perfil?.estado_juego==="VIVO"?"#8dc63f":perfil?.estado_juego==="EN_COMA"?"#f59e0b":"#ef4444";
  const precisionPct=perfil&&perfil.total_predicciones>0?Math.round((perfil.predicciones_correctas/perfil.total_predicciones)*100):0;
  const eventosFiltrados=filter?eventos.filter(ev=>ev.tipo_evento===filter):[];
  const heroSlide=HERO_SLIDES[heroIdx];

  const NAV=[
    {id:"radar",icon:<Crosshair size={16}/>,label:"Radar"},
    {id:"ganancias",icon:<Wallet size={16}/>,label:"Mis ganancias"},
    {id:"perfil",icon:<User size={16}/>,label:"Mi perfil"},
    {id:"historial",icon:<ScrollText size={16}/>,label:"Historial"},
    {id:"recargar",icon:<Zap size={16}/>,label:"Recargar"},

    {id:"referidos",icon:<Users size={16}/>,label:"Mis referidos"},
    
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500&display=swap');
        @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fdIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes heroFade{from{opacity:0}to{opacity:1}}
        @keyframes tkIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        *{margin:0;padding:0;box-sizing:border-box;}
        body,html{background:#0a0d14;color:#fff;font-family:'Roboto',sans-serif;}

        /* ── LAYOUT ── */
        .rd{display:flex;min-height:100vh;background:#0a0d14;}
        .rd-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:49;}
        @media(max-width:900px){.rd-ov.open{display:block;}}

        /* ── SIDEBAR ── */
        .sb{width:220px;background:#0b0e1a;border-right:1px solid rgba(255,255,255,.05);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:50;transition:transform .3s;overflow-y:auto;}
        @media(max-width:900px){.sb{transform:translateX(-100%);}.sb.open{transform:translateX(0);}}
        .sb-logo{padding:16px 18px 12px;border-bottom:1px solid rgba(255,255,255,.05);}
        .sb-logo img{height:26px;width:auto;object-fit:contain;}
        .sb-logo-fb{font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;color:#8dc63f;letter-spacing:2px;}
        .sb-player{padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:9px;}
        .sb-av{width:34px;height:34px;border-radius:50%;background:rgba(141,198,63,.08);border:1px solid rgba(141,198,63,.2);display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;color:#8dc63f;flex-shrink:0;overflow:hidden;}
        .sb-av img{width:100%;height:100%;object-fit:cover;}
        .sb-pi-name{font-size:12px;font-weight:500;color:#fff;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;}
        .sb-pi-code{font-size:9px;color:rgba(255,255,255,.25);margin-top:2px;font-family:monospace;}
        .sb-bals{display:grid;grid-template-columns:1fr 1fr;background:rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.05);}
        .sb-bal{padding:10px 12px;text-align:center;border-right:1px solid rgba(255,255,255,.04);}
        .sb-bal:last-child{border-right:none;}
        .sb-bal-v{font-family:'Oswald',sans-serif;font-size:19px;font-weight:700;color:#8dc63f;line-height:1;}
        .sb-bal-l{font-size:8px;color:rgba(255,255,255,.25);letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;}
        .sb-nav{flex:1;padding:8px 0;}
        .sb-grp{font-size:8px;color:rgba(255,255,255,.15);letter-spacing:2px;text-transform:uppercase;padding:9px 18px 3px;}
        .sb-item{display:flex;align-items:center;gap:9px;width:100%;padding:9px 18px;background:transparent;border:none;border-left:2px solid transparent;color:rgba(255,255,255,.3);font-family:'Roboto',sans-serif;font-size:11px;font-weight:500;cursor:pointer;transition:all .15s;text-align:left;}
        .sb-item:hover{color:rgba(255,255,255,.75);background:rgba(255,255,255,.02);}
        .sb-item.on{color:#8dc63f;background:rgba(141,198,63,.05);border-left-color:#8dc63f;}
        .sb-pill{margin-left:auto;font-size:8px;padding:2px 6px;border-radius:3px;font-weight:700;background:rgba(141,198,63,.12);color:#8dc63f;font-family:'Oswald',sans-serif;}
        .sb-pill-w{background:rgba(245,158,11,.12);color:#f59e0b;}
        .sb-foot{padding:10px 18px;border-top:1px solid rgba(255,255,255,.05);}
        .sb-out{display:flex;align-items:center;gap:8px;width:100%;padding:8px 0;background:transparent;border:none;color:rgba(239,68,68,.4);font-size:10px;font-family:'Roboto',sans-serif;cursor:pointer;transition:color .2s;}
        .sb-out:hover{color:#ef4444;}

        /* ── MAIN ── */
        .mn{flex:1;margin-left:220px;display:flex;flex-direction:column;height:100vh;overflow-y:auto;}
        @media(max-width:900px){.mn{margin-left:0;}}

        /* ── TOPBAR ── */
        .tb{padding:11px 20px;background:#0b0e1a;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40;}
        .tb-l{display:flex;align-items:center;gap:10px;}
        .tb-ham{display:none;background:transparent;border:none;color:rgba(255,255,255,.5);cursor:pointer;padding:4px;}
        @media(max-width:900px){.tb-ham{display:flex;}}
        .tb-title{font-family:'Oswald',sans-serif;font-size:12px;font-weight:600;color:rgba(255,255,255,.35);letter-spacing:2px;text-transform:uppercase;}
        .tb-r{display:flex;align-items:center;gap:10px;}
        .tb-live{display:flex;align-items:center;gap:5px;font-size:9px;color:#8dc63f;font-weight:600;letter-spacing:1px;}
        .tb-dot{width:5px;height:5px;border-radius:50%;background:#8dc63f;animation:blink 1.5s infinite;}
        .noti-btn{position:relative;background:transparent;border:none;color:rgba(255,255,255,.4);cursor:pointer;padding:6px;border-radius:5px;display:flex;align-items:center;transition:all .15s;}
        .noti-btn:hover{color:#fff;background:rgba(255,255,255,.05);}
        .noti-badge{position:absolute;top:2px;right:2px;width:14px;height:14px;background:#ef4444;border-radius:50%;font-size:8px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;}
        .noti-panel{position:absolute;top:calc(100% + 6px);right:0;width:300px;background:#0f1420;border:1px solid rgba(255,255,255,.08);border-radius:6px;box-shadow:0 16px 48px rgba(0,0,0,.7);z-index:100;animation:fdIn .2s ease;overflow:hidden;}
        .noti-head{padding:11px 15px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;}
        .noti-head-t{font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;color:#fff;letter-spacing:1px;text-transform:uppercase;}
        .noti-item{padding:11px 15px;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;transition:background .15s;}
        .noti-item:hover{background:rgba(255,255,255,.02);}
        .noti-item.unread{border-left:2px solid #8dc63f;}
        .noti-item-title{font-size:11px;font-weight:600;color:#fff;margin-bottom:2px;}
        .noti-item-msg{font-size:10px;color:rgba(255,255,255,.35);line-height:1.5;}
        .noti-item-date{font-size:9px;color:rgba(255,255,255,.2);margin-top:3px;}
        .noti-empty{padding:22px;text-align:center;font-size:11px;color:rgba(255,255,255,.25);}

        /* ── HERO CODERE ── */
        .hero{position:relative;width:100%;height:260px;overflow:hidden;background:#0d1119;}
        @media(max-width:700px){.hero{height:200px;}}
        .hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
        .hero-grad{position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,13,20,.98) 0%,rgba(10,13,20,.75) 50%,rgba(10,13,20,.25) 100%);}
        .hero-gb{position:absolute;bottom:0;left:0;right:0;height:80px;background:linear-gradient(transparent,#0a0d14);}
        .hero-content{position:relative;z-index:2;height:100%;padding:20px 22px;display:flex;flex-direction:column;justify-content:flex-end;}
        @media(max-width:700px){.hero-content{padding:13px;}}
        .hero-slide{animation:slideContent .4s ease;}
        @keyframes slideContent{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .hero-badge{display:inline-flex;align-items:center;margin-bottom:7px;font-family:'Oswald',sans-serif;font-size:9px;font-weight:700;color:#8dc63f;letter-spacing:1.5px;background:rgba(141,198,63,.1);border:1px solid rgba(141,198,63,.25);border-radius:2px;padding:3px 8px;}
        .hero-title{font-family:'Oswald',sans-serif;font-size:28px;font-weight:700;color:#fff;line-height:1.05;text-transform:uppercase;margin-bottom:4px;}
        @media(max-width:700px){.hero-title{font-size:18px;}}
        .hero-sub{font-size:11px;color:rgba(255,255,255,.5);margin-bottom:13px;}
        .hero-btns{display:flex;gap:7px;flex-wrap:wrap;}
        .hero-btn-g{padding:7px 16px;background:#8dc63f;color:#0a0d14;border:none;border-radius:3px;font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;cursor:pointer;transition:background .15s;}
        .hero-btn-g:hover{background:#7ab52f;}
        .hero-btn-o{padding:7px 16px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.1);border-radius:3px;font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;cursor:pointer;transition:all .15s;}
        .hero-btn-o:hover{background:rgba(255,255,255,.13);}
        .hero-dots{position:absolute;bottom:12px;left:22px;display:flex;gap:5px;z-index:3;}
        .hero-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.2);cursor:pointer;transition:all .2s;}
        .hero-dot.on{background:#8dc63f;width:16px;border-radius:3px;}
        .hero-info{position:absolute;top:14px;right:14px;background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.07);border-radius:4px;padding:10px 13px;z-index:3;min-width:145px;}
        @media(max-width:600px){.hero-info{display:none;}}
        .hi-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-size:9px;}
        .hi-lbl{color:rgba(255,255,255,.3);}
        .hi-val{font-family:'Oswald',sans-serif;font-weight:700;color:#8dc63f;}

        /* ── CUOTAS SCROLL (Codere style) ── */
        /* ── CUOTAS scroll horizontal — exacto Codere ── */
        .cq-wrap{background:#0d1119;border-bottom:2px solid #8dc63f;}
        .cq-inner{display:flex;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
        .cq-inner::-webkit-scrollbar{display:none;}
        /* cada columna = 1 partido */
        .cq-col{flex-shrink:0;width:calc(14vw + 80px);min-width:195px;max-width:260px;border-right:1px solid rgba(255,255,255,.05);padding:10px 12px 9px;cursor:default;}@media(max-width:600px){.cq-col{min-width:165px;width:165px;}}
        .cq-col:last-child{border-right:none;}
        /* liga + hora */
        .cq-liga{font-size:8px;color:rgba(255,255,255,.3);letter-spacing:.8px;text-transform:uppercase;display:flex;align-items:center;gap:4px;margin-bottom:5px;white-space:nowrap;}
        .cq-hora{font-size:8px;color:rgba(255,255,255,.22);margin-left:auto;}
        .cq-live{display:inline-flex;align-items:center;gap:3px;font-size:8px;font-weight:700;color:#ef4444;font-family:'Oswald',sans-serif;margin-left:auto;}
        .cq-live-d{width:5px;height:5px;border-radius:50%;background:#ef4444;animation:blink 1s infinite;flex-shrink:0;}
        /* equipos */
        .cq-teams{display:flex;flex-direction:column;gap:3px;margin-bottom:8px;}
        .cq-team{display:flex;align-items:center;gap:5px;}
        .cq-flag{width:14px;height:10px;object-fit:cover;border-radius:1px;flex-shrink:0;}
        .cq-nombre{font-size:12px;font-weight:500;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;}
        .cq-marc{font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;color:#8dc63f;margin-left:4px;min-width:16px;text-align:center;}
        /* cuotas 1 X 2 */
        .cq-odds{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px;}
        .cq-odd{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:6px 4px;background:#111827;border:1px solid rgba(255,255,255,.07);border-radius:2px;cursor:pointer;transition:all .12s;}
        .cq-odd:hover,.cq-odd.sel{background:#8dc63f;border-color:#8dc63f;}
        .cq-odd:hover .cq-odd-l,.cq-odd.sel .cq-odd-l,.cq-odd:hover .cq-odd-v,.cq-odd.sel .cq-odd-v{color:#0a0d14;}
        .cq-odd-l{font-size:8px;color:rgba(255,255,255,.3);text-transform:uppercase;font-weight:700;letter-spacing:.3px;transition:color .12s;}
        .cq-odd-v{font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;color:#fff;line-height:1;transition:color .12s;}

        /* ── TICKET FLOTANTE ── */
        .tk{position:fixed;bottom:72px;right:12px;background:#0f1420;border:1px solid rgba(141,198,63,.25);border-radius:5px;padding:11px 13px;z-index:45;min-width:185px;box-shadow:0 8px 30px rgba(0,0,0,.7);animation:tkIn .2s ease;}
        @media(min-width:900px){.tk{bottom:12px;}}
        .tk-title{font-family:'Oswald',sans-serif;font-size:8px;font-weight:700;color:rgba(255,255,255,.3);letter-spacing:2px;text-transform:uppercase;margin-bottom:7px;}
        .tk-item{background:rgba(141,198,63,.05);border:1px solid rgba(141,198,63,.12);border-radius:3px;padding:8px 10px;margin-bottom:7px;}
        .tk-p{font-size:9px;color:rgba(255,255,255,.35);margin-bottom:3px;}
        .tk-row{display:flex;justify-content:space-between;align-items:center;}
        .tk-eq{font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;color:#8dc63f;}
        .tk-c{font-family:'Oswald',sans-serif;font-size:19px;font-weight:700;color:#fff;}
        .tk-note{font-size:8px;color:rgba(245,158,11,.5);margin-bottom:7px;line-height:1.4;}
        .tk-btns{display:flex;gap:5px;}

        /* ── BODY / BD ── */
        .bd{flex:1;padding:0;}
        .bd-pad{padding:18px 20px;}
        @media(max-width:600px){.bd-pad{padding:12px;}}
        @media(max-width:900px){.bd-pad{padding-bottom:80px;}}

        /* ── STATS ── */
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;}
        @media(max-width:700px){.stats{grid-template-columns:repeat(2,1fr);}}
        .stat-c{background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:4px;padding:11px 12px;display:flex;align-items:center;gap:9px;}
        .stat-ico{width:30px;height:30px;border-radius:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .ico-g{background:rgba(141,198,63,.1);color:#8dc63f;}.ico-b{background:rgba(56,189,248,.1);color:#38bdf8;}
        .ico-a{background:rgba(245,158,11,.1);color:#f59e0b;}.ico-r{background:rgba(239,68,68,.1);color:#ef4444;}.ico-p{background:rgba(168,85,247,.1);color:#a855f7;}
        .stat-v{font-family:'Oswald',sans-serif;font-size:17px;font-weight:700;color:#fff;line-height:1;}
        .stat-l{font-size:9px;color:rgba(255,255,255,.28);letter-spacing:1px;text-transform:uppercase;margin-top:2px;}

        /* ── FILTROS ── */
        .flt-row{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px;}
        .flt{padding:10px 18px;background:#111827;border:1px solid rgba(255,255,255,.08);border-radius:3px;color:rgba(255,255,255,.4);font-size:11px;font-weight:700;cursor:pointer;letter-spacing:.7px;text-transform:uppercase;transition:all .15s;font-family:'Oswald',sans-serif;}
        .flt:hover{background:#8dc63f;border-color:#8dc63f;color:#0a0d14;}
        .flt.on{background:#8dc63f;border-color:#8dc63f;color:#0a0d14;}
        @media(max-width:600px){.flt{padding:8px 13px;font-size:10px;}}

        /* ── LISTA EVENTOS (Codere style) ── */
        .ev-list{display:flex;flex-direction:column;gap:4px;}
        .ev-row{background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:4px;overflow:hidden;transition:all .2s;}
        .ev-row:hover{border-color:rgba(141,198,63,.2);background:#141e2e;}
        .ev-row.vip{border-left:3px solid #f59e0b;}
        .ev-main{display:flex;align-items:center;padding:10px 14px;gap:12px;flex-wrap:wrap;}
        .ev-info{flex:1;min-width:180px;}
        .ev-head{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:5px;}
        .ev-league{font-size:9px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.7px;}
        .ev-time{font-size:9px;color:#fff;background:#1a2235;padding:2px 6px;border-radius:2px;font-family:'Oswald',sans-serif;font-weight:600;}
        .ev-badge-vip{font-size:8px;font-weight:700;color:#f59e0b;padding:2px 5px;border:1px solid rgba(245,158,11,.3);border-radius:2px;font-family:'Oswald',sans-serif;letter-spacing:.5px;}
        .ev-badge-bon{font-size:8px;font-weight:700;color:#8dc63f;padding:2px 5px;border:1px solid rgba(141,198,63,.3);border-radius:2px;font-family:'Oswald',sans-serif;letter-spacing:.5px;}
        .ev-teams{display:flex;flex-direction:column;gap:3px;}
        .ev-team{font-family:'Roboto',sans-serif;font-size:13px;font-weight:500;color:#fff;display:flex;align-items:center;gap:6px;}
        .ev-team::before{content:'';width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.2);flex-shrink:0;}
        .ev-meta{font-size:10px;color:#8dc63f;font-weight:600;margin-top:4px;display:flex;align-items:center;gap:4px;}
        .ev-odds-box{display:flex;align-items:center;gap:3px;flex-shrink:0;}
        .ev-odd{width:64px;height:46px;background:#1a2235;border:1px solid rgba(255,255,255,.06);border-radius:3px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;}
        .ev-odd:hover,.ev-odd.act{background:#8dc63f;border-color:#8dc63f;}
        .ev-odd:hover .ev-odd-l,.ev-odd.act .ev-odd-l{color:#0a0d14;}
        .ev-odd:hover .ev-odd-v,.ev-odd.act .ev-odd-v{color:#0a0d14;}
        .ev-odd-l{font-size:8px;color:rgba(255,255,255,.3);text-transform:uppercase;font-weight:600;margin-bottom:2px;transition:color .15s;}
        .ev-odd-v{font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;color:#fff;line-height:1;transition:color .15s;}
        .ev-enter{padding:9px 16px;background:#8dc63f;color:#0a0d14;border:none;border-radius:3px;font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;letter-spacing:.7px;cursor:pointer;white-space:nowrap;transition:background .15s;flex-shrink:0;}
        .ev-enter:hover{background:#7ab52f;}
        .ev-enter-dis{background:#1a2235;color:rgba(255,255,255,.3);border:none;border-radius:3px;padding:9px 16px;font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;cursor:default;flex-shrink:0;}
        .ev-bet-bar{border-top:1px solid rgba(255,255,255,.05);padding:8px 14px;display:flex;gap:7px;align-items:center;background:rgba(0,0,0,.1);}
        .ev-bet-in{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:3px;padding:7px 11px;color:#fff;font-size:12px;font-family:'Roboto',sans-serif;outline:none;transition:border-color .15s;}
        .ev-bet-in:focus{border-color:rgba(141,198,63,.35);}
        .ev-bet-in::placeholder{color:rgba(255,255,255,.2);font-size:11px;}
        .ev-bet-btn{padding:7px 14px;background:#8dc63f;color:#0a0d14;border:none;border-radius:3px;font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:4px;transition:background .15s;flex-shrink:0;}
        .ev-bet-btn:hover{background:#7ab52f;}

        /* ── SECCIÓN ── */
        .sec-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:7px;}
        .sec-t{font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:2px;text-transform:uppercase;display:flex;align-items:center;gap:7px;}
        .sec-t::before{content:'';width:3px;height:12px;background:#8dc63f;border-radius:2px;flex-shrink:0;}

        /* ── PANEL ── */
        .panel{background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:4px;padding:16px 18px;margin-bottom:13px;}
        .panel-title{font-family:'Oswald',sans-serif;font-size:12px;font-weight:600;color:#fff;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:7px;}
        .panel-desc{font-size:12px;color:rgba(255,255,255,.3);line-height:1.65;margin-bottom:12px;}

        /* ── FORMS ── */
        .lbl{font-size:9px;color:rgba(255,255,255,.3);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;}
        .inp{width:100%;background:#111827;border:1px solid rgba(255,255,255,.08);border-radius:3px;padding:10px 13px;color:#fff;font-size:12px;font-family:'Roboto',sans-serif;outline:none;transition:border-color .15s;margin-bottom:10px;}
        .inp:focus{border-color:rgba(141,198,63,.35);}
        .inp::placeholder{color:rgba(255,255,255,.2);}
        .inp-pin{font-family:'Oswald',sans-serif;font-size:14px;letter-spacing:3px;color:#8dc63f;}
        select.inp option{background:#111827;}
        .inp-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        @media(max-width:500px){.inp-row{grid-template-columns:1fr;}}
        .btn-g{padding:11px 20px;background:#8dc63f;border:none;border-radius:3px;color:#0a0d14;font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;letter-spacing:.5px;cursor:pointer;transition:background .15s;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;}
        .btn-g:hover{background:#7ab52f;}.btn-g:disabled{opacity:.5;cursor:not-allowed;background:#1a2235;color:rgba(255,255,255,.3);}
        .btn-row{display:flex;gap:10px;margin-top:4px;}
        @media(max-width:500px){.btn-row{flex-direction:column;}}

        /* ── GANANCIAS ── */
        .gan-card{background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:4px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:6px;transition:border-color .15s;}
        .gan-card:hover{border-color:rgba(141,198,63,.2);}
        .gan-card.pendiente{border-left:3px solid #8dc63f;}
        .gan-card.retirado{border-left:3px solid rgba(255,255,255,.1);}

        /* ── PERFIL ── */
        .perf-grid{display:grid;grid-template-columns:240px 1fr;gap:16px;}
        @media(max-width:820px){.perf-grid{grid-template-columns:1fr;}}
        .id-card{background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:4px;padding:20px;display:flex;flex-direction:column;align-items:center;gap:12px;}
        .id-av{width:74px;height:74px;border-radius:50%;background:rgba(141,198,63,.08);border:2px solid rgba(141,198,63,.25);display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-size:28px;font-weight:700;color:#8dc63f;overflow:hidden;}
        .id-av img{width:100%;height:100%;object-fit:cover;}
        .id-name{font-family:'Oswald',sans-serif;font-size:15px;font-weight:700;color:#fff;text-align:center;}
        .id-code{font-family:monospace;font-size:10px;color:rgba(255,255,255,.3);letter-spacing:1px;}
        .id-status{padding:4px 12px;border-radius:2px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-family:'Oswald',sans-serif;}
        .id-fields{width:100%;display:flex;flex-direction:column;gap:9px;border-top:1px solid rgba(255,255,255,.06);padding-top:12px;}
        .id-f-lbl{font-size:8px;color:rgba(255,255,255,.2);letter-spacing:1.5px;text-transform:uppercase;}
        .id-f-val{font-size:12px;color:rgba(255,255,255,.65);font-weight:500;margin-top:1px;}
        .barcode{height:26px;width:100%;background:repeating-linear-gradient(90deg,rgba(141,198,63,.3) 0,rgba(141,198,63,.3) 2px,transparent 2px,transparent 4px,rgba(141,198,63,.15) 4px,rgba(141,198,63,.15) 5px,transparent 5px,transparent 8px);border-radius:2px;opacity:.5;}
        .prec-bar-bg{width:100%;height:5px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;}
        .prec-bar{height:100%;background:#8dc63f;border-radius:2px;transition:width .5s ease;}
        .ref-code-box{background:rgba(141,198,63,.06);border:1px solid rgba(141,198,63,.2);border-radius:4px;padding:14px 17px;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;}
        .ref-code{font-family:'Oswald',sans-serif;font-size:19px;font-weight:700;color:#8dc63f;letter-spacing:3px;}
        .copy-btn{padding:6px 12px;background:rgba(141,198,63,.12);border:none;border-radius:3px;color:#8dc63f;font-size:10px;font-weight:700;cursor:pointer;font-family:'Oswald',sans-serif;letter-spacing:.5px;transition:background .15s;}
        .copy-btn:hover{background:rgba(141,198,63,.22);}

        /* ── TX ── */
        .tx-item{display:flex;align-items:center;gap:10px;padding:11px 13px;background:#111827;border:1px solid rgba(255,255,255,.05);border-radius:4px;margin-bottom:5px;}
        .tx-type{font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.3);}
        .tx-desc{font-size:11px;color:rgba(255,255,255,.45);margin-top:2px;}
        .tx-amt{margin-left:auto;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;}
        .tx-pos{color:#8dc63f;}.tx-neg{color:#ef4444;}
        .ref-item{display:flex;align-items:center;gap:10px;padding:11px 13px;background:#111827;border:1px solid rgba(255,255,255,.05);border-radius:4px;margin-bottom:5px;}

        /* ── EMPTY ── */
        .empty{text-align:center;padding:40px 20px;color:rgba(255,255,255,.2);}
        .empty-t{font-family:'Oswald',sans-serif;font-size:14px;color:rgba(255,255,255,.25);margin-top:10px;}
        .empty-s{font-size:11px;margin-top:4px;}

        /* ── BOTTOM NAV ── */
        .bn{display:none;position:fixed;bottom:0;left:0;right:0;background:#0b0e1a;border-top:1px solid rgba(255,255,255,.06);z-index:48;padding:7px 0 env(safe-area-inset-bottom);}
        @media(max-width:900px){.bn{display:flex;}}
        .bn-wrap{display:flex;justify-content:space-around;align-items:center;width:100%;}
        .bn-btn{display:flex;flex-direction:column;align-items:center;gap:3px;background:transparent;border:none;color:rgba(255,255,255,.25);font-size:8px;font-family:'Roboto',sans-serif;font-weight:500;cursor:pointer;padding:4px 5px;transition:color .15s;flex:1;text-align:center;}
        .bn-btn.on{color:#8dc63f;}
        .spin-ico{animation:spin .8s linear infinite;}
        /* ══ MIS PREDICCIONES — rediseño ══ */
.pred-header{
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 14px 0;border-bottom:1px solid rgba(255,255,255,.06);
  background:linear-gradient(90deg,rgba(141,198,63,.04) 0%,transparent 100%);
}
.pred-tabs{display:flex;gap:0;}
.pred-tab{
  display:flex;align-items:center;gap:5px;
  padding:9px 12px;background:none;border:none;
  border-bottom:2px solid transparent;
  color:rgba(255,255,255,.3);font-family:'Oswald',sans-serif;
  font-size:9px;font-weight:700;cursor:pointer;letter-spacing:.5px;
  transition:all .15s;white-space:nowrap;
}
.pred-tab:hover{color:rgba(255,255,255,.6);}
.pred-tab.ok{color:#8dc63f;border-bottom-color:#8dc63f;}
.pred-tab.fa{color:#ef4444;border-bottom-color:#ef4444;}
.pred-tab.pe{color:#f59e0b;border-bottom-color:#f59e0b;}

.pred-body{padding:0;}
.pred-load-btn{
  width:100%;padding:14px;background:transparent;
  border:none;border-top:1px solid rgba(255,255,255,.04);
  color:rgba(141,198,63,.5);font-family:'Oswald',sans-serif;
  font-size:9px;font-weight:700;cursor:pointer;letter-spacing:1px;
  transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px;
}
.pred-load-btn:hover{background:rgba(141,198,63,.05);color:#8dc63f;}

.pred-row{
  display:flex;align-items:center;gap:10px;
  padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.04);
  transition:background .12s;cursor:default;
}
.pred-row:last-child{border-bottom:none;}
.pred-row:hover{background:rgba(255,255,255,.02);}

.pred-dot-ok{width:6px;height:6px;border-radius:50%;background:#8dc63f;flex-shrink:0;}
.pred-dot-fa{width:6px;height:6px;border-radius:50%;background:#ef4444;flex-shrink:0;}
.pred-dot-pe{width:6px;height:6px;border-radius:50%;background:#f59e0b;flex-shrink:0;}

.pred-match{font-family:'Oswald',sans-serif;font-size:12px;font-weight:600;color:#fff;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pred-sub{font-size:9px;color:rgba(255,255,255,.28);margin-top:1px;}
.pred-badge-ok{font-family:'Oswald',sans-serif;font-size:9px;font-weight:700;color:#8dc63f;
  background:rgba(141,198,63,.1);border:1px solid rgba(141,198,63,.2);
  border-radius:2px;padding:2px 7px;flex-shrink:0;}
.pred-badge-fa{font-family:'Oswald',sans-serif;font-size:9px;font-weight:700;color:#ef4444;
  background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);
  border-radius:2px;padding:2px 7px;flex-shrink:0;}
.pred-badge-pe{font-family:'Oswald',sans-serif;font-size:9px;font-weight:700;color:#f59e0b;
  background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);
  border-radius:2px;padding:2px 7px;flex-shrink:0;}

/* Full-page predictions */
.pred-page-banner{
  position:relative;height:160px;overflow:hidden;
  border-bottom:2px solid rgba(141,198,63,.15);
}
.pred-page-stats{
  display:grid;grid-template-columns:repeat(4,1fr);
  border-bottom:1px solid rgba(255,255,255,.05);
}
.pred-page-stat{
  padding:14px 16px;text-align:center;
  border-right:1px solid rgba(255,255,255,.04);
}
.pred-page-stat:last-child{border-right:none;}
.pred-page-stat-v{font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;line-height:1;}
.pred-page-stat-l{font-size:8px;color:rgba(255,255,255,.3);letter-spacing:1.5px;
  text-transform:uppercase;margin-top:3px;}
.pred-page-filters{
  display:flex;gap:0;border-bottom:1px solid rgba(255,255,255,.05);
  background:#0d1119;overflow-x:auto;scrollbar-width:none;
}
.pred-page-filters::-webkit-scrollbar{display:none;}
.pred-page-filter{
  flex-shrink:0;padding:10px 18px;background:none;border:none;
  border-bottom:2px solid transparent;
  color:rgba(255,255,255,.3);font-family:'Oswald',sans-serif;
  font-size:10px;font-weight:700;cursor:pointer;letter-spacing:.7px;
  transition:all .15s;white-space:nowrap;
}
.pred-page-filter:hover{color:rgba(255,255,255,.6);}
.pred-page-filter.f-all{color:#fff;border-bottom-color:#fff;}
.pred-page-filter.f-ok{color:#8dc63f;border-bottom-color:#8dc63f;}
.pred-page-filter.f-fa{color:#ef4444;border-bottom-color:#ef4444;}
.pred-page-filter.f-pe{color:#f59e0b;border-bottom-color:#f59e0b;}

.pred-page-row{
  display:flex;align-items:center;gap:12px;
  padding:11px 16px;border-bottom:1px solid rgba(255,255,255,.04);
  transition:background .12s;
}
.pred-page-row:hover{background:rgba(255,255,255,.02);}
.pred-page-ico{
  width:32px;height:32px;border-radius:4px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
}
.pred-page-row-title{font-family:'Oswald',sans-serif;font-size:13px;font-weight:600;color:#fff;}
.pred-page-row-sub{font-size:9px;color:rgba(255,255,255,.3);margin-top:2px;}
@media(max-width:600px){
  .pred-page-stats{grid-template-columns:repeat(2,1fr);}
}
  /* ══ MIS PREDICCIONES — rediseño ══ */
.pred-header{
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 14px 0;border-bottom:1px solid rgba(255,255,255,.06);
  background:linear-gradient(90deg,rgba(141,198,63,.04) 0%,transparent 100%);
}
.pred-tabs{display:flex;gap:0;}
.pred-tab{
  display:flex;align-items:center;gap:5px;
  padding:9px 12px;background:none;border:none;
  border-bottom:2px solid transparent;
  color:rgba(255,255,255,.3);font-family:'Oswald',sans-serif;
  font-size:9px;font-weight:700;cursor:pointer;letter-spacing:.5px;
  transition:all .15s;white-space:nowrap;
}
.pred-tab:hover{color:rgba(255,255,255,.6);}
.pred-tab.ok{color:#8dc63f;border-bottom-color:#8dc63f;}
.pred-tab.fa{color:#ef4444;border-bottom-color:#ef4444;}
.pred-tab.pe{color:#f59e0b;border-bottom-color:#f59e0b;}

.pred-body{padding:0;}
.pred-load-btn{
  width:100%;padding:14px;background:transparent;
  border:none;border-top:1px solid rgba(255,255,255,.04);
  color:rgba(141,198,63,.5);font-family:'Oswald',sans-serif;
  font-size:9px;font-weight:700;cursor:pointer;letter-spacing:1px;
  transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px;
}
.pred-load-btn:hover{background:rgba(141,198,63,.05);color:#8dc63f;}

.pred-row{
  display:flex;align-items:center;gap:10px;
  padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.04);
  transition:background .12s;cursor:default;
}
.pred-row:last-child{border-bottom:none;}
.pred-row:hover{background:rgba(255,255,255,.02);}

.pred-dot-ok{width:6px;height:6px;border-radius:50%;background:#8dc63f;flex-shrink:0;}
.pred-dot-fa{width:6px;height:6px;border-radius:50%;background:#ef4444;flex-shrink:0;}
.pred-dot-pe{width:6px;height:6px;border-radius:50%;background:#f59e0b;flex-shrink:0;}

.pred-match{font-family:'Oswald',sans-serif;font-size:12px;font-weight:600;color:#fff;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pred-sub{font-size:9px;color:rgba(255,255,255,.28);margin-top:1px;}
.pred-badge-ok{font-family:'Oswald',sans-serif;font-size:9px;font-weight:700;color:#8dc63f;
  background:rgba(141,198,63,.1);border:1px solid rgba(141,198,63,.2);
  border-radius:2px;padding:2px 7px;flex-shrink:0;}
.pred-badge-fa{font-family:'Oswald',sans-serif;font-size:9px;font-weight:700;color:#ef4444;
  background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);
  border-radius:2px;padding:2px 7px;flex-shrink:0;}
.pred-badge-pe{font-family:'Oswald',sans-serif;font-size:9px;font-weight:700;color:#f59e0b;
  background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);
  border-radius:2px;padding:2px 7px;flex-shrink:0;}

/* Full-page predictions */
.pred-page-banner{
  position:relative;height:160px;overflow:hidden;
  border-bottom:2px solid rgba(141,198,63,.15);
}
.pred-page-stats{
  display:grid;grid-template-columns:repeat(4,1fr);
  border-bottom:1px solid rgba(255,255,255,.05);
}
.pred-page-stat{
  padding:14px 16px;text-align:center;
  border-right:1px solid rgba(255,255,255,.04);
}
.pred-page-stat:last-child{border-right:none;}
.pred-page-stat-v{font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;line-height:1;}
.pred-page-stat-l{font-size:8px;color:rgba(255,255,255,.3);letter-spacing:1.5px;
  text-transform:uppercase;margin-top:3px;}
.pred-page-filters{
  display:flex;gap:0;border-bottom:1px solid rgba(255,255,255,.05);
  background:#0d1119;overflow-x:auto;scrollbar-width:none;
}
.pred-page-filters::-webkit-scrollbar{display:none;}
.pred-page-filter{
  flex-shrink:0;padding:10px 18px;background:none;border:none;
  border-bottom:2px solid transparent;
  color:rgba(255,255,255,.3);font-family:'Oswald',sans-serif;
  font-size:10px;font-weight:700;cursor:pointer;letter-spacing:.7px;
  transition:all .15s;white-space:nowrap;
}
.pred-page-filter:hover{color:rgba(255,255,255,.6);}
.pred-page-filter.f-all{color:#fff;border-bottom-color:#fff;}
.pred-page-filter.f-ok{color:#8dc63f;border-bottom-color:#8dc63f;}
.pred-page-filter.f-fa{color:#ef4444;border-bottom-color:#ef4444;}
.pred-page-filter.f-pe{color:#f59e0b;border-bottom-color:#f59e0b;}

.pred-page-row{
  display:flex;align-items:center;gap:12px;
  padding:11px 16px;border-bottom:1px solid rgba(255,255,255,.04);
  transition:background .12s;
}
.pred-page-row:hover{background:rgba(255,255,255,.02);}
.pred-page-ico{
  width:32px;height:32px;border-radius:4px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
}
.pred-page-row-title{font-family:'Oswald',sans-serif;font-size:13px;font-weight:600;color:#fff;}
.pred-page-row-sub{font-size:9px;color:rgba(255,255,255,.3);margin-top:2px;}
@media(max-width:600px){
  .pred-page-stats{grid-template-columns:repeat(2,1fr);}
}
      `}</style>

      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      <div className={`rd-ov ${sideOpen?"open":""}`} onClick={()=>setSideOpen(false)}/>

      <div className="rd">
        {/* SIDEBAR */}
        <aside className={`sb ${sideOpen?"open":""}`}>
          <div className="sb-logo">
            <img src="/img/kicklast02.png" alt="Kick Last" onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}/>
            <span className="sb-logo-fb" style={{display:"none"}}>KICK LAST</span>
          </div>
          {perfil&&(
            <div className="sb-player">
              <div className="sb-av">{perfil.avatar_url?<img src={perfil.avatar_url} alt={perfil.nombre}/>:perfil.nombre.charAt(0).toUpperCase()}</div>
              <div style={{overflow:"hidden"}}>
                <div className="sb-pi-name">{perfil.nombre}</div>
                <div className="sb-pi-code">{perfil.codigo_jugador}</div>
              </div>
            </div>
          )}
          {perfil&&(
            <div className="sb-bals">
              <div className="sb-bal"><div className="sb-bal-v">{perfil.vidas}</div><div className="sb-bal-l">Vidas</div></div>
              <div className="sb-bal"><div className="sb-bal-v">{perfil.creditos>=1000?`${(perfil.creditos/1000).toFixed(1)}K`:perfil.creditos}</div><div className="sb-bal-l">Créditos</div></div>
            </div>
          )}
          <nav className="sb-nav">
            <div className="sb-grp">Panel de juego</div>
            {NAV.slice(0,4).map(n=>(
              <button key={n.id} className={`sb-item ${tab===n.id?"on":""}`} onClick={()=>{setTab(n.id as Tab);setSideOpen(false);}}>
                {n.icon} {n.label}
                {n.id==="radar"&&<span className="sb-pill">Live</span>}
                {n.id==="ganancias"&&gananciasDisponibles>0&&<span className="sb-pill sb-pill-w">!</span>}
              </button>
            ))}
            <div className="sb-grp">Economía</div>
            {NAV.slice(4).map(n=>(
              <button key={n.id} className={`sb-item ${tab===n.id?"on":""}`} onClick={()=>{setTab(n.id as Tab);setSideOpen(false);}}>
                {n.icon} {n.label}

              </button>
            ))}
          </nav>
          <div className="sb-foot">
            <button className="sb-out" onClick={signOut}><LogOut size={14}/> Cerrar sesión</button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="mn">
          {/* TOPBAR */}
          <div className="tb">
            <div className="tb-l">
              <button className="tb-ham" onClick={()=>setSideOpen(true)}><Menu size={21}/></button>
              <span className="tb-title">
                {tab==="radar"&&"Radar — Mercados"}
                {tab==="ganancias"&&"Mis ganancias"}
                {tab==="perfil"&&"Mi perfil"}
                {tab==="historial"&&"Historial"}
                {tab==="recargar"&&"Recargar"}
                {tab==="referidos"&&"Mis referidos"}
                {tab==="predicciones"&&"Mis predicciones"}
                {tab==="notificaciones"&&"Notificaciones"}
              </span>
            </div>
            <div className="tb-r">
              <span className="tb-live"><span className="tb-dot"/> Sistema activo · Mundial 2026</span>
              <div style={{position:"relative"}}>
                <button className="noti-btn" onClick={()=>setNotiOpen(o=>!o)}>
                  <Bell size={17}/>
                  {notiNoLeidas>0&&<span className="noti-badge">{notiNoLeidas>9?"9+":notiNoLeidas}</span>}
                </button>
                {notiOpen&&(
                  <div className="noti-panel">
                    <div className="noti-head">
                      <span className="noti-head-t">Notificaciones</span>
                      <button onClick={()=>setNotiOpen(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",cursor:"pointer"}}><X size={13}/></button>
                    </div>
                    {notificaciones.length===0?<div className="noti-empty">Sin notificaciones</div>:(
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

            {/* ═══ TAB RADAR ═══ */}
            {tab==="radar"&&(
              <>
                {/* HERO — Imagen limpia y brillante */}
                <div className="hero">
                  {HERO_IMGS.map((src,i)=>(
                    <img key={i} className="hero-img"
                      src={src} alt=""
                      style={{opacity:i===heroIdx?1:0,transition:"opacity 1.2s ease",position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}
                      onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}
                    />
                  ))}
                  {/* AQUÍ ELIMINÉ/REDUJE EL GRADIENTE PARA QUE NO OSCUREZCA */}
                  <div className="hero-grad" style={{background: "none"}}/><div className="hero-gb" style={{background: "none"}}/>
                  
                  <div className="hero-content">
                    <div className="hero-slide" key={heroIdx}>
                      <div className="hero-badge">{heroSlide.badge}</div>
                      <div className="hero-title">{heroSlide.titulo}</div>
                      <div className="hero-sub">{heroSlide.sub}</div>
                    </div>
                  </div>
                  <div className="hero-dots">{HERO_SLIDES.map((_,i)=><div key={i} className={`hero-dot ${i===heroIdx?"on":""}`} onClick={()=>setHeroIdx(i)}/>)}</div>
                  <div className="hero-info">
                    <div className="hi-row"><span className="hi-lbl">MUNDIAL 2026</span></div>
                    <div className="hi-row"><span className="hi-lbl">Acumulado</span><span className="hi-val">$200K</span></div>
                    <div className="hi-row"><span className="hi-lbl">Tu estado</span><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:9,color:statusColor}}>{perfil?.estado_juego||"—"}</span></div>
                    <div className="hi-row"><span className="hi-lbl">Vidas</span><span className="hi-val">{perfil?.vidas??"—"}</span></div>
                    <div className="hi-row"><span className="hi-lbl">Racha</span><span className="hi-val">{perfil?.racha??0}</span></div>
                  </div>
                </div>

                {/* CUOTAS — scroll horizontal exacto Codere */}
                <div className="cq-wrap">
                  <div className="cq-inner">
                    {PARTIDOS_CUOTAS.map(p=>(
                      <div key={p.id} className="cq-col">
                        <div className="cq-liga">
                          <Globe size={7}/>{p.liga}
                          {p.vivo
                            ?<span className="cq-live"><span className="cq-live-d"/>EN VIVO</span>
                            :<span className="cq-hora">{p.hora}</span>
                          }
                        </div>
                        <div className="cq-teams">
                          <div className="cq-team">
                            <img className="cq-flag" src={`https://flagcdn.com/w40/${p.fl}.png`} alt="" onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}/>
                            <span className="cq-nombre">{p.local}</span>
                            {p.ml!=null&&<span className="cq-marc">{p.ml}</span>}
                          </div>
                          <div className="cq-team">
                            <img className="cq-flag" src={`https://flagcdn.com/w40/${p.fv}.png`} alt="" onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}/>
                            <span className="cq-nombre">{p.visitante}</span>
                            {p.mv!=null&&<span className="cq-marc">{p.mv}</span>}
                          </div>
                        </div>
                        <div className="cq-odds">
                          {[{l:"1",v:p.c1,eq:p.local},{l:"X",v:p.cx,eq:"Empate"},{l:"2",v:p.c2,eq:p.visitante}].map(c=>(
                            <div key={c.l}
                              className={`cq-odd ${cuotaSel?.id===p.id&&cuotaSel?.eq===c.eq?"sel":""}`}
                              onClick={()=>setCuotaSel(cuotaSel?.id===p.id&&cuotaSel?.eq===c.eq?null:{id:p.id,eq:c.eq,cuota:c.v})}>
                              <span className="cq-odd-l">{c.l}</span>
                              <span className="cq-odd-v">{c.v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CONTENIDO */}
                <div className="bd-pad">

                  {/* Alerta ganancias */}
                  {gananciasDisponibles>0&&(
                    <div style={{background:"rgba(141,198,63,.07)",border:"1px solid rgba(141,198,63,.2)",borderRadius:4,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:14,cursor:"pointer"}} onClick={()=>setTab("ganancias")}>
                      <Award size={16} style={{color:"#8dc63f",flexShrink:0}}/>
                      <div style={{flex:1}}><div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:700,color:"#8dc63f"}}>¡Tienes ganancias disponibles!</div><div style={{fontSize:10,color:"rgba(255,255,255,.45)",marginTop:1}}>{gananciasDisponibles.toLocaleString()} créditos pendientes</div></div>
                      <ChevronRight size={14} style={{color:"#8dc63f"}}/>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="stats">
                    <div className="stat-c"><div className="stat-ico ico-g"><Heart size={15}/></div><div><div className="stat-v">{perfil?.vidas??"—"}</div><div className="stat-l">Vidas</div></div></div>
                    <div className="stat-c"><div className="stat-ico ico-b"><BarChart2 size={15}/></div><div><div className="stat-v">{perfil?.creditos?.toLocaleString()??"—"}</div><div className="stat-l">Créditos</div></div></div>
                    <div className="stat-c"><div className="stat-ico ico-a"><Flame size={15}/></div><div><div className="stat-v">{perfil?.racha??0}</div><div className="stat-l">Racha</div></div></div>
                    <div className="stat-c"><div className="stat-ico ico-g"><Activity size={15}/></div><div><div className="stat-v" style={{fontSize:12,color:statusColor}}>{perfil?.estado_juego??"VIVO"}</div><div className="stat-l">Estado</div></div></div>
                  </div>

                  {/* Mis predicciones — pestañas Acertadas / Falladas / Pendientes */}
                  <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.06)",borderRadius:4,marginBottom:12,overflow:"hidden"}}>
  <div className="pred-header">
    <div style={{display:"flex",alignItems:"center",gap:7,paddingBottom:9}}>
      <div style={{width:3,height:12,background:"#8dc63f",borderRadius:2,flexShrink:0}}/>
      <span style={{fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,color:"rgba(255,255,255,.4)",letterSpacing:2,textTransform:"uppercase"}}>Mis predicciones</span>
    </div>
    <div className="pred-tabs">
      {([ {k:"ACERTADAS", l:"✓ Acertadas", cls:"ok"}, {k:"FALLADAS", l:"✗ Falladas", cls:"fa"}, {k:"PENDIENTES",l:"⏳ Pendientes",cls:"pe"} ] as const).map(t=>(
        <button key={t.k} className={`pred-tab ${filtroPred===t.k?t.cls:""}`} onClick={()=>{setFiltroPred(t.k);if(misPredicciones.length===0)cargarMisPredicciones();}}>{t.l}</button>
      ))}
    </div>
  </div>
  
  <div className="pred-body" style={{maxHeight:"300px", overflowY:"auto"}}>
    {loadingPredicciones&&(
      <div style={{padding:"16px",textAlign:"center",fontSize:10,color:"rgba(255,255,255,.3)",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
        <Activity size={12} className="spin-ico"/>Cargando...
      </div>
    )}
    {!loadingPredicciones&&misPredicciones.length===0&&(
      <button onClick={cargarMisPredicciones} className="pred-load-btn">
        <Activity size={12}/> CARGAR MIS PREDICCIONES
      </button>
    )}
    {!loadingPredicciones&&misPredicciones.length>0&&(()=>{
      const filtrados=misPredicciones.filter(p=>filtroPred==="ACERTADAS"?p.is_correct===true:filtroPred==="FALLADAS"?p.is_correct===false:p.is_correct===null);
      const lista=filtrados.slice(0,4);
      const col=filtroPred==="ACERTADAS"?"#8dc63f":filtroPred==="FALLADAS"?"#ef4444":"#f59e0b";
      return(
        <>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 14px",borderBottom:"1px solid rgba(255,255,255,.04)",background:"rgba(0,0,0,.15)"}}>
            <span style={{fontSize:9,color:"rgba(255,255,255,.25)",fontFamily:"'Oswald',sans-serif",letterSpacing:.5}}>
              <span style={{color: col, fontWeight: 700}}>{filtrados.length}</span> {filtroPred.toLowerCase()}
            </span>
            <button onClick={()=>setTab("predicciones")} style={{background:"none",border:"none",color:"rgba(141,198,63,.6)",fontSize:9,fontFamily:"'Oswald',sans-serif",fontWeight:700,cursor:"pointer",letterSpacing:.5,display:"flex",alignItems:"center",gap:3}}>VER TODAS <ChevronRight size={10}/></button>
          </div>
          {lista.map(p=>(
            <div key={p.id} className="pred-row">
              <div className={filtroPred==="ACERTADAS"?"pred-dot-ok":filtroPred==="FALLADAS"?"pred-dot-fa":"pred-dot-pe"}/>
              <div style={{flex:1,minWidth:0}}>
                <div className="pred-match">{p.matches?.home_team} vs {p.matches?.away_team}</div>
                <div className="pred-sub">{p.tournaments?.name||"Individual"}</div>
              </div>
              <span className={filtroPred==="ACERTADAS"?"pred-badge-ok":filtroPred==="FALLADAS"?"pred-badge-fa":"pred-badge-pe"}>{filtroPred==="ACERTADAS"?"✓":filtroPred==="FALLADAS"?"✗":"⏳"}</span>
            </div>
          ))}
          <button onClick={()=>setMisPredicciones([])} 
            style={{width:"100%",padding:"8px",background:"transparent",border:"none",borderTop:"1px solid rgba(255,255,255,.04)",color:"rgba(255,255,255,.15)",fontFamily:"'Oswald',sans-serif",fontSize:8,fontWeight:700,cursor:"pointer",letterSpacing:1}}>
            CERRAR ✕
          </button>
        </>
      );
    })()}
  </div>
</div>

                  {/* Filtros — clic despliega la lista, verde al activar */}
                  <div className="flt-row">
                    {([{id:"TORNEO",l:"🏆 Torneos"},{id:"COMBINADA",l:"🎯 Combinadas"},{id:"INDIVIDUAL",l:"⚡ Individual"},{id:"VIP",l:"⭐ VIP"}] as const).map(f=>(
                      <button key={f.id}
                        className={`flt ${filter===f.id?"on":""}`}
                        onClick={()=>setFilter(filter===f.id?null:f.id)}>
                        {f.l}
                      </button>
                    ))}
                  </div>

                  {/* LISTA EVENTOS — oculta hasta que se seleccione un filtro */}
                  {filter===null?null:loading?(
                    <div className="empty"><Activity size={28} className="spin-ico" style={{margin:"0 auto"}}/><div className="empty-t">Cargando eventos...</div></div>
                  ):eventosFiltrados.length===0?(
                    <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.06)",borderRadius:4,padding:"28px 16px",textAlign:"center" as const}}>
                      <div style={{fontSize:28,marginBottom:10}}>{filter==="INDIVIDUAL"?"⚡":filter==="TORNEO"?"🏆":filter==="COMBINADA"?"🎯":"⭐"}</div>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:700,color:"rgba(255,255,255,.4)",marginBottom:6}}>{filter==="INDIVIDUAL"?"SIN PARTIDOS INDIVIDUALES":filter==="TORNEO"?"SIN TORNEOS ACTIVOS":filter==="COMBINADA"?"SIN COMBINADAS ACTIVAS":"SIN EVENTOS VIP"}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,.25)"}}>{filter==="INDIVIDUAL"?"No hay partidos individuales disponibles en este momento.":"No hay eventos de este tipo disponibles en este momento."}</div>
                    </div>
                  ):(
                    <>
                      <div className="sec-h"><div className="sec-t">Mercados principales</div><span style={{fontSize:10,color:"rgba(255,255,255,.25)"}}>{eventosFiltrados.length} eventos</span></div>
                      <div className="ev-list">
                        {eventosFiltrados.map(ev=>{
                          const sinSaldo=(ev.costo_vidas>0&&(perfil?.vidas??0)<ev.costo_vidas)||(ev.costo_creditos>0&&(perfil?.creditos??0)<ev.costo_creditos);
                          const hasOdds=ev.cuota_local&&ev.cuota_empate&&ev.cuota_visitante;
                          const handleEntrar=async()=>{
                            const{data:{user}}=await supabase.auth.getUser();
                            if(!user){router.push('/login');return;}
                            if(ev.tipo_evento==='INDIVIDUAL'){router.push('/individual');return;}
                            if(ev.tipo_evento==='COMBINADA'){router.push('/combinadas');return;}
                            const{data:entrada}=await supabase.from('tournament_entries').select('id').eq('user_id',user.id).eq('tournament_id',ev.id).maybeSingle();
                            if(entrada)router.push(`/campo-de-batalla/${ev.slug}`);
                            else setEventoSeleccionado(ev as unknown as EventoJuego);
                          };
                          return (
                            <div key={ev.id} className={`ev-row ${ev.tipo_evento==="VIP"?"vip":""}`}>
                              <div className="ev-main">
                                <div className="ev-info">
                                  <div className="ev-head">
                                    <span className="ev-league">{ev.sede||"Mundial FIFA 2026"}</span>
                                    {ev.fecha_evento&&<span className="ev-time">{new Date(ev.fecha_evento).toLocaleDateString("es-CO",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span>}
                                    {ev.tipo_evento==="VIP"&&<span className="ev-badge-vip">⭐ VIP</span>}
                                    {ev.bonus_activo&&(ev.bonus_px??0)>0&&<span className="ev-badge-bon">🎁 BONUS</span>}
                                  </div>
                                  <div className="ev-teams">
                                    <div className="ev-team">{ev.equipo_local||ev.nombre}</div>
                                    {ev.equipo_visitante&&<div className="ev-team">{ev.equipo_visitante}</div>}
                                  </div>
                                  <div className="ev-meta">
                                    {ev.costo_vidas>0?`${ev.costo_vidas} Vida${ev.costo_vidas>1?"s":""} de ingreso`:`${ev.costo_creditos||ev.costo_px||0} PX de ingreso`}
                                  </div>
                                </div>
                                {hasOdds?(
                                  <div className="ev-odds-box">
                                    {[{l:"1",v:ev.cuota_local,r:"1"},{l:"X",v:ev.cuota_empate,r:"X"},{l:"2",v:ev.cuota_visitante,r:"2"}].map(o=>(
                                      <div key={o.r} className="ev-odd" onClick={()=>hacerApuesta(ev,o.r as any)}>
                                        <span className="ev-odd-l">{o.l}</span>
                                        <span className="ev-odd-v">{o.v}</span>
                                      </div>
                                    ))}
                                  </div>
                                ):(
                                  sinSaldo
                                    ?<button className="ev-enter-dis"><Zap size={11}/> Sin saldo</button>
                                    :<button className="ev-enter" onClick={handleEntrar}>Entrar <ChevronRight size={11}/></button>
                                )}
                              </div>
                              {hasOdds&&(
                                <div className="ev-bet-bar">
                                  <input type="number" className="ev-bet-in" placeholder="Monto a apostar (mín. 50 PX)" value={betAmts[ev.id]||""} onChange={e=>setBetAmts(b=>({...b,[ev.id]:e.target.value}))}/>
                                  {sinSaldo
                                    ?<button className="ev-enter-dis"><Zap size={10}/> Sin saldo</button>
                                    :<button className="ev-bet-btn" onClick={handleEntrar}><ChevronRight size={11}/> Entrar</button>
                                  }
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

                        {/* ═══ TAB GANANCIAS ═══ */}
            {tab==="ganancias"&&(
              <>
                {/* BANNER LIMPIO */}
                <div style={{position:"relative",height:260,overflow:"hidden",background:"#0d1119"}}>
  <img src="/img/kick14.jpg" alt="Mis ganancias"
    style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,rgba(10,13,20,.92) 0%,rgba(10,13,20,.5) 100%)"}}/>
  <div style={{position:"relative",zIndex:2,padding:"0 24px",height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",paddingBottom:28}}>
    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,color:"#8dc63f",letterSpacing:2,marginBottom:8,textTransform:"uppercase" as const}}>💰 Mis ganancias</div>
    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:28,fontWeight:700,color:"#fff",lineHeight:1.05,textTransform:"uppercase" as const}}>TUS PREDICCIONES<br/>TIENEN VALOR</div>
    <div style={{fontSize:11,color:"rgba(255,255,255,.6)",marginTop:8}}>Saldo disponible: <b style={{color:"#8dc63f"}}>{perfil?.creditos?.toLocaleString()} PX</b></div>
  </div>
</div>

                <div className="bd-pad">
                  {/* STATS */}
                  <div className="stats" style={{marginBottom:14}}>
                    <div className="stat-c"><div className="stat-ico ico-g"><Award size={15}/></div><div><div className="stat-v">{totalGanancias.toLocaleString()}</div><div className="stat-l">Total ganado</div></div></div>
                    <div className="stat-c"><div className="stat-ico ico-a"><Wallet size={15}/></div><div><div className="stat-v">{gananciasDisponibles.toLocaleString()}</div><div className="stat-l">Disponible</div></div></div>
                    <div className="stat-c"><div className="stat-ico ico-p"><Gift size={15}/></div><div><div className="stat-v">{totalComisionRef.toLocaleString()}</div><div className="stat-l">Por referidos</div></div></div>
                    <div className="stat-c"><div className="stat-ico ico-b"><DollarSign size={15}/></div><div><div className="stat-v">{config.moneda}</div><div className="stat-l">Tu moneda</div></div></div>
                  </div>

                  {/* CÓDIGO GANANCIA ACTIVO */}
                  {codigoGananciaActivo&&(
                    <div style={{background:"#111827",border:"1px solid rgba(141,198,63,.2)",borderLeft:"3px solid #8dc63f",borderRadius:4,padding:"14px 16px",marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10}}>
                        <Trophy size={15} style={{color:"#8dc63f",flexShrink:0}}/>
                        <div>
                          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:700,color:"#fff",textTransform:"uppercase" as const,letterSpacing:.5}}>Ticket de Ganancia Activo</div>
                          <div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginTop:1}}>Preséntalo en un punto físico para cobrar</div>
                        </div>
                      </div>
                      <div style={{background:"#0a0d14",border:"1px solid rgba(255,255,255,.06)",borderRadius:3,padding:"12px",marginBottom:9,textAlign:"center" as const}}>
                        <div style={{fontSize:8,color:"rgba(255,255,255,.25)",letterSpacing:2,textTransform:"uppercase" as const,marginBottom:3,fontFamily:"'Oswald',sans-serif"}}>CÓDIGO DE RETIRO</div>
                        <div style={{fontFamily:"monospace",fontSize:20,fontWeight:700,color:"#8dc63f",letterSpacing:4}}>{codigoGananciaActivo.codigo}</div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:9}}>
                        <div style={{background:"#0a0d14",border:"1px solid rgba(255,255,255,.06)",borderRadius:3,padding:"8px 10px"}}>
                          <div style={{fontSize:8,color:"rgba(255,255,255,.25)",textTransform:"uppercase" as const,marginBottom:2}}>Monto a cobrar</div>
                          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:700,color:"#fff"}}>{simboloMoneda}{Number(codigoGananciaActivo.monto_local??0).toLocaleString("es-CO")} {codigoGananciaActivo.moneda}</div>
                        </div>
                        <div style={{background:"#0a0d14",border:"1px solid rgba(255,255,255,.06)",borderRadius:3,padding:"8px 10px"}}>
                          <div style={{fontSize:8,color:"rgba(255,255,255,.25)",textTransform:"uppercase" as const,marginBottom:2}}>Vence</div>
                          <div style={{fontSize:11,color:"#f59e0b",fontWeight:600}}>{new Date(codigoGananciaActivo.expira_en).toLocaleDateString("es-CO",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
                        </div>
                      </div>
                      <button onClick={()=>{navigator.clipboard.writeText(codigoGananciaActivo.codigo);showToast("Código copiado","ok");}}
                        style={{width:"100%",padding:"9px",background:"rgba(141,198,63,.08)",border:"1px solid rgba(141,198,63,.2)",borderRadius:3,color:"#8dc63f",fontFamily:"'Oswald',sans-serif",fontSize:10,fontWeight:700,cursor:"pointer",textTransform:"uppercase" as const,letterSpacing:1,transition:"all .15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background="#8dc63f";e.currentTarget.style.color="#0a0d14";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="rgba(141,198,63,.08)";e.currentTarget.style.color="#8dc63f";}}>
                        Copiar código
                      </button>
                    </div>
                  )}

                  {/* BARRA PROGRESO */}
                  <BarraRetiro actual={perfil?.creditos??0} minimo={config.minimo_retiro/tasaCambio} moneda={config.moneda}/>

                  {/* SOLICITAR RETIRO — COLAPSABLE */}
                  <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.06)",borderRadius:4,overflow:"hidden",marginBottom:12}}>
                    <button
                      onClick={()=>{if(listo_retiro)setMostrarFormRetiro(v=>!v);}}
                      style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",background:"none",border:"none",cursor:listo_retiro?"pointer":"not-allowed",transition:"background .15s"}}
                      onMouseEnter={e=>{if(listo_retiro)e.currentTarget.style.background="rgba(141,198,63,.04)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="none";}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:3,height:14,background:listo_retiro?"#8dc63f":"rgba(255,255,255,.15)",borderRadius:2,flexShrink:0}}/>
                        <Wallet size={13} style={{color:listo_retiro?"#8dc63f":"rgba(255,255,255,.3)"}}/>
                        <span style={{fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:700,letterSpacing:.5,textTransform:"uppercase" as const,color:listo_retiro?"#fff":"rgba(255,255,255,.3)"}}>
                          {listo_retiro?"Solicitar retiro":"Retiro bloqueado — mín. "+config.minimo_retiro.toLocaleString()+" créditos"}
                        </span>
                      </div>
                      {listo_retiro&&(
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontFamily:"'Oswald',sans-serif",fontSize:9,color:"#8dc63f",letterSpacing:.5}}>{mostrarFormRetiro?"CERRAR":"ABRIR"}</span>
                          <div style={{width:20,height:20,borderRadius:"50%",background:mostrarFormRetiro?"#8dc63f":"rgba(141,198,63,.1)",border:"1px solid rgba(141,198,63,.25)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
                            <ChevronDown size={11} style={{color:mostrarFormRetiro?"#0a0d14":"#8dc63f",transform:mostrarFormRetiro?"rotate(180deg)":"none",transition:"transform .2s"}}/>
                          </div>
                        </div>
                      )}
                    </button>

                    {mostrarFormRetiro&&listo_retiro&&(
                      <div style={{padding:"0 16px 16px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
                        {/* Método */}
                        <div style={{marginTop:14,marginBottom:12}}>
                          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,color:"rgba(255,255,255,.3)",letterSpacing:1.5,textTransform:"uppercase" as const,marginBottom:8}}>¿Cómo quieres cobrar?</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                            {([{id:"TRANSFERENCIA",ico:"🏦",lbl:"Transferencia bancaria",sub:"Recibes en tu cuenta"},{id:"PUNTO_FISICO",ico:"🏪",lbl:"Punto físico",sub:"Cobras en efectivo con código"}] as const).map(m=>(
                              <div key={m.id} style={{background:"rgba(255,255,255,.02)",border:`1px solid ${formRetiro.metodo_retiro===m.id?"#8dc63f":"rgba(255,255,255,.07)"}`,borderRadius:4,padding:"12px",display:"flex",flexDirection:"column" as const,gap:7,transition:"border-color .15s"}}>
                                <div style={{display:"flex",alignItems:"center",gap:8}}>
                                  <span style={{fontSize:18}}>{m.ico}</span>
                                  <div>
                                    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:700,color:"#fff",letterSpacing:.3}}>{m.lbl}</div>
                                    <div style={{fontSize:9,color:"rgba(255,255,255,.3)",marginTop:1}}>{m.sub}</div>
                                  </div>
                                </div>
                                <button onClick={()=>setFormRetiro(f=>({...f,metodo_retiro:m.id}))}
                                  style={{padding:"5px 12px",alignSelf:"flex-start" as const,background:formRetiro.metodo_retiro===m.id?"#8dc63f":"transparent",border:`1px solid ${formRetiro.metodo_retiro===m.id?"#8dc63f":"rgba(255,255,255,.15)"}`,borderRadius:3,cursor:"pointer",transition:"all .15s",fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,letterSpacing:.5,color:formRetiro.metodo_retiro===m.id?"#0a0d14":"rgba(255,255,255,.45)"}}>
                                  {formRetiro.metodo_retiro===m.id?"✓ Seleccionado":"Seleccionar"}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        {formRetiro.metodo_retiro==="PUNTO_FISICO"&&(
                          <div style={{background:"rgba(141,198,63,.04)",border:"1px solid rgba(141,198,63,.12)",borderRadius:3,padding:"10px 12px",marginBottom:10,fontSize:11,color:"rgba(141,198,63,.75)",lineHeight:1.6}}>
                            🏪 Recibirás un <b style={{color:"#8dc63f"}}>código de ganancia</b> válido 72 horas para cobrar en efectivo.
                          </div>
                        )}
                        {formRetiro.creditos_solicitados&&parseFloat(formRetiro.creditos_solicitados)>0&&(
                          <div style={{padding:"9px 12px",background:"rgba(141,198,63,.04)",border:"1px solid rgba(141,198,63,.1)",borderRadius:3,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap" as const,gap:5}}>
                            <span style={{fontSize:10,color:"rgba(255,255,255,.35)"}}>{parseFloat(formRetiro.creditos_solicitados)} PX × {tasaCambio.toLocaleString()}</span>
                            <span style={{fontFamily:"'Oswald',sans-serif",fontSize:15,fontWeight:700,color:"#8dc63f"}}>{simboloMoneda}{(parseFloat(formRetiro.creditos_solicitados)*tasaCambio*(1-config.comision_retiro/100)).toLocaleString("es-CO")} {config.moneda}</span>
                            <span style={{fontSize:9,color:"rgba(255,255,255,.2)",width:"100%"}}>Comisión {config.comision_retiro}% ya descontada</span>
                          </div>
                        )}
                        <div style={{fontSize:10,color:"rgba(255,255,255,.3)",marginBottom:10,padding:"7px 10px",background:"rgba(255,255,255,.02)",borderRadius:3,border:"1px solid rgba(255,255,255,.05)"}}>Comisión del {config.comision_retiro}% sobre el monto retirado.</div>
                        <div className="lbl">Créditos a retirar *</div>
                        <input type="number" className="inp" placeholder={`Mínimo ${config.minimo_retiro.toLocaleString()}`} value={formRetiro.creditos_solicitados} onChange={e=>setFormRetiro(f=>({...f,creditos_solicitados:e.target.value}))}/>
                        <div className="lbl">Datos del beneficiario *</div>
                        <div className="inp-row">
                          <input className="inp" placeholder="Nombre completo" value={formRetiro.nombre_beneficiario} onChange={e=>setFormRetiro(f=>({...f,nombre_beneficiario:e.target.value}))}/>
                          <input className="inp" placeholder="Número de documento" value={formRetiro.numero_documento} onChange={e=>setFormRetiro(f=>({...f,numero_documento:e.target.value}))}/>
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
                          {metodosPago.length>0?metodosPago.map(m=><option key={m.metodo_clave} value={m.metodo_clave}>{m.metodo_nombre} — {m.descripcion}</option>):<><option value="nequi">Nequi</option><option value="daviplata">Daviplata</option><option value="transferencia">Transferencia bancaria</option><option value="paypal">PayPal</option></>}
                        </select>
                        <div className="inp-row">
                          <input className="inp" placeholder="Número de cuenta / celular / correo *" value={formRetiro.numero_cuenta} onChange={e=>setFormRetiro(f=>({...f,numero_cuenta:e.target.value}))}/>
                          <input className="inp" placeholder="Banco (opcional)" value={formRetiro.banco} onChange={e=>setFormRetiro(f=>({...f,banco:e.target.value}))}/>
                        </div>
                        <div style={{display:"flex",gap:8,marginTop:4}}>
                          <button onClick={()=>setMostrarFormRetiro(false)}
                            style={{flex:1,padding:"11px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:4,color:"rgba(255,255,255,.4)",fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:.5,transition:"all .15s"}}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.2)";e.currentTarget.style.color="#fff";}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.08)";e.currentTarget.style.color="rgba(255,255,255,.4)";}}>
                            Cancelar
                          </button>
                          <button onClick={enviarRetiro}
                            style={{flex:3,padding:"11px",background:"#8dc63f",border:"none",borderRadius:4,color:"#0a0d14",fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:.5,textTransform:"uppercase" as const,transition:"background .15s"}}
                            onMouseEnter={e=>{e.currentTarget.style.background="#7ab52f";}}
                            onMouseLeave={e=>{e.currentTarget.style.background="#8dc63f";}}>
                            Enviar solicitud
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* HISTORIAL */}
                  <div className="sec-h"><div className="sec-t">Historial de premios</div></div>
                  {ganancias.length===0?(
                    <div style={{textAlign:"center",padding:"30px 20px",color:"rgba(255,255,255,.2)"}}>
                      <Trophy size={28} style={{margin:"0 auto 8px",display:"block",opacity:.2}}/>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,color:"rgba(255,255,255,.25)"}}>Aún no tienes ganancias</div>
                      <div style={{fontSize:11,marginTop:4}}>Participa en eventos y predicciones para ganar créditos</div>
                    </div>
                  ):(
                    ganancias.map(g=>(
                      <div key={g.id} className={`gan-card ${g.estado==="PENDIENTE_RETIRO"?"pendiente":"retirado"}`}>
                        <div style={{width:32,height:32,borderRadius:4,flexShrink:0,background:g.estado==="PENDIENTE_RETIRO"?"rgba(141,198,63,.1)":"rgba(255,255,255,.04)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <Trophy size={14} style={{color:g.estado==="PENDIENTE_RETIRO"?"#8dc63f":"rgba(255,255,255,.3)"}}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:600,color:"#fff"}}>{g.evento_nombre}</div>
                          <div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginTop:2}}>{new Date(g.fecha).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"})}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:15,fontWeight:700,color:"#8dc63f"}}>+{(g.premio_creditos+g.premio_pozo).toLocaleString()}</div>
                          <span style={{fontSize:8,fontWeight:700,padding:"2px 6px",borderRadius:2,letterSpacing:.5,fontFamily:"'Oswald',sans-serif",background:g.estado==="PENDIENTE_RETIRO"?"rgba(141,198,63,.1)":"rgba(255,255,255,.05)",color:g.estado==="PENDIENTE_RETIRO"?"#8dc63f":"rgba(255,255,255,.3)"}}>{g.estado==="PENDIENTE_RETIRO"?"DISPONIBLE":"RETIRADO"}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* ═══ TAB PERFIL ═══ */}
            {tab==="perfil"&&perfil&&(
              <div className="bd-pad">

               {/* ── BANNER PERFIL ── */}
                <div style={{position:"relative",height:260,borderRadius:4,overflow:"hidden",marginBottom:18,background:"#0d1119"}}>
                  <img src="/img/kick2.jpg" alt=""
                    style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,rgba(10,13,20,.92) 0%,rgba(10,13,20,.5) 100%)"}}/>
                  <div style={{position:"relative",zIndex:2,padding:"20px 22px",height:"100%",display:"flex",alignItems:"flex-end",paddingBottom:28,gap:20}}>
                    <div style={{width:90,height:90,minWidth:90,borderRadius:"50%",background:"rgba(141,198,63,.08)",border:"3px solid rgba(141,198,63,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Oswald',sans-serif",fontSize:36,fontWeight:700,color:"#8dc63f",flexShrink:0,overflow:"hidden"}}>
                      {perfil.avatar_url?<img src={perfil.avatar_url} alt={perfil.nombre} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:perfil.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontSize:20,fontWeight:700,color:"#fff"}}>{perfil.nombre}</div>
                      <div style={{fontFamily:"monospace",fontSize:10,color:"rgba(255,255,255,.35)",marginTop:2}}>{perfil.codigo_jugador}</div>
                      <div style={{marginTop:6,display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:2,background:`${statusColor}15`,border:`1px solid ${statusColor}44`}}>
                        <div style={{width:5,height:5,borderRadius:"50%",background:statusColor,flexShrink:0}}/>
                        <span style={{fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,color:statusColor,letterSpacing:1,textTransform:"uppercase"}}>{perfil.estado_juego}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── STATS ── */}
                <div className="stats" style={{marginBottom:14}}>
                  <div className="stat-c"><div className="stat-ico ico-g"><Heart size={15}/></div><div><div className="stat-v">{perfil.vidas}</div><div className="stat-l">Vidas</div></div></div>
                  <div className="stat-c"><div className="stat-ico ico-b"><BarChart2 size={15}/></div><div><div className="stat-v">{perfil.creditos.toLocaleString()}</div><div className="stat-l">Créditos</div></div></div>
                  <div className="stat-c"><div className="stat-ico ico-a"><Flame size={15}/></div><div><div className="stat-v">{perfil.racha}</div><div className="stat-l">Racha</div></div></div>
                  <div className="stat-c"><div className="stat-ico ico-g"><Star size={15}/></div><div><div className="stat-v">{perfil.mejor_racha}</div><div className="stat-l">Mejor racha</div></div></div>
                </div>

                {/* ── DOS COLUMNAS: info + stats ── */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>

                  {/* Datos personales */}
                  <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.06)",borderRadius:4,padding:"14px 16px"}}>
                    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,color:"rgba(255,255,255,.3)",letterSpacing:2,textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
                      <User size={10} style={{color:"#8dc63f"}}/> Datos personales
                    </div>
                    {[{lbl:"Nombre",val:perfil.nombre_completo},{lbl:"Correo",val:perfil.email},{lbl:"País",val:`${perfil.pais} (${perfil.moneda})`},{lbl:"Teléfono",val:perfil.telefono||"—"}].map(f=>(
                      <div key={f.lbl} style={{marginBottom:9}}>
                        <div style={{fontSize:8,color:"rgba(255,255,255,.2)",letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'Oswald',sans-serif",marginBottom:2}}>{f.lbl}</div>
                        <div style={{fontSize:12,color:"rgba(255,255,255,.65)",fontWeight:500}}>{f.val||"—"}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {/* Precisión */}
                    <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.06)",borderRadius:4,padding:"14px 16px"}}>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,color:"rgba(255,255,255,.3)",letterSpacing:2,textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                        <TrendingUp size={10} style={{color:"#8dc63f"}}/> Precisión
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:7,fontSize:11,color:"rgba(255,255,255,.4)"}}><span>{perfil.predicciones_correctas} correctas de {perfil.total_predicciones}</span><span style={{color:"#8dc63f",fontWeight:700}}>{precisionPct}%</span></div>
                      <div className="prec-bar-bg"><div className="prec-bar" style={{width:`${precisionPct}%`}}/></div>
                    </div>

                    {/* Seguridad */}
                    <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.06)",borderRadius:4,padding:"14px 16px"}}>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,color:"rgba(255,255,255,.3)",letterSpacing:2,textTransform:"uppercase",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                        <Shield size={10} style={{color:"#8dc63f"}}/> Seguridad
                      </div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,.35)",lineHeight:1.5}}>Cuenta verificada. Para cambiar contraseña usa <span style={{color:"#8dc63f"}}>"Recuperar contraseña"</span> en el login.</div>
                    </div>
                  </div>
                </div>

                {/* ── CÓDIGO REFERIDO ── */}
                <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.06)",borderRadius:4,padding:"14px 16px",marginBottom:10}}>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,color:"rgba(255,255,255,.3)",letterSpacing:2,textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                    <Gift size={10} style={{color:"#8dc63f"}}/> Mi código de referido
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"10px 14px",background:"rgba(141,198,63,.05)",border:"1px solid rgba(141,198,63,.15)",borderRadius:3}}>
                    <span style={{fontFamily:"'Oswald',sans-serif",fontSize:20,fontWeight:700,color:"#8dc63f",letterSpacing:3}}>{perfil.codigo_referido}</span>
                    <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/register?ref=${perfil.codigo_referido}`);showToast("Enlace copiado","ok");}}
                      style={{padding:"6px 14px",background:"rgba(141,198,63,.1)",border:"1px solid rgba(141,198,63,.2)",borderRadius:3,color:"#8dc63f",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'Oswald',sans-serif",letterSpacing:.5,transition:"all .15s",whiteSpace:"nowrap"}}
                      onMouseEnter={e=>{e.currentTarget.style.background="#8dc63f";e.currentTarget.style.color="#0a0d14";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="rgba(141,198,63,.1)";e.currentTarget.style.color="#8dc63f";}}>
                      Copiar enlace
                    </button>
                  </div>
                </div>

                {/* ── DATOS DE IDENTIFICACIÓN Y PAGO — COLAPSABLE ── */}
                <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.06)",borderRadius:4,overflow:"hidden",marginBottom:10}}>
                  {/* Header con botón expandir */}
                  <button onClick={()=>setPerfilExpanded(v=>!v)}
                    style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",background:"none",border:"none",cursor:"pointer",transition:"background .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(141,198,63,.04)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="none";}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:3,height:14,background:"#8dc63f",borderRadius:2,flexShrink:0}}/>
                      <span style={{fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:700,color:"#fff",letterSpacing:1,textTransform:"uppercase"}}>Datos de identificación y pago</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <span style={{fontFamily:"'Oswald',sans-serif",fontSize:9,color:"#8dc63f",letterSpacing:.5}}>{perfilExpanded?"CERRAR":"EXPANDIR"}</span>
                      <div style={{width:20,height:20,borderRadius:"50%",background:perfilExpanded?"#8dc63f":"rgba(141,198,63,.1)",border:"1px solid rgba(141,198,63,.25)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
                        <ChevronDown size={11} style={{color:perfilExpanded?"#0a0d14":"#8dc63f",transform:perfilExpanded?"rotate(180deg)":"none",transition:"transform .2s"}}/>
                      </div>
                    </div>
                  </button>
                  {/* Contenido colapsable */}
                  {perfilExpanded&&(
                    <div style={{padding:"0 16px 16px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
                      <PerfilExtendido userId={perfil.id}/>
                    </div>
                  )}
                </div>

              </div>
            )}

           {/* ═══ TAB HISTORIAL — ESTILO CORPORATIVO CODERE ═══ */}
            {tab==="historial"&&(
              <div className="bd-pad">
                
                {/* BANNER TÉCNICO */}
                <div style={{position:"relative",height:260,overflow:"hidden",marginBottom:24,background:"#0d1119"}}>
  <img src="/img/kick15.jpg" alt="Historial"
    style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,rgba(10,13,20,.92) 0%,rgba(10,13,20,.5) 100%)"}}/>
  <div style={{position:"relative",zIndex:2,padding:"0 24px",height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",paddingBottom:28}}>
    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,color:"#8dc63f",letterSpacing:2,marginBottom:8,textTransform:"uppercase" as const}}>📋 Historial</div>
    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:28,fontWeight:700,color:"#fff",lineHeight:1.05,textTransform:"uppercase" as const}}>HISTORIAL DE<br/>MOVIMIENTOS</div>
  </div>
</div>

                <div style={{marginBottom:15, borderLeft:"3px solid #8dc63f", paddingLeft:10}}>
                  <div style={{color:"#8dc63f", fontSize:10, fontWeight:700, letterSpacing:2, fontFamily:"'Oswald', sans-serif", textTransform:"uppercase"}}>Transacciones de cuenta</div>
                </div>

                {transacciones.length===0?<div className="empty" style={{color:"#4b5563"}}><div className="empty-t">No hay movimientos registrados</div></div>:(
                  transacciones.map(tx=>{
                    const pos=tx.creditos>0||tx.vidas>0;
                    return(
                      <div key={tx.id} style={{
                        background:"#111827",
                        border:"1px solid #1f2937",
                        marginBottom:6,
                        padding:"14px 20px",
                        display:"flex",
                        alignItems:"center"
                      }}>
                        {/* Icono de estado sobrio */}
                        <div style={{
                          width:30,height:30,background:pos?"#1a2e1d":"#1a1a1a",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          border:`1px solid ${pos?"#8dc63f":"#374151"}`,
                          marginRight:16
                        }}>
                          {pos?<TrendingUp size={14} style={{color:"#8dc63f"}}/>:<Activity size={14} style={{color:"#6b7280"}}/>}
                        </div>
                        
                        {/* Datos de transacción */}
                        <div style={{flex:1}}>
                          <div style={{fontSize:11,fontWeight:700,color:"#fff",fontFamily:"'Roboto', sans-serif"}}>{tx.tipo.replace(/_/g," ")}</div>
                          <div style={{fontSize:10,color:"#9ca3af",marginTop:2,fontFamily:"'Roboto', sans-serif"}}>{tx.descripcion||"—"}</div>
                        </div>
                        
                        {/* Monto y Fecha */}
                        <div style={{textAlign:"right"}}>
                          <div style={{fontFamily:"'Oswald', sans-serif",fontSize:14,fontWeight:600,color:pos?"#8dc63f":"#e5e7eb"}}>
                            {pos?"+":""}{tx.creditos!==0?`${tx.creditos.toLocaleString()} cr`:""}
                          </div>
                          <div style={{fontSize:9,color:"#4b5563",marginTop:2,fontFamily:"'Roboto', sans-serif"}}>{new Date(tx.created_at).toLocaleDateString("es-CO")}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ═══ TAB RECARGAR ═══ */}
            {tab==="recargar"&&(
              <div className="bd-pad">

                {/* Banner Recargar */}
                <div style={{position:"relative",height:260,overflow:"hidden",marginBottom:16,background:"#0d1119"}}>
  <img src="/img/kick1.jpg" alt="Recarga Banner"
    style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,rgba(10,13,20,.92) 0%,rgba(10,13,20,.5) 100%)"}}/>
  <div style={{position:"relative",zIndex:2,padding:"0 24px",height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",paddingBottom:28}}>
    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,color:"#8dc63f",letterSpacing:2,marginBottom:8,textTransform:"uppercase" as const}}>⚡ Recarga tu cuenta</div>
    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:28,fontWeight:700,color:"#fff",lineHeight:1.05,textTransform:"uppercase" as const}}>SIGUE EN EL<br/>JUEGO</div>
    <div style={{fontSize:11,color:"rgba(255,255,255,.6)",marginTop:8}}>Compra vidas y créditos para seguir prediciendo</div>
  </div>
</div>

                {/* Saldo actual */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                  <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.06)",borderRadius:4,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:30,height:30,borderRadius:4,background:"rgba(141,198,63,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <Heart size={14} style={{color:"#8dc63f"}}/>
                    </div>
                    <div>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontSize:20,fontWeight:700,color:"#fff"}}>{perfil?.vidas??0}</div>
                      <div style={{fontSize:9,color:"rgba(255,255,255,.3)",letterSpacing:1,textTransform:"uppercase" as const}}>Vidas actuales</div>
                    </div>
                  </div>
                  <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.06)",borderRadius:4,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:30,height:30,borderRadius:4,background:"rgba(141,198,63,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <BarChart2 size={14} style={{color:"#8dc63f"}}/>
                    </div>
                    <div>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontSize:20,fontWeight:700,color:"#fff"}}>{perfil?.creditos?.toLocaleString()??0}</div>
                      <div style={{fontSize:9,color:"rgba(255,255,255,.3)",letterSpacing:1,textTransform:"uppercase" as const}}>Créditos PX</div>
                    </div>
                  </div>
                </div>

                {/* Canjear PIN */}
                <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.06)",borderRadius:4,padding:"16px",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <QrCode size={13} style={{color:"#8dc63f"}}/>
                    <span style={{fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:700,color:"#fff",letterSpacing:.5,textTransform:"uppercase" as const}}>Canjear código PIN</span>
                  </div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginBottom:12,lineHeight:1.5}}>Compraste un código en un punto autorizado — ingrésalo para recargar tus vidas o créditos.</div>
                  <div style={{display:"flex",gap:8}}>
                    <input type="text" className="inp inp-pin" placeholder="LASTKICK-XXXX-XXXX"
                      value={pin} onChange={e=>setPin(e.target.value.toUpperCase())}
                      style={{flex:1,marginBottom:0}}/>
                    <button className="btn-g" onClick={canjearPin} disabled={pinLoad}>
                      {pinLoad?"Validando...":"Validar"}
                    </button>
                  </div>
                </div>

                {/* Compra digital */}
                <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.06)",borderRadius:4,padding:"16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <Zap size={13} style={{color:"#8dc63f"}}/>
                    <span style={{fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:700,color:"#fff",letterSpacing:.5,textTransform:"uppercase" as const}}>Compra digital</span>
                  </div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginBottom:12,lineHeight:1.5}}>Adquiere paquetes con tarjeta, transferencia o cripto mediante nuestra pasarela segura.</div>
                  <button className="btn-g" onClick={()=>router.push("/recharge")}>
                    Ir a la tienda oficial
                  </button>
                </div>

              </div>
            )}

            {/* ═══ TAB PREDICCIONES ═══ */}
            {tab==="predicciones"&&(
              <div className="bd-pad">
                {misPredicciones.length===0&&!loadingPredicciones&&(
                  <button onClick={cargarMisPredicciones} style={{width:"100%",padding:"11px",background:"rgba(141,198,63,.08)",border:"1px solid rgba(141,198,63,.2)",borderRadius:4,color:"#8dc63f",fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:700,cursor:"pointer",marginBottom:14}}>Cargar mis predicciones</button>
                )}
                {loadingPredicciones&&<div style={{textAlign:"center",padding:30,color:"rgba(255,255,255,.3)",fontSize:12}}>Cargando...</div>}
                {misPredicciones.length>0&&(
                  <>
                    <div className="stats" style={{marginBottom:14}}>
                      <div className="stat-c"><div className="stat-ico ico-b"><Activity size={15}/></div><div><div className="stat-v">{misPredicciones.length}</div><div className="stat-l">Total</div></div></div>
                      <div className="stat-c"><div className="stat-ico ico-g"><CheckCircle size={15}/></div><div><div className="stat-v" style={{color:"#8dc63f"}}>{misPredicciones.filter(p=>p.is_correct===true).length}</div><div className="stat-l">Acertadas</div></div></div>
                      <div className="stat-c"><div className="stat-ico ico-r"><X size={15}/></div><div><div className="stat-v" style={{color:"#ef4444"}}>{misPredicciones.filter(p=>p.is_correct===false).length}</div><div className="stat-l">Falladas</div></div></div>
                      <div className="stat-c"><div className="stat-ico ico-a"><Clock size={15}/></div><div><div className="stat-v" style={{color:"#f59e0b"}}>{misPredicciones.filter(p=>p.is_correct===null).length}</div><div className="stat-l">Pendientes</div></div></div>
                    </div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                      {(['TODAS','ACERTADAS','FALLADAS','PENDIENTES'] as const).map(f=>(
                        <button key={f} onClick={()=>setFiltroPred(f)} style={{padding:"4px 10px",borderRadius:3,border:`1px solid ${filtroPred===f?"#8dc63f":"rgba(255,255,255,.07)"}`,background:filtroPred===f?"rgba(141,198,63,.08)":"transparent",color:filtroPred===f?"#8dc63f":"rgba(255,255,255,.3)",fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,cursor:"pointer",letterSpacing:.5}}>{f}</button>
                      ))}
                    </div>
                    {misPredicciones.filter(p=>{if(filtroPred==="ACERTADAS")return p.is_correct===true;if(filtroPred==="FALLADAS")return p.is_correct===false;if(filtroPred==="PENDIENTES")return p.is_correct===null;return true;}).map(pred=>{
                      const m=pred.matches;const t=pred.tournaments;
                      return(
                        <div key={pred.id} className="tx-item" style={{borderLeft:`3px solid ${pred.is_correct===true?"#8dc63f":pred.is_correct===false?"#ef4444":"rgba(245,158,11,.4)"}`}}>
                          <div style={{width:28,height:28,borderRadius:4,flexShrink:0,background:pred.is_correct===true?"rgba(141,198,63,.1)":pred.is_correct===false?"rgba(239,68,68,.1)":"rgba(245,158,11,.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {pred.is_correct===true?<CheckCircle size={13} style={{color:"#8dc63f"}}/>:pred.is_correct===false?<X size={13} style={{color:"#ef4444"}}/>:<Clock size={13} style={{color:"#f59e0b"}}/>}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:600,color:"#fff"}}>{m?.home_team} vs {m?.away_team}</div>
                            <div style={{fontSize:9,color:"rgba(255,255,255,.3)",marginTop:1}}>{t?.name||"Individual"} · {t?.tipo_evento||"INDIVIDUAL"}</div>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:10,fontWeight:700,color:pred.is_correct===true?"#8dc63f":pred.is_correct===false?"#ef4444":"#f59e0b"}}>{pred.is_correct===true?"✓ ACERTASTE":pred.is_correct===false?"✗ FALLASTE":"PENDIENTE"}</div>
                            <div style={{fontSize:9,color:"rgba(255,255,255,.2)",marginTop:2}}>{pred.sealed_at?new Date(pred.sealed_at).toLocaleDateString("es-CO",{day:"2-digit",month:"short"}):"—"}</div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* ═══ TAB REFERIDOS (ESTILO DIRECTO) ═══ */}
            {tab==="referidos"&&perfil&&(
              <div className="bd-pad">
                
                {/* IMAGEN DE BANNER */}
                <div style={{position:"relative",height:260,overflow:"hidden",marginBottom:20,background:"#0d1119"}}>
  <img src="/img/kick12.jpg" alt="Banner"
    style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,rgba(10,13,20,.92) 0%,rgba(10,13,20,.5) 100%)"}}/>
  <div style={{position:"relative",zIndex:2,padding:"0 24px",height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",paddingBottom:28}}>
    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,color:"#8dc63f",letterSpacing:2,marginBottom:8,textTransform:"uppercase" as const}}>👥 Mis referidos</div>
    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:28,fontWeight:700,color:"#fff",lineHeight:1.05,textTransform:"uppercase" as const}}>INVITA Y<br/>GANA</div>
    <div style={{fontSize:11,color:"rgba(255,255,255,.6)",marginTop:8}}>Gana el {config.comision_referido}% de comisión por cada referido activo</div>
  </div>
</div>

                <div className="stats" style={{marginBottom:14}}>
                  <div className="stat-c"><div className="stat-ico ico-g"><Users size={15}/></div><div><div className="stat-v">{referidos.length}</div><div className="stat-l">Referidos</div></div></div>
                  <div className="stat-c"><div className="stat-ico ico-p"><Gift size={15}/></div><div><div className="stat-v">{totalComisionRef.toLocaleString()}</div><div className="stat-l">Créditos</div></div></div>
                  <div className="stat-c"><div className="stat-ico ico-a"><TrendingUp size={15}/></div><div><div className="stat-v">{config.comision_referido}%</div><div className="stat-l">Comisión</div></div></div>
                  <div className="stat-c"><div className="stat-ico ico-b"><CheckCircle size={15}/></div><div><div className="stat-v">{gananciasRef.filter(g=>g.estado==="ACREDITADO").length}</div><div className="stat-l">Acreditados</div></div></div>
                </div>

                <div className="panel" style={{background:"#111827", border:"1px solid #374151"}}>
                  <div className="panel-title" style={{color:"#fff", fontSize:11}}><Gift size={13} style={{color:"#8dc63f"}}/> MI CÓDIGO DE REFERIDO</div>
                  <div className="ref-code-box" style={{background:"#000", border:"1px solid #374151", padding:"20px"}}>
                    <div>
                      <div style={{fontSize:9,color:"#9ca3af",textTransform:"uppercase",marginBottom:5}}>Comparte este código o enlace</div>
                      <div style={{color:"#fff", fontSize:24, fontWeight:700, letterSpacing:2}}>{perfil.codigo_referido}</div>
                    </div>
                    <div style={{display:"flex",gap:10}}>
                      <button onClick={()=>{navigator.clipboard.writeText(perfil.codigo_referido);showToast("Copiado","ok");}} style={{background:"#8dc63f",color:"#000",border:"none",fontWeight:700,padding:"8px 16px",cursor:"pointer",fontSize:11}}>COPIAR CÓDIGO</button>
                      <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/register?ref=${perfil.codigo_referido}`);showToast("Enlace copiado","ok");}} style={{background:"transparent",border:"1px solid #8dc63f",color:"#8dc63f",fontWeight:700,padding:"8px 16px",cursor:"pointer",fontSize:11}}>COMPARTIR ENLACE</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>{/* fin .bd */}
        </div>{/* fin .mn */}
      </div>{/* fin .rd */}

      {/* TICKET FLOTANTE */}
      {cuotaSel&&(
        <div className="tk">
          <div className="tk-title">Ticket de predicción</div>
          <div className="tk-item">
            <div className="tk-p">{PARTIDOS_CUOTAS.find(p=>p.id===cuotaSel.id)?.local} vs {PARTIDOS_CUOTAS.find(p=>p.id===cuotaSel.id)?.visitante}</div>
            <div className="tk-row"><div className="tk-eq">{cuotaSel.eq}</div><div className="tk-c">{cuotaSel.cuota}</div></div>
          </div>
          <div className="tk-note">⚡ Motor en desarrollo — próximamente conectado</div>
          <div className="tk-btns">
            <button onClick={()=>setCuotaSel(null)} style={{flex:1,padding:"7px",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",borderRadius:3,color:"rgba(255,255,255,.4)",fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
            <button onClick={()=>router.push("/torneos")} style={{flex:2,padding:"7px",background:"#8dc63f",border:"none",borderRadius:3,color:"#0a0d14",fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,cursor:"pointer"}}>Ir a predecir →</button>
          </div>
        </div>
      )}

      {/* BOTTOM NAV MOBILE */}
      <nav className="bn">
        <div className="bn-wrap">
          {NAV.map(n=>(
            <button key={n.id} className={`bn-btn ${tab===n.id?"on":""}`} onClick={()=>setTab(n.id as Tab)}>
              {n.icon}<span>{n.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </nav>

      {eventoSeleccionado&&(
        <JoinEventModal
          evento={eventoSeleccionado}
          saldoActual={perfil?.creditos??saldoPx}
          onSuccess={res=>{setSaldoPx(res.saldo_nuevo);setEventoSeleccionado(null);}}
          onClose={()=>setEventoSeleccionado(null)}
        />
      )}
    </>
  );
}
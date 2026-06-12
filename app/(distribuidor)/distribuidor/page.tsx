"use client";
// ══════════════════════════════════════════════════════════════
//  PANEL DISTRIBUIDOR v5.0 — Estilo Codere/KickLast
//  UBICACIÓN: app/(distribuidor)/distribuidor/page.tsx
//  Sistema: #8dc63f verde, #0a0d14 fondo, #111827 cards
//  Fuentes: Oswald (títulos) + Roboto (texto)
//  v5.0:
//    - Sidebar + topbar estilo promotor
//    - Tasa de cambio aplicada en toda la UI
//    - Secciones futuras marcadas (QR, Meta diaria, Notificaciones)
//    - Input manual de monto + montos rápidos
//    - Historial de PINs vendidos separado
//    - Diseño unificado con el resto del sistema
// ══════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  CreditCard, Search, CheckCircle, X,
  BarChart2, Shield, RefreshCw, LogOut,
  Loader2, Clock, TrendingUp, AlertTriangle,
  DollarSign, FileText, Activity, ArrowUpRight,
  Trophy, Key, Wallet, Menu, Bell,
  Users, Target, QrCode, ChevronRight,
  Globe, ArrowRightLeft
} from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────
interface PerfilDistribuidor {
  id: string; nombre: string; email: string;
  pais: string; pais_codigo: string; activo: boolean;
  comision_porcentaje: number; comision_recarga_pct?: number;
  comision_premio_pct?: number; comision_pago_premio_pct?: number;
  promotor_id: string; created_at: string; balance_px: number;
  codigo_distribuidor?: string;
  permite_venta_pines?: boolean;
  permite_recarga_saldo_px?: boolean;
  permite_recarga_directa?: boolean;
}
interface Jugador {
  id: string; username: string | null; email: string;
  pitchx_balance: number; lives: number; status: string;
  numero_documento?: string; tipo_documento?: string;
  nombre_completo?: string;
}
interface CodigoGanancia {
  id: string; jugador_id: string; codigo: string;
  monto_px: number; moneda: string; monto_local: number;
  tasa_cambio: number; pais_codigo: string; estado: string;
  expira_en: string; retiro_id?: string;
  jugador?: { username:string; email:string; nombre_completo?:string; numero_documento?:string; };
  retiro?: { metodo_pago:string; numero_cuenta:string; banco?:string; tipo_cuenta?:string; nombre_beneficiario:string; };
}
interface Recarga {
  id: string; jugador_id: string; monto_px: number;
  comision_porcentaje: number; comision_px: number;
  estado: string; notas?: string; created_at: string;
  jugador_email?: string; jugador_username?: string;
}
interface TasaCambio {
  pais_codigo: string; moneda: string; simbolo: string; tasa_usd: number;
}

type Tab = "dashboard" | "recargar" | "pines" | "premios" | "historial" | "comisiones" | "cuenta";
type FiltroTipo = "TODOS" | "RECARGA" | "PREMIO" | "PIN";

const fmt      = (n: number) => Number(n ?? 0).toLocaleString("es-CO");
const fmtFecha = (f: string) => new Date(f).toLocaleDateString("es-CO", { day:"2-digit", month:"short", year:"numeric" });
const fmtHora  = (f: string) => new Date(f).toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" });

const PAIS_FLAG: Record<string,string> = { CO:"🇨🇴", EC:"🇪🇨", MX:"🇲🇽", BR:"🇧🇷", AR:"🇦🇷", PE:"🇵🇪", VE:"🇻🇪", CL:"🇨🇱" };

const TABS: { id:Tab; label:string; icon:string; futuro?:boolean }[] = [
  { id:"dashboard",  label:"Dashboard",    icon:"📊" },
  { id:"recargar",   label:"Recargar PX",  icon:"💳" },
  { id:"premios",    label:"Pagar Premio", icon:"🏆" },
  { id:"pines",      label:"Vender PIN",   icon:"🔑" },
  { id:"historial",  label:"Historial",    icon:"📋" },
  { id:"comisiones", label:"Comisiones",   icon:"💰" },
  { id:"cuenta",     label:"Mi Cuenta",    icon:"🔐" },
];

export default function DistribuidorPage() {
  const router = useRouter();
  const [tab,          setTab]         = useState<Tab>("dashboard");
  const [sideOpen,     setSideOpen]    = useState(false);
  const [distribuidor, setDistribuidor]= useState<PerfilDistribuidor|null>(null);
  const [recargas,     setRecargas]    = useState<Recarga[]>([]);
  const [pins,         setPins]        = useState<any[]>([]);
  const [tasaCambio,   setTasaCambio]  = useState<TasaCambio|null>(null);
  const [loading,      setLoading]     = useState(true);
  const [toast,        setToast]       = useState<{msg:string;type:"ok"|"err"|"warn"}|null>(null);

  // stats
  const [statsHoy,      setStatsHoy]      = useState(0);
  const [statsSemana,   setStatsSemana]   = useState(0);
  const [statsVentas,   setStatsVentas]   = useState(0);
  const [statsComRec,   setStatsComRec]   = useState(0);
  const [statsComPrem,  setStatsComPrem]  = useState(0);
  const [statsComPin,   setStatsComPin]   = useState(0);
  const [statsComTotal, setStatsComTotal] = useState(0);

  // recargar
  const [busqueda,        setBusqueda]        = useState("");
  const [buscando,        setBuscando]        = useState(false);
  const [jugadorFound,    setJugadorFound]    = useState<Jugador|null>(null);
  const [jugadorError,    setJugadorError]    = useState("");
  const [montoRecarga,    setMontoRecarga]    = useState("");
  const [recargando,      setRecargando]      = useState(false);
  const [recargaExitosa,  setRecargaExitosa]  = useState(false);
  const [showConfirmRec,  setShowConfirmRec]  = useState(false);

  // premios
  const [busquedaPremio,    setBusquedaPremio]    = useState("");
  const [buscandoPremio,    setBuscandoPremio]    = useState(false);
  const [jugadorPremio,     setJugadorPremio]     = useState<Jugador|null>(null);
  const [jugadorPremioErr,  setJugadorPremioErr]  = useState("");
  const [retiroPendiente,   setRetiroPendiente]   = useState<any>(null);
  const [pagandoPremio,     setPagandoPremio]     = useState(false);
  const [pagoExitoso,       setPagoExitoso]       = useState(false);
  const [showConfirmPremio, setShowConfirmPremio] = useState(false);

  // código ganancia
  const [busquedaCodigo,    setBusquedaCodigo]    = useState("");
  const [buscandoCodigo,    setBuscandoCodigo]    = useState(false);
  const [codigoFound,       setCodigoFound]       = useState<CodigoGanancia|null>(null);
  const [codigoError,       setCodigoError]       = useState("");
  const [procesandoCodigo,  setProcesandoCodigo]  = useState(false);
  const [codigoPagado,      setCodigoPagado]      = useState(false);
  const [showConfirmCodigo, setShowConfirmCodigo] = useState(false);

  // pines
  const [busquedaPin,    setBusquedaPin]    = useState("");
  const [buscandoPin,    setBuscandoPin]    = useState(false);
  const [jugadorPin,     setJugadorPin]     = useState<Jugador|null>(null);
  const [jugadorPinErr,  setJugadorPinErr]  = useState("");
  const [pinSel,         setPinSel]         = useState<any|null>(null);
  const [vendiendo,      setVendiendo]      = useState(false);
  const [ventaExitosa,   setVentaExitosa]   = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // historial
  const [filtroTipo,  setFiltroTipo]  = useState<FiltroTipo>("TODOS");
  const [filtroFecha, setFiltroFecha] = useState("");

  const showToast = (msg:string, type:"ok"|"err"|"warn"="ok") => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3500);
  };

  const puedeRecargar  = distribuidor?.permite_recarga_saldo_px ?? true;
  const puedeVenderPin = distribuidor?.permite_venta_pines ?? false;
  const comRec  = distribuidor?.comision_recarga_pct  ?? distribuidor?.comision_porcentaje ?? 10;
  const comPrem = distribuidor?.comision_pago_premio_pct ?? distribuidor?.comision_premio_pct ?? 5;
  const simbolo = tasaCambio?.simbolo ?? "$";
  const moneda  = tasaCambio?.moneda  ?? "USD";
  const tasa    = tasaCambio?.tasa_usd ?? 1;

  // Conversión PX → moneda local
  const pxToLocal = (px: number) => px * tasa;
  const fmtLocal  = (px: number) => `${simbolo}${fmt(Math.round(pxToLocal(px)))} ${moneda}`;

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data:profile } = await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
      if (!["distribuidor","admin","super_admin"].includes(profile?.role??"")) { router.push("/radar"); return; }

      const { data:dist } = await supabase.from("distribuidores").select("*").eq("user_id",user.id).maybeSingle();
      if (!dist) { showToast("Perfil no encontrado","err"); setLoading(false); return; }
      setDistribuidor({ ...dist, balance_px:Number(dist.balance_px)||0, pais_codigo:dist.pais_codigo??"CO" });

      const { data:tasa } = await supabase.from("tasas_cambio").select("*").eq("pais_codigo",dist.pais_codigo??"CO").maybeSingle();
      setTasaCambio(tasa??null);

      const { data:recs } = await supabase.from("recargas_distribuidor").select("*")
        .eq("distribuidor_id",dist.id).neq("estado","FONDEO")
        .order("created_at",{ascending:false}).limit(200);
      const listaR = recs??[];
      const recEnriq = await Promise.all(listaR.map(async (r:Recarga) => {
        const { data:j } = await supabase.from("profiles").select("email,username").eq("id",r.jugador_id).maybeSingle();
        return { ...r, jugador_email:j?.email??"—", jugador_username:j?.username??"—" };
      }));
      setRecargas(recEnriq);

      const { data:asig } = await supabase.from("asignaciones_pin").select("lote_id").eq("distribuidor_id",dist.id).eq("estado","ASIGNADO");
      const lotes = [...new Set((asig??[]).map((a:any)=>String(a.lote_id)))];
      let listaPins:any[] = [];
      if (lotes.length>0) {
        const { data:pinsData } = await supabase.from("codigos_pin").select("*")
          .in("lote_id",lotes).eq("estado","DISPONIBLE").order("created_at",{ascending:true}).limit(200);
        listaPins = (pinsData??[]).filter((p:any)=>!p.pais_codigo||p.pais_codigo===(dist.pais_codigo??"CO"));
      }
      setPins(listaPins);

      // Stats
      const hoy    = new Date().toISOString().split("T")[0];
      const semana = new Date(Date.now()-7*24*60*60*1000).toISOString();
      const recHoy = listaR.filter((r:Recarga)=>r.created_at.startsWith(hoy));
      const recSem = listaR.filter((r:Recarga)=>r.created_at>=semana);
      const comRecarga = listaR.filter((r:Recarga)=>r.notas!=="PAGO_PREMIO"&&!r.notas?.startsWith("PIN:")).reduce((a:number,r:Recarga)=>a+r.comision_px,0);
      const comPremio  = listaR.filter((r:Recarga)=>r.notas==="PAGO_PREMIO").reduce((a:number,r:Recarga)=>a+r.comision_px,0);
      const comPin     = listaR.filter((r:Recarga)=>r.notas?.startsWith("PIN:")).reduce((a:number,r:Recarga)=>a+r.comision_px,0);
      setStatsHoy(recHoy.length); setStatsSemana(recSem.length);
      setStatsVentas(listaR.reduce((a:number,r:Recarga)=>a+r.monto_px,0));
      setStatsComRec(comRecarga); setStatsComPrem(comPremio); setStatsComPin(comPin);
      setStatsComTotal(comRecarga+comPremio+comPin);
    } catch(err) { console.error(err); showToast("Error al cargar datos","err"); }
    finally { setLoading(false); }
  },[router]);

  useEffect(()=>{ cargar(); },[cargar]);

  // ── BUSCAR JUGADOR ─────────────────────────────────────────
  const buscarJugador = async (query: string, setter: (j:Jugador|null)=>void, errSetter: (e:string)=>void) => {
    if (!query.trim()) { errSetter("Ingresa documento, email o username"); return; }
    try {
      const q = query.trim().toLowerCase();
      const { data:perfiles } = await supabase.from("profiles")
        .select("id,username,email,pitchx_balance,lives,status,full_name,numero_documento,tipo_documento")
        .or(`email.ilike.%${q}%,username.ilike.%${q}%,numero_documento.ilike.%${q}%`).limit(1);
      if (perfiles && perfiles.length>0) {
        const p = perfiles[0];
        setter({ id:p.id, username:p.username, email:p.email, pitchx_balance:p.pitchx_balance??0, lives:p.lives??0, status:p.status??"active", numero_documento:p.numero_documento??"Sin documento", tipo_documento:p.tipo_documento??"—", nombre_completo:p.full_name??p.username??"—" });
        errSetter("");
      } else { errSetter("Jugador no encontrado."); }
    } catch { errSetter("Error al buscar. Intenta nuevamente."); }
  };

  // ── REALIZAR RECARGA ───────────────────────────────────────
  const realizarRecarga = async () => {
    if (!jugadorFound||!distribuidor) return;
    const monto = parseInt(montoRecarga);
    if (!monto||monto<=0) { showToast("Monto inválido","warn"); return; }
    setShowConfirmRec(false); setRecargando(true);
    try {
      if (monto>(distribuidor.balance_px??0)) throw new Error(`Saldo insuficiente. Disponible: ${fmt(distribuidor.balance_px)} PX`);
      const comisionPx = Math.round(monto*(comRec/100));
      const { data:perfJ } = await supabase.from("profiles").select("pitchx_balance").eq("id",jugadorFound.id).maybeSingle();
      await supabase.from("profiles").update({ pitchx_balance:(perfJ?.pitchx_balance??0)+monto }).eq("id",jugadorFound.id);
      await supabase.from("distribuidores").update({ balance_px:(distribuidor.balance_px??0)-monto }).eq("id",distribuidor.id);
      await supabase.from("recargas_distribuidor").insert({ distribuidor_id:distribuidor.id, jugador_id:jugadorFound.id, monto_px:monto, comision_porcentaje:comRec, comision_px:comisionPx, estado:"COMPLETADA" });
      setRecargaExitosa(true);
      setJugadorFound(prev=>prev?{...prev,pitchx_balance:prev.pitchx_balance+monto}:null);
      setMontoRecarga("");
      showToast(`Recarga exitosa — ${monto} PX acreditados`,"ok");
      await cargar();
    } catch(err:any) { showToast(err.message??"Error al recargar","err"); }
    finally { setRecargando(false); }
  };

  // ── BUSCAR RETIRO PENDIENTE ────────────────────────────────
  const buscarRetiro = async (jugadorId: string) => {
    const { data:retiro } = await supabase.from("withdrawal_requests").select("*")
      .eq("user_id",jugadorId).eq("estado","APROBADO").eq("metodo_retiro","PUNTO_FISICO")
      .order("created_at",{ascending:false}).limit(1).maybeSingle();
    setRetiroPendiente(retiro??null);
  };

  const buscarJugadorPremio = async () => {
    setBuscandoPremio(true); setJugadorPremio(null); setJugadorPremioErr(""); setRetiroPendiente(null); setPagoExitoso(false);
    await buscarJugador(busquedaPremio, async (j)=>{
      setJugadorPremio(j);
      if (j) await buscarRetiro(j.id);
    }, setJugadorPremioErr);
    setBuscandoPremio(false);
  };

  // ── PAGAR PREMIO ───────────────────────────────────────────
  const pagarPremio = async () => {
    if (!jugadorPremio||!distribuidor||!retiroPendiente) return;
    setShowConfirmPremio(false); setPagandoPremio(true);
    try {
      const monto      = Number(retiroPendiente.monto_neto??0);
      const comisionPx = Math.round(monto*(comPrem/100));
      await supabase.from("withdrawal_requests").update({ estado:"PAGADO", pagado_en:new Date().toISOString(), notas_admin:`Pagado por: ${distribuidor.nombre}` }).eq("id",retiroPendiente.id);
      const { data:perfJ } = await supabase.from("profiles").select("pitchx_balance").eq("id",jugadorPremio.id).maybeSingle();
      await supabase.from("profiles").update({ pitchx_balance:Math.max(0,(perfJ?.pitchx_balance??0)-Math.round(monto)) }).eq("id",jugadorPremio.id);
      await supabase.from("recargas_distribuidor").insert({ distribuidor_id:distribuidor.id, jugador_id:jugadorPremio.id, monto_px:Math.round(monto), comision_porcentaje:comPrem, comision_px:comisionPx, estado:"COMPLETADA", notas:"PAGO_PREMIO" });
      await supabase.from("pagos_premio").insert({ distribuidor_id:distribuidor.id, promotor_id:distribuidor.promotor_id, jugador_id:jugadorPremio.id, monto_px:Math.round(monto), comision_px:comisionPx, comision_pct:comPrem, metodo_pago:retiroPendiente.metodo_pago??"EFECTIVO", estado:"REGISTRADO", notas:`Cuenta: ${retiroPendiente.numero_cuenta??"—"}` }).then(()=>{});
      const { data:comEx } = await supabase.from("comisiones_distribuidor").select("*").eq("distribuidor_id",distribuidor.id).maybeSingle();
      if (comEx) await supabase.from("comisiones_distribuidor").update({ total_acumulado:Number(comEx.total_acumulado)+comisionPx, pendiente:Number(comEx.pendiente)+comisionPx, updated_at:new Date().toISOString() }).eq("distribuidor_id",distribuidor.id);
      else await supabase.from("comisiones_distribuidor").insert({ distribuidor_id:distribuidor.id, total_acumulado:comisionPx, total_pagado:0, pendiente:comisionPx, periodo:"MENSUAL" });
      setPagoExitoso(true); setRetiroPendiente(null);
      showToast(`Premio pagado. Tu comisión: ${comisionPx} PX`,"ok");
      await cargar();
    } catch(err:any) { showToast(err.message??"Error al pagar","err"); }
    finally { setPagandoPremio(false); }
  };

  // ── CÓDIGO GANANCIA ────────────────────────────────────────
  const buscarCodigo = async () => {
    if (!busquedaCodigo.trim()||!distribuidor) { setCodigoError("Ingresa el código"); return; }
    setBuscandoCodigo(true); setCodigoFound(null); setCodigoError(""); setCodigoPagado(false);
    try {
      const codigo = busquedaCodigo.trim().toUpperCase();
      const { data:cg } = await supabase.from("codigos_ganancia").select("*").eq("codigo",codigo).eq("estado","ACTIVO").maybeSingle();
      if (!cg) { setCodigoError("Código no encontrado, ya fue usado o está vencido."); return; }
      if (cg.pais_codigo!==(distribuidor.pais_codigo??"CO")) { setCodigoError(`Este código es para ${cg.pais_codigo}, no para ${distribuidor.pais_codigo??"CO"}.`); return; }
      if (new Date(cg.expira_en)<new Date()) { await supabase.from("codigos_ganancia").update({estado:"EXPIRADO"}).eq("id",cg.id); setCodigoError("Este código ha vencido."); return; }
      const { data:jugador } = await supabase.from("profiles").select("username,email,full_name,numero_documento").eq("id",cg.jugador_id).maybeSingle();
      let retiro = null;
      if (cg.retiro_id) { const { data:ret } = await supabase.from("withdrawal_requests").select("metodo_pago,numero_cuenta,banco,tipo_cuenta,nombre_beneficiario").eq("id",cg.retiro_id).maybeSingle(); retiro=ret; }
      setCodigoFound({ ...cg, jugador:jugador?{username:jugador.username??"—",email:jugador.email??"—",nombre_completo:jugador.full_name??jugador.username??"—",numero_documento:jugador.numero_documento??"Sin documento"}:undefined, retiro:retiro??undefined });
    } catch { setCodigoError("Error al buscar."); }
    finally { setBuscandoCodigo(false); }
  };

  const procesarCodigo = async () => {
    if (!codigoFound||!distribuidor) return;
    setShowConfirmCodigo(false); setProcesandoCodigo(true);
    try {
      const { error:cgErr } = await supabase.from("codigos_ganancia").update({ estado:"USADO", distribuidor_id:distribuidor.id, usado_en:new Date().toISOString() }).eq("id",codigoFound.id).eq("estado","ACTIVO");
      if (cgErr) throw cgErr;
      if (codigoFound.retiro_id) await supabase.from("withdrawal_requests").update({ estado:"PAGADO", pagado_en:new Date().toISOString(), notas_admin:`Código ${codigoFound.codigo} por ${distribuidor.nombre}` }).eq("id",codigoFound.retiro_id);
      const comisionPx = Math.round(codigoFound.monto_px*(comPrem/100));
      await supabase.from("recargas_distribuidor").insert({ distribuidor_id:distribuidor.id, jugador_id:codigoFound.jugador_id, monto_px:Math.round(codigoFound.monto_px), comision_porcentaje:comPrem, comision_px:comisionPx, estado:"COMPLETADA", notas:"PAGO_PREMIO" });
      await supabase.from("pagos_premio").insert({ distribuidor_id:distribuidor.id, promotor_id:distribuidor.promotor_id, jugador_id:codigoFound.jugador_id, monto_px:Math.round(codigoFound.monto_px), comision_px:comisionPx, comision_pct:comPrem, metodo_pago:codigoFound.retiro?.metodo_pago??"EFECTIVO", estado:"REGISTRADO", notas:`Código: ${codigoFound.codigo}` }).then(()=>{});
      const { data:comEx } = await supabase.from("comisiones_distribuidor").select("*").eq("distribuidor_id",distribuidor.id).maybeSingle();
      if (comEx) await supabase.from("comisiones_distribuidor").update({ total_acumulado:Number(comEx.total_acumulado)+comisionPx, pendiente:Number(comEx.pendiente)+comisionPx, updated_at:new Date().toISOString() }).eq("distribuidor_id",distribuidor.id);
      else await supabase.from("comisiones_distribuidor").insert({ distribuidor_id:distribuidor.id, total_acumulado:comisionPx, total_pagado:0, pendiente:comisionPx, periodo:"MENSUAL" });
      setCodigoPagado(true);
      showToast(`Premio pagado. Comisión: ${comisionPx} PX`,"ok");
      await cargar();
    } catch(err:any) { showToast(err.message??"Error al procesar","err"); }
    finally { setProcesandoCodigo(false); }
  };

  // ── VENDER PIN ─────────────────────────────────────────────
  const venderPin = async () => {
    if (!jugadorPin||!distribuidor||!pinSel) return;
    setShowConfirmPin(false); setVendiendo(true);
    try {
      await supabase.from("codigos_pin").update({ estado:"USADO", usado_por_id:jugadorPin.id, usado_en:new Date().toISOString() }).eq("id",pinSel.id);
      const { data:perfJ } = await supabase.from("profiles").select("pitchx_balance,lives").eq("id",jugadorPin.id).maybeSingle();
      await supabase.from("profiles").update({ pitchx_balance:(perfJ?.pitchx_balance??0)+pinSel.creditos, lives:(perfJ?.lives??0)+pinSel.vidas }).eq("id",jugadorPin.id);
      const comisionPx = Math.round(pinSel.creditos*(comRec/100));
      await supabase.from("recargas_distribuidor").insert({ distribuidor_id:distribuidor.id, jugador_id:jugadorPin.id, monto_px:pinSel.creditos, comision_porcentaje:comRec, comision_px:comisionPx, estado:"COMPLETADA", notas:`PIN:${pinSel.codigo}` });
      setVentaExitosa(true); setPinSel(null);
      showToast(`PIN entregado — ${pinSel.vidas} vidas + ${pinSel.creditos} PX`,"ok");
      await cargar();
    } catch(err:any) { showToast(err.message??"Error al vender PIN","err"); }
    finally { setVendiendo(false); }
  };

  const tipoLabel = (r:Recarga) => r.notas==="PAGO_PREMIO"?"PREMIO":r.notas?.startsWith("PIN:")?"PIN":"RECARGA";
  const tipoBadge = (r:Recarga) => r.notas==="PAGO_PREMIO"?"b-purple":r.notas?.startsWith("PIN:")?"b-info":"b-on";

  const recargasFiltradas = recargas.filter(r => {
    if (filtroTipo==="RECARGA"&&(r.notas==="PAGO_PREMIO"||r.notas?.startsWith("PIN:"))) return false;
    if (filtroTipo==="PREMIO"&&r.notas!=="PAGO_PREMIO") return false;
    if (filtroTipo==="PIN"&&!r.notas?.startsWith("PIN:")) return false;
    if (filtroFecha&&!r.created_at.startsWith(filtroFecha)) return false;
    return true;
  });

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login?message=signed-out"); };

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#0a0d14",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{width:40,height:40,border:"3px solid rgba(141,198,63,.2)",borderTop:"3px solid #8dc63f",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <span style={{fontFamily:"'Oswald',sans-serif",fontSize:13,color:"rgba(255,255,255,.3)",letterSpacing:2}}>CARGANDO PANEL</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0a0d14;color:#fff;font-family:'Roboto',sans-serif;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

        /* ── LAYOUT ── */
        .pw{min-height:100vh;background:#0a0d14;display:flex;}
        .sb{width:220px;background:#0b0e1a;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:50;transition:transform .3s;}
        @media(max-width:900px){.sb{transform:translateX(-100%);}.sb.open{transform:translateX(0);}}
        .sb-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:49;}
        @media(max-width:900px){.sb-ov.open{display:block;}}
        .mn{flex:1;margin-left:220px;display:flex;flex-direction:column;min-height:100vh;}
        @media(max-width:900px){.mn{margin-left:0;}}

        /* ── SIDEBAR ── */
        .sb-logo{padding:20px 18px 14px;border-bottom:1px solid rgba(255,255,255,.05);}
        .sb-logo img{height:26px;width:auto;object-fit:contain;}
        .sb-logo-txt{font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;color:#8dc63f;letter-spacing:2px;}
        .sb-badge{font-size:9px;font-weight:700;letter-spacing:1.5px;color:rgba(141,198,63,.5);text-transform:uppercase;margin-top:2px;}
        .sb-user{padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:10px;}
        .sb-av{width:34px;height:34px;border-radius:50%;background:rgba(141,198,63,.1);border:1px solid rgba(141,198,63,.25);display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;color:#8dc63f;flex-shrink:0;}
        .sb-uname{font-size:12px;font-weight:500;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;}
        .sb-upais{font-size:10px;color:rgba(255,255,255,.25);margin-top:1px;}
        .sb-saldo{padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.05);}
        .sb-saldo-lbl{font-size:9px;color:rgba(255,255,255,.25);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;}
        .sb-saldo-val{font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;color:#8dc63f;}
        .sb-saldo-local{font-size:10px;color:rgba(255,255,255,.2);margin-top:2px;}
        .sb-permisos{padding:10px 18px;border-bottom:1px solid rgba(255,255,255,.05);display:flex;gap:4px;flex-wrap:wrap;}
        .perm-chip{font-size:8px;font-weight:700;letter-spacing:.5px;padding:2px 6px;border-radius:3px;font-family:'Oswald',sans-serif;}
        .perm-on{background:rgba(141,198,63,.1);color:#8dc63f;border:1px solid rgba(141,198,63,.2);}
        .perm-off{background:rgba(255,255,255,.04);color:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.06);}
        .sb-nav{flex:1;padding:10px 0;overflow-y:auto;}
        .sb-grp{font-size:9px;color:rgba(255,255,255,.15);letter-spacing:2px;text-transform:uppercase;padding:10px 18px 4px;}
        .sb-item{display:flex;align-items:center;gap:9px;width:100%;padding:10px 18px;background:transparent;border:none;border-left:2px solid transparent;color:rgba(255,255,255,.3);font-family:'Roboto',sans-serif;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;text-align:left;}
        .sb-item:hover{color:rgba(255,255,255,.7);background:rgba(255,255,255,.02);}
        .sb-item.on{color:#8dc63f;background:rgba(141,198,63,.06);border-left-color:#8dc63f;}
        .sb-item-ico{font-size:14px;width:18px;text-align:center;flex-shrink:0;}
        .sb-item-future{opacity:.4;cursor:default!important;}
        .sb-future-tag{margin-left:auto;font-size:7px;font-family:'Oswald',sans-serif;font-weight:700;letter-spacing:.5px;color:rgba(245,158,11,.6);background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.15);border-radius:3px;padding:1px 5px;}
        .sb-foot{padding:14px 18px;border-top:1px solid rgba(255,255,255,.05);}
        .sb-out{display:flex;align-items:center;gap:8px;width:100%;padding:8px 0;background:transparent;border:none;color:rgba(239,68,68,.4);font-size:11px;font-family:'Roboto',sans-serif;cursor:pointer;transition:color .15s;}
        .sb-out:hover{color:#ef4444;}

        /* ── TOPBAR ── */
        .tb{padding:0 24px;height:52px;background:#0b0e1a;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40;}
        .tb-ham{display:none;background:transparent;border:none;color:rgba(255,255,255,.4);cursor:pointer;padding:4px;margin-right:10px;}
        @media(max-width:900px){.tb-ham{display:flex;}}
        .tb-left{display:flex;align-items:center;}
        .tb-title{font-family:'Oswald',sans-serif;font-size:12px;font-weight:600;color:rgba(255,255,255,.35);letter-spacing:2px;text-transform:uppercase;}
        .tb-right{display:flex;align-items:center;gap:10px;}
        .tb-pais{display:flex;align-items:center;gap:5px;font-size:10px;color:rgba(255,255,255,.3);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:5px;padding:4px 9px;}
        .tb-live{display:flex;align-items:center;gap:5px;font-size:10px;color:#8dc63f;font-weight:600;letter-spacing:1px;}
        .tb-dot{width:5px;height:5px;border-radius:50%;background:#8dc63f;animation:pulse 2s infinite;}

        /* ── BODY ── */
        .bd{flex:1;padding:20px 24px;}
        @media(max-width:600px){.bd{padding:14px;}}

        /* ── SALDO CARD ── */
        .saldo-card{background:linear-gradient(135deg,rgba(141,198,63,.08),rgba(141,198,63,.02));border:1px solid rgba(141,198,63,.18);border-radius:10px;padding:18px 20px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
        .saldo-val{font-family:'Oswald',sans-serif;font-size:32px;font-weight:700;color:#8dc63f;line-height:1;}
        .saldo-lbl{font-size:9px;color:rgba(141,198,63,.5);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;}
        .saldo-local{font-size:12px;color:rgba(255,255,255,.3);margin-top:4px;}

        /* ── STAT CARDS ── */
        .stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px;}
        @media(min-width:640px){.stats-grid{grid-template-columns:repeat(3,1fr);}}
        @media(min-width:900px){.stats-grid{grid-template-columns:repeat(6,1fr);}}
        .stat-card{background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:12px 14px;}
        .stat-lbl{font-size:9px;color:rgba(255,255,255,.25);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px;}
        .stat-val{font-family:'Oswald',sans-serif;font-size:19px;font-weight:700;color:#fff;line-height:1;}
        .stat-sub{font-size:9px;color:rgba(255,255,255,.18);margin-top:3px;}

        /* ── SECCIÓN ── */
        .sec{background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:10px;overflow:hidden;margin-bottom:14px;animation:fadeIn .2s ease;}
        .sec-h{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
        .sec-t{font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;color:rgba(255,255,255,.5);letter-spacing:1.5px;text-transform:uppercase;display:flex;align-items:center;gap:7px;}
        .sec-t::before{content:'';width:3px;height:12px;background:#8dc63f;border-radius:2px;flex-shrink:0;}
        .sec-b{padding:16px;}

        /* ── TABLAS ── */
        .tbl-wrap{overflow-x:auto;}
        .tbl{width:100%;border-collapse:collapse;}
        .tbl th{font-family:'Oswald',sans-serif;font-size:9px;font-weight:600;color:rgba(255,255,255,.2);letter-spacing:1.5px;text-transform:uppercase;padding:10px 14px;text-align:left;border-bottom:1px solid rgba(255,255,255,.04);}
        .tbl td{padding:10px 14px;font-size:12px;color:rgba(255,255,255,.6);border-bottom:1px solid rgba(255,255,255,.03);vertical-align:middle;}
        .tbl tr:last-child td{border-bottom:none;}
        .tbl tr:hover td{background:rgba(255,255,255,.015);}

        /* ── BADGES ── */
        .badge{display:inline-flex;align-items:center;padding:2px 7px;border-radius:3px;font-family:'Oswald',sans-serif;font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;}
        .b-on{background:rgba(141,198,63,.1);color:#8dc63f;border:1px solid rgba(141,198,63,.2);}
        .b-off{background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.2);}
        .b-info{background:rgba(56,189,248,.1);color:#38bdf8;border:1px solid rgba(56,189,248,.2);}
        .b-purple{background:rgba(168,85,247,.1);color:#a855f7;border:1px solid rgba(168,85,247,.2);}
        .b-warn{background:rgba(245,158,11,.1);color:#f59e0b;border:1px solid rgba(245,158,11,.2);}

        /* ── BOTONES ── */
        .btn{padding:7px 12px;border:none;border-radius:6px;cursor:pointer;font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;transition:all .15s;display:inline-flex;align-items:center;gap:5px;}
        .btn:disabled{opacity:.4;cursor:not-allowed;}
        .btn-v{background:#8dc63f;color:#0a0d14;}.btn-v:hover:not(:disabled){background:#7ab52f;}
        .btn-g{background:rgba(255,255,255,.06);color:rgba(255,255,255,.45);border:1px solid rgba(255,255,255,.08);}.btn-g:hover{background:rgba(255,255,255,.1);color:#fff;}
        .btn-p{background:#a855f7;color:#fff;}.btn-p:hover:not(:disabled){background:#9333ea;}
        .btn-danger{background:rgba(239,68,68,.08);color:#ef4444;border:1px solid rgba(239,68,68,.15);}.btn-danger:hover{background:#ef4444;color:#fff;}

        /* ── SEARCH ── */
        .search-wrap{display:flex;gap:7px;margin-bottom:12px;}
        .search-inp{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:7px;padding:10px 13px;color:#fff;font-size:12px;font-family:'Roboto',sans-serif;outline:none;transition:border-color .15s;}
        .search-inp:focus{border-color:rgba(141,198,63,.3);}
        .search-inp::placeholder{color:rgba(255,255,255,.2);}
        .search-btn{padding:10px 16px;background:#8dc63f;color:#0a0d14;border:none;border-radius:7px;font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;transition:background .15s;white-space:nowrap;}
        .search-btn:hover{background:#7ab52f;}
        .search-btn:disabled{opacity:.5;cursor:not-allowed;}

        /* ── JUGADOR CARD ── */
        .jcard{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:14px 16px;margin-bottom:14px;}
        .jcard-name{font-family:'Oswald',sans-serif;font-size:15px;font-weight:700;color:#fff;margin-bottom:3px;}
        .jcard-email{font-size:10px;color:rgba(255,255,255,.3);}
        .jcard-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px;}
        .jcard-stat{text-align:center;background:rgba(255,255,255,.03);border-radius:6px;padding:9px 8px;}
        .jcard-stat-l{font-size:8px;color:rgba(255,255,255,.25);letter-spacing:1px;text-transform:uppercase;margin-bottom:3px;}
        .jcard-stat-v{font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;}

        /* ── MONTO ── */
        .monto-inp{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:7px;padding:12px 14px;color:#fff;font-size:22px;font-family:'Oswald',sans-serif;font-weight:700;outline:none;transition:border-color .15s;margin-bottom:10px;text-align:center;}
        .monto-inp:focus{border-color:rgba(141,198,63,.35);}
        .monto-inp::placeholder{color:rgba(255,255,255,.15);}
        .monto-quick{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px;}
        .monto-q{padding:6px 11px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:5px;color:rgba(255,255,255,.4);font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;cursor:pointer;transition:all .15s;}
        .monto-q:hover{background:rgba(141,198,63,.08);color:#8dc63f;border-color:rgba(141,198,63,.2);}
        .monto-q.sel{background:rgba(141,198,63,.12);color:#8dc63f;border-color:rgba(141,198,63,.3);}

        /* ── COMISION INFO ── */
        .com-info{padding:9px 12px;background:rgba(141,198,63,.04);border:1px solid rgba(141,198,63,.12);border-radius:6px;font-size:11px;color:rgba(255,255,255,.4);margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;}

        /* ── PREMIO CARD ── */
        .premio-card{background:rgba(168,85,247,.04);border:1px solid rgba(168,85,247,.15);border-radius:8px;padding:14px 16px;margin-bottom:12px;}
        .premio-monto{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
        .premio-box{background:rgba(255,255,255,.03);border-radius:6px;padding:10px 12px;}
        .premio-box-lbl{font-size:8px;color:rgba(255,255,255,.25);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;font-family:'Oswald',sans-serif;}
        .premio-box-val{font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;line-height:1;}
        .premio-box-sub{font-size:10px;color:rgba(255,255,255,.25);margin-top:2px;}
        .premio-metodo{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:12px;}
        .pm-box{background:rgba(255,255,255,.03);border-radius:6px;padding:8px 10px;}
        .pm-lbl{font-size:8px;color:rgba(255,255,255,.25);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;}
        .pm-val{font-size:11px;color:#fff;font-weight:500;}

        /* ── CÓDIGO GANANCIA ── */
        .codigo-card{background:rgba(168,85,247,.04);border:1px solid rgba(168,85,247,.18);border-radius:8px;padding:16px;}
        .codigo-display{font-family:monospace;font-size:17px;color:#a855f7;letterSpacing:2px;background:rgba(168,85,247,.1);border-radius:6px;padding:"10px";marginBottom:"14px";textAlign:"center";}

        /* ── PIN ITEM ── */
        .pin-item{display:flex;align-items:center;justify-content:space-between;padding:9px 11px;border:1px solid rgba(255,255,255,.06);border-radius:7px;margin-bottom:5px;cursor:pointer;transition:all .15s;flex-wrap:wrap;gap:7px;}
        .pin-item:hover{border-color:rgba(141,198,63,.25);background:rgba(141,198,63,.02);}
        .pin-item.sel{border-color:rgba(141,198,63,.4);background:rgba(141,198,63,.06);}
        .pin-codigo{font-family:monospace;font-size:11px;color:#8dc63f;background:rgba(141,198,63,.08);padding:3px 7px;border-radius:4px;letter-spacing:1px;}

        /* ── FILTROS ── */
        .filtro-bar{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;align-items:center;}
        .filtro-btn{padding:5px 11px;border:1px solid rgba(255,255,255,.07);border-radius:5px;background:transparent;color:rgba(255,255,255,.3);font-family:'Oswald',sans-serif;font-size:9px;font-weight:700;cursor:pointer;letter-spacing:.5px;transition:all .15s;}
        .filtro-btn.on{background:rgba(141,198,63,.08);border-color:rgba(141,198,63,.25);color:#8dc63f;}
        .fecha-inp{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:5px;padding:5px 9px;color:#fff;font-size:10px;outline:none;}
        .totales-bar{display:flex;gap:16px;flex-wrap:wrap;padding:10px 14px;background:rgba(255,255,255,.02);border-top:1px solid rgba(255,255,255,.04);}
        .total-item{font-size:10px;color:rgba(255,255,255,.35);}
        .total-val{font-family:'Oswald',sans-serif;font-weight:700;}

        /* ── CUENTA ROWS ── */
        .cr{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.04);}
        .cr:last-child{border-bottom:none;}
        .cl{font-size:10px;color:rgba(255,255,255,.25);}
        .cv{font-size:12px;color:#fff;font-weight:500;display:flex;align-items:center;gap:6px;}

        /* ── FUTURO SECTION ── */
        .futuro-sec{background:rgba(245,158,11,.03);border:1px solid rgba(245,158,11,.1);border-radius:8px;padding:16px;margin-bottom:12px;opacity:.6;}
        .futuro-tag{display:inline-flex;align-items:center;gap:5px;font-family:'Oswald',sans-serif;font-size:9px;font-weight:700;letter-spacing:1px;color:rgba(245,158,11,.7);background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.15);border-radius:3px;padding:2px 7px;margin-bottom:10px;}

        /* ── ALERTA ── */
        .alert-warn{display:flex;align-items:center;gap:8px;padding:9px 12px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.15);border-radius:7px;font-size:11px;color:rgba(245,158,11,.8);line-height:1.5;margin-bottom:12px;}
        .alert-err{display:flex;align-items:center;gap:8px;padding:9px 12px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.18);border-radius:7px;font-size:11px;color:#ef4444;margin-bottom:10px;}
        .alert-ok{display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(141,198,63,.08);border:1px solid rgba(141,198,63,.2);border-radius:7px;color:#8dc63f;font-family:'Oswald',sans-serif;fontSize:12;font-weight:700;margin-bottom:12px;}
        .alert-empty{text-align:center;padding:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:7px;font-size:11px;color:rgba(255,255,255,.25);}

        /* ── EMPTY ── */
        .empty{text-align:center;padding:40px 20px;}
        .empty-ico{font-size:28px;opacity:.3;margin-bottom:8px;}
        .empty-t{font-family:'Oswald',sans-serif;font-size:13px;color:rgba(255,255,255,.2);}
        .empty-s{font-size:10px;color:rgba(255,255,255,.12);margin-top:4px;}

        /* ── MODAL ── */
        .mo{position:fixed;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;}
        .md{width:100%;max-width:400px;background:#0f1420;border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden;}
        .mh{padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;}
        .mh-t{font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;color:#fff;display:flex;align-items:center;gap:8px;}
        .mh-c{background:none;border:none;color:rgba(255,255,255,.3);cursor:pointer;padding:4px;}.mh-c:hover{color:#fff;}
        .mb{padding:18px;}
        .mf{padding:0 18px 18px;display:flex;gap:8px;}
        .mo-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:12px;}
        .mo-row:last-child{border-bottom:none;}
        .mo-lbl{color:rgba(255,255,255,.3);}
        .mo-val{color:#fff;font-weight:600;font-family:'Oswald',sans-serif;}
        .mo-highlight{background:rgba(141,198,63,.06);border:1px solid rgba(141,198,63,.15);border-radius:8px;padding:"12px 14px";marginBottom:"14px";textAlign:"center";}

        /* ── TOAST ── */
        .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:7px;font-size:12px;font-weight:500;z-index:999;white-space:nowrap;animation:toastIn .2s ease;}
        .toast.ok{background:#8dc63f;color:#0a0d14;}
        .toast.err{background:#ef4444;color:#fff;}
        .toast.warn{background:#f59e0b;color:#0a0d14;}
      `}</style>

      <div className={`sb-ov ${sideOpen?"open":""}`} onClick={()=>setSideOpen(false)}/>

      <div className="pw">
        {/* ═══ SIDEBAR ═══ */}
        <aside className={`sb ${sideOpen?"open":""}`}>
          <div className="sb-logo">
            <img src="/img/logo12.png" alt="KickLast"
              onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}/>
            <div className="sb-logo-txt" style={{display:"none"}}>KICK LAST</div>
            <div className="sb-badge">Panel Distribuidor</div>
          </div>

          {distribuidor&&(
            <div className="sb-user">
              <div className="sb-av">{distribuidor.nombre.charAt(0).toUpperCase()}</div>
              <div style={{overflow:"hidden"}}>
                <div className="sb-uname">{distribuidor.nombre}</div>
                <div className="sb-upais">{PAIS_FLAG[distribuidor.pais_codigo]||"🌎"} {distribuidor.pais} · {moneda}</div>
              </div>
            </div>
          )}

          <div className="sb-saldo">
            <div className="sb-saldo-lbl">Saldo disponible</div>
            <div className="sb-saldo-val">{fmt(distribuidor?.balance_px??0)} PX</div>
            <div className="sb-saldo-local">{fmtLocal(distribuidor?.balance_px??0)}</div>
          </div>

          <div className="sb-permisos">
            <span className={`perm-chip ${puedeRecargar?"perm-on":"perm-off"}`}>PX {puedeRecargar?"✓":"✗"}</span>
            <span className={`perm-chip ${puedeVenderPin?"perm-on":"perm-off"}`}>PIN {puedeVenderPin?"✓":"✗"}</span>
            <span className={`perm-chip ${distribuidor?.permite_recarga_directa?"perm-on":"perm-off"}`}>DIR {distribuidor?.permite_recarga_directa?"✓":"✗"}</span>
          </div>

          <nav className="sb-nav">
            <div className="sb-grp">Operaciones</div>
            {TABS.map(t=>(
              <button key={t.id} className={`sb-item ${tab===t.id?"on":""} ${t.futuro?"sb-item-future":""}`}
                onClick={()=>{ if(!t.futuro){setTab(t.id);setSideOpen(false);} else showToast("Próximamente","warn"); }}>
                <span className="sb-item-ico">{t.icon}</span>
                {t.label}
                {t.futuro&&<span className="sb-future-tag">PRONTO</span>}
              </button>
            ))}
            {/* Secciones futuras */}
            <div className="sb-grp" style={{marginTop:8}}>Próximamente</div>
            {[
              {ico:"📱",label:"Lector QR"},
              {ico:"🎯",label:"Meta diaria"},
              {ico:"🔔",label:"Notificaciones"},
              {ico:"👥",label:"Mis jugadores"},
            ].map(f=>(
              <button key={f.label} className="sb-item sb-item-future" onClick={()=>showToast("Próximamente","warn")}>
                <span className="sb-item-ico">{f.ico}</span>
                {f.label}
                <span className="sb-future-tag">PRONTO</span>
              </button>
            ))}
          </nav>

          <div className="sb-foot">
            <button className="sb-out" onClick={handleLogout}><LogOut size={13}/> Cerrar sesión</button>
          </div>
        </aside>

        {/* ═══ MAIN ═══ */}
        <div className="mn">
          {/* TOPBAR */}
          <div className="tb">
            <div className="tb-left">
              <button className="tb-ham" onClick={()=>setSideOpen(true)}><Menu size={20}/></button>
              <span className="tb-title">
                {TABS.find(t=>t.id===tab)?.icon} {TABS.find(t=>t.id===tab)?.label}
              </span>
            </div>
            <div className="tb-right">
              {distribuidor&&(
                <div className="tb-pais">
                  <Globe size={11}/>
                  {PAIS_FLAG[distribuidor.pais_codigo]||"🌎"} {distribuidor.pais_codigo} · 1 PX = {simbolo}{fmt(tasa)} {moneda}
                </div>
              )}
              <span className="tb-live"><span className="tb-dot"/> Activo</span>
            </div>
          </div>

          <div className="bd">

            {/* ══ DASHBOARD ══ */}
            {tab==="dashboard"&&(
              <>
                {/* Saldo */}
                <div className="saldo-card">
                  <div>
                    <div className="saldo-lbl">Saldo disponible</div>
                    <div className="saldo-val">{fmt(distribuidor?.balance_px??0)} PX</div>
                    <div className="saldo-local">≈ {fmtLocal(distribuidor?.balance_px??0)} · {pins.length} PINs disponibles</div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <button className="btn btn-v" onClick={()=>setTab("recargar")}>💳 Recargar jugador</button>
                    <button className="btn btn-g" onClick={()=>setTab("premios")}>🏆 Pagar premio</button>
                  </div>
                </div>

                {/* Stats */}
                <div className="stats-grid">
                  {[
                    {l:"Hoy",v:statsHoy,s:"recargas",c:"#fff"},
                    {l:"Esta semana",v:statsSemana,s:"últimos 7 días",c:"#fff"},
                    {l:"Total ventas",v:`${fmt(statsVentas)} PX`,s:fmtLocal(statsVentas),c:"#8dc63f"},
                    {l:"Com. recarga",v:`${fmt(statsComRec)} PX`,s:`${comRec}% por op.`,c:"#8dc63f"},
                    {l:"Com. premios",v:`${fmt(statsComPrem)} PX`,s:`${comPrem}% por pago`,c:"#a855f7"},
                    {l:"Com. total",v:`${fmt(statsComTotal)} PX`,s:fmtLocal(statsComTotal),c:"#f59e0b"},
                  ].map(s=>(
                    <div key={s.l} className="stat-card">
                      <div className="stat-lbl">{s.l}</div>
                      <div className="stat-val" style={{color:s.c,fontSize:typeof s.v==="string"&&s.v.length>8?13:19}}>{s.v}</div>
                      <div className="stat-sub">{s.s}</div>
                    </div>
                  ))}
                </div>

                {/* Últimas operaciones */}
                <div className="sec">
                  <div className="sec-h">
                    <div className="sec-t">Últimas operaciones</div>
                    <div style={{display:"flex",gap:7}}>
                      <button className="btn btn-g" onClick={cargar}><RefreshCw size={10}/> Actualizar</button>
                      {puedeRecargar&&<button className="btn btn-v" onClick={()=>setTab("recargar")}>+ Recargar</button>}
                    </div>
                  </div>
                  {recargas.length===0?(
                    <div className="empty"><div className="empty-ico">💳</div><div className="empty-t">Sin operaciones aún</div></div>
                  ):(
                    <div className="tbl-wrap">
                      <table className="tbl">
                        <thead><tr><th>Jugador</th><th>Monto PX</th><th>Equivalente</th><th>Comisión</th><th>Tipo</th><th>Estado</th><th>Fecha</th></tr></thead>
                        <tbody>{recargas.slice(0,8).map(r=>(
                          <tr key={r.id}>
                            <td>
                              <div style={{color:"#fff",fontWeight:500}}>{r.jugador_username??"—"}</div>
                              <div style={{fontSize:10,color:"rgba(255,255,255,.25)"}}>{r.jugador_email}</div>
                            </td>
                            <td style={{fontFamily:"'Oswald',sans-serif",color:"#8dc63f",fontWeight:700}}>{fmt(r.monto_px)} PX</td>
                            <td style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>{fmtLocal(r.monto_px)}</td>
                            <td>
                              <div style={{fontFamily:"'Oswald',sans-serif",color:"#f59e0b",fontWeight:700}}>{fmt(r.comision_px)} PX</div>
                              <div style={{fontSize:9,color:"rgba(255,255,255,.2)"}}>{r.comision_porcentaje}%</div>
                            </td>
                            <td><span className={`badge ${tipoBadge(r)}`}>{tipoLabel(r)}</span></td>
                            <td><span className={`badge ${r.estado==="COMPLETADA"?"b-on":"b-off"}`}>{r.estado}</span></td>
                            <td style={{fontSize:10,color:"rgba(255,255,255,.25)"}}>{fmtFecha(r.created_at)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Secciones futuras preview */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:14}}>
                  {[
                    {ico:"📱",t:"Lector QR",d:"Escanea el código del jugador para recargar sin teclear"},
                    {ico:"🎯",t:"Meta diaria",d:"Establece objetivos de recargas y comisiones del día"},
                    {ico:"🔔",t:"Notificaciones",d:"Alertas de fondeos, cambios de permisos y más"},
                    {ico:"👥",t:"Mis jugadores",d:"Historial de jugadores atendidos y sus movimientos"},
                  ].map(f=>(
                    <div key={f.t} className="futuro-sec">
                      <div className="futuro-tag">🚧 PRÓXIMAMENTE</div>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:"rgba(255,255,255,.4)",marginBottom:4}}>{f.ico} {f.t}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,.2)",lineHeight:1.5}}>{f.d}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ══ RECARGAR PX ══ */}
            {tab==="recargar"&&(
              <div className="sec">
                <div className="sec-h">
                  <div className="sec-t">Recargar saldo PX</div>
                  {jugadorFound&&<button className="btn btn-g" onClick={()=>{setJugadorFound(null);setBusqueda("");setMontoRecarga("");setRecargaExitosa(false);}}><X size={10}/> Nueva búsqueda</button>}
                </div>
                <div className="sec-b">
                  {!puedeRecargar&&(
                    <div className="alert-err"><AlertTriangle size={13}/> No tienes permiso para recargar. Contacta a tu promotor.</div>
                  )}
                  {puedeRecargar&&(
                    <>
                      {!jugadorFound&&(
                        <>
                          <div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginBottom:12}}>Busca al jugador por <strong style={{color:"rgba(255,255,255,.5)"}}>documento, email o username</strong></div>
                          <div className="search-wrap">
                            <input className="search-inp" value={busqueda} onChange={e=>setBusqueda(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(setBuscando(true),buscarJugador(busqueda,setJugadorFound,setJugadorError).finally(()=>setBuscando(false)))} placeholder="Documento, email o username..."/>
                            <button className="search-btn" onClick={()=>{setBuscando(true);buscarJugador(busqueda,setJugadorFound,setJugadorError).finally(()=>setBuscando(false));}} disabled={buscando}>
                              {buscando?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Search size={12}/>} Buscar
                            </button>
                          </div>
                          {jugadorError&&<div className="alert-err"><AlertTriangle size={12}/> {jugadorError}</div>}
                        </>
                      )}
                      {jugadorFound&&(
                        <>
                          {recargaExitosa&&<div className="alert-ok"><CheckCircle size={14}/> Recarga exitosa — Saldo actual: {fmt(jugadorFound.pitchx_balance)} PX ({fmtLocal(jugadorFound.pitchx_balance)})</div>}
                          <div className="jcard">
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:4}}>
                              <div className="jcard-name">{jugadorFound.nombre_completo||jugadorFound.username||"Jugador"}</div>
                              <span className={`badge ${jugadorFound.status==="active"||jugadorFound.status==="VIVO"?"b-on":"b-off"}`}>{jugadorFound.status==="active"||jugadorFound.status==="VIVO"?"Activo":"Inactivo"}</span>
                            </div>
                            <div className="jcard-email">{jugadorFound.email} · Doc: {jugadorFound.numero_documento}</div>
                            <div className="jcard-stats">
                              <div className="jcard-stat"><div className="jcard-stat-l">Saldo PX</div><div className="jcard-stat-v" style={{color:"#8dc63f"}}>{fmt(jugadorFound.pitchx_balance)}</div></div>
                              <div className="jcard-stat"><div className="jcard-stat-l">Equiv.</div><div className="jcard-stat-v" style={{color:"#8dc63f",fontSize:12}}>{fmtLocal(jugadorFound.pitchx_balance)}</div></div>
                              <div className="jcard-stat"><div className="jcard-stat-l">Vidas</div><div className="jcard-stat-v" style={{color:"#ef4444"}}>{jugadorFound.lives} ❤️</div></div>
                              <div className="jcard-stat"><div className="jcard-stat-l">Username</div><div className="jcard-stat-v" style={{fontSize:12,color:"rgba(255,255,255,.6)"}}>{jugadorFound.username||"—"}</div></div>
                            </div>
                          </div>
                          <div style={{fontSize:10,color:"rgba(255,255,255,.25)",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span>Tu saldo disponible: <strong style={{color:"#8dc63f",fontFamily:"'Oswald',sans-serif"}}>{fmt(distribuidor?.balance_px??0)} PX</strong></span>
                            <span>{fmtLocal(distribuidor?.balance_px??0)}</span>
                          </div>
                          <input type="number" className="monto-inp" placeholder="0" value={montoRecarga} onChange={e=>setMontoRecarga(e.target.value)} min={1}/>
                          <div className="monto-quick">
                            {[5,10,20,50,100,200,500].map(m=>(
                              <button key={m} className={`monto-q ${montoRecarga===String(m)?"sel":""}`} onClick={()=>setMontoRecarga(String(m))}>{m} PX</button>
                            ))}
                          </div>
                          {montoRecarga&&parseInt(montoRecarga)>0&&(
                            <div className="com-info">
                              <span>Tu comisión ({comRec}%): <strong style={{color:"#f59e0b",fontFamily:"'Oswald',sans-serif"}}>{Math.round(parseInt(montoRecarga)*(comRec/100))} PX</strong></span>
                              <span style={{color:"rgba(255,255,255,.3)"}}>Equiv: {fmtLocal(parseInt(montoRecarga))}</span>
                            </div>
                          )}
                          <button className="btn btn-v" style={{width:"100%",padding:"11px",fontSize:12}} disabled={recargando||!montoRecarga}
                            onClick={()=>{
                              if(!montoRecarga||parseInt(montoRecarga)<=0){showToast("Ingresa un monto","warn");return;}
                              if(parseInt(montoRecarga)>(distribuidor?.balance_px??0)){showToast("Saldo insuficiente","warn");return;}
                              setShowConfirmRec(true);
                            }}>
                            {recargando?<><Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/> Recargando...</>:<>💳 Confirmar recarga</>}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ══ PAGAR PREMIO ══ */}
            {tab==="premios"&&(
              <div className="sec">
                <div className="sec-h">
                  <div className="sec-t">Pagar premio al jugador</div>
                  {jugadorPremio&&<button className="btn btn-g" onClick={()=>{setJugadorPremio(null);setBusquedaPremio("");setRetiroPendiente(null);setPagoExitoso(false);setCodigoFound(null);setBusquedaCodigo("");setCodigoPagado(false);}}><X size={10}/> Nueva búsqueda</button>}
                </div>
                <div className="sec-b">
                  {!jugadorPremio&&(
                    <>
                      {/* Buscar por jugador */}
                      <div style={{marginBottom:20}}>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:10,color:"rgba(255,255,255,.35)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                          <Search size={11}/> Buscar jugador con retiro aprobado
                        </div>
                        <div className="search-wrap">
                          <input className="search-inp" value={busquedaPremio} onChange={e=>setBusquedaPremio(e.target.value)} onKeyDown={e=>e.key==="Enter"&&buscarJugadorPremio()} placeholder="Documento, email o username..."/>
                          <button className="search-btn" onClick={buscarJugadorPremio} disabled={buscandoPremio}>
                            {buscandoPremio?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Search size={12}/>} Buscar
                          </button>
                        </div>
                        {jugadorPremioErr&&<div className="alert-err"><AlertTriangle size={12}/> {jugadorPremioErr}</div>}
                      </div>

                      {/* Separador */}
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                        <div style={{flex:1,height:1,background:"rgba(255,255,255,.06)"}}/>
                        <span style={{fontSize:10,color:"rgba(255,255,255,.2)",letterSpacing:1}}>O</span>
                        <div style={{flex:1,height:1,background:"rgba(255,255,255,.06)"}}/>
                      </div>

                      {/* Código de ganancia */}
                      <div>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:10,color:"rgba(168,85,247,.6)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                          <Trophy size={11}/> Validar código de ganancia
                        </div>
                        <div className="search-wrap">
                          <input className="search-inp" value={busquedaCodigo}
                            onChange={e=>{setBusquedaCodigo(e.target.value.toUpperCase());setCodigoError("");}}
                            onKeyDown={e=>e.key==="Enter"&&buscarCodigo()}
                            placeholder={`Ej: ${distribuidor?.pais_codigo??"CO"}-ABCD123-EFGH`}
                            style={{fontFamily:"monospace",letterSpacing:1}}/>
                          <button className="search-btn" style={{background:"#a855f7"}} onClick={buscarCodigo} disabled={buscandoCodigo}>
                            {buscandoCodigo?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Trophy size={12}/>} Validar
                          </button>
                        </div>
                        {codigoError&&<div className="alert-err"><AlertTriangle size={12}/> {codigoError}</div>}

                        {codigoFound&&!codigoPagado&&(
                          <div className="codigo-card">
                            <div style={{textAlign:"center",background:"rgba(168,85,247,.1)",borderRadius:6,padding:"10px",marginBottom:14}}>
                              <div style={{fontFamily:"monospace",fontSize:16,color:"#a855f7",letterSpacing:2}}>{codigoFound.codigo}</div>
                            </div>
                            <div className="premio-monto">
                              <div className="premio-box">
                                <div className="premio-box-lbl">Monto a pagar</div>
                                <div className="premio-box-val" style={{color:"#a855f7"}}>{fmt(codigoFound.monto_local)}</div>
                                <div className="premio-box-sub">{codigoFound.moneda}</div>
                              </div>
                              <div className="premio-box">
                                <div className="premio-box-lbl">Tu comisión ({comPrem}%)</div>
                                <div className="premio-box-val" style={{color:"#f59e0b"}}>{Math.round(codigoFound.monto_px*(comPrem/100))}</div>
                                <div className="premio-box-sub">PX</div>
                              </div>
                            </div>
                            <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginBottom:8}}>
                              <strong style={{color:"rgba(255,255,255,.6)"}}>Jugador:</strong> {codigoFound.jugador?.nombre_completo} · {codigoFound.jugador?.numero_documento}
                            </div>
                            {codigoFound.retiro&&<div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginBottom:12}}><strong style={{color:"rgba(255,255,255,.5)"}}>Pago:</strong> {codigoFound.retiro.metodo_pago} · {codigoFound.retiro.numero_cuenta}{codigoFound.retiro.banco&&` · ${codigoFound.retiro.banco}`}</div>}
                            <div className="alert-warn"><AlertTriangle size={12}/> Vence: {fmtFecha(codigoFound.expira_en)} {fmtHora(codigoFound.expira_en)}</div>
                            <div style={{display:"flex",gap:8}}>
                              <button className="btn btn-g" style={{flex:1}} onClick={()=>{setCodigoFound(null);setBusquedaCodigo("");}}>Cancelar</button>
                              <button className="btn btn-p" style={{flex:2}} onClick={()=>setShowConfirmCodigo(true)} disabled={procesandoCodigo}>
                                {procesandoCodigo?<><Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/> Procesando...</>:<><Trophy size={11}/> Confirmar y pagar</>}
                              </button>
                            </div>
                          </div>
                        )}
                        {codigoPagado&&<div className="alert-ok"><CheckCircle size={14}/> Premio pagado y código eliminado correctamente</div>}
                      </div>
                    </>
                  )}

                  {jugadorPremio&&(
                    <>
                      {pagoExitoso&&<div className="alert-ok"><CheckCircle size={14}/> Premio pagado correctamente</div>}
                      <div className="jcard">
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:4}}>
                          <div className="jcard-name">{jugadorPremio.nombre_completo||jugadorPremio.username||"Jugador"}</div>
                          <span className={`badge ${jugadorPremio.status==="active"||jugadorPremio.status==="VIVO"?"b-on":"b-off"}`}>{jugadorPremio.status==="active"||jugadorPremio.status==="VIVO"?"Activo":"Inactivo"}</span>
                        </div>
                        <div className="jcard-email">{jugadorPremio.email} · Doc: {jugadorPremio.numero_documento}</div>
                        <div className="jcard-stats">
                          <div className="jcard-stat"><div className="jcard-stat-l">Saldo PX</div><div className="jcard-stat-v" style={{color:"#8dc63f"}}>{fmt(jugadorPremio.pitchx_balance)}</div></div>
                          <div className="jcard-stat"><div className="jcard-stat-l">Equiv.</div><div className="jcard-stat-v" style={{color:"#8dc63f",fontSize:12}}>{fmtLocal(jugadorPremio.pitchx_balance)}</div></div>
                          <div className="jcard-stat"><div className="jcard-stat-l">Vidas</div><div className="jcard-stat-v" style={{color:"#ef4444"}}>{jugadorPremio.lives} ❤️</div></div>
                          <div className="jcard-stat"><div className="jcard-stat-l">Username</div><div className="jcard-stat-v" style={{fontSize:11,color:"rgba(255,255,255,.6)"}}>{jugadorPremio.username||"—"}</div></div>
                        </div>
                      </div>

                      {retiroPendiente?(
                        !pagoExitoso&&(
                          <div className="premio-card">
                            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:10,color:"rgba(168,85,247,.6)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
                              <Trophy size={11}/> Premio aprobado pendiente de pago
                            </div>
                            <div className="premio-monto">
                              <div className="premio-box">
                                <div className="premio-box-lbl">Monto a pagar</div>
                                <div className="premio-box-val" style={{color:"#a855f7"}}>{Number(retiroPendiente.monto_local??retiroPendiente.monto_neto??0).toLocaleString()}</div>
                                <div className="premio-box-sub">{retiroPendiente.moneda??"PX"}</div>
                              </div>
                              <div className="premio-box">
                                <div className="premio-box-lbl">Tu comisión ({comPrem}%)</div>
                                <div className="premio-box-val" style={{color:"#f59e0b"}}>{Math.round(Number(retiroPendiente.monto_neto??0)*(comPrem/100))}</div>
                                <div className="premio-box-sub">PX</div>
                              </div>
                            </div>
                            <div className="premio-metodo">
                              <div className="pm-box"><div className="pm-lbl">Método de pago</div><div className="pm-val">{retiroPendiente.metodo_pago?.toUpperCase()??"EFECTIVO"}</div></div>
                              <div className="pm-box"><div className="pm-lbl">Número de cuenta</div><div className="pm-val">{retiroPendiente.numero_cuenta??"—"}</div></div>
                              {retiroPendiente.banco&&<div className="pm-box" style={{gridColumn:"span 2"}}><div className="pm-lbl">Banco / Tipo</div><div className="pm-val">{retiroPendiente.banco} · {retiroPendiente.tipo_cuenta}</div></div>}
                            </div>
                            <div className="alert-warn"><AlertTriangle size={12}/> Asegúrate de realizar el pago físico antes de confirmar.</div>
                            <button style={{width:"100%",padding:"11px",background:"#a855f7",color:"#fff",border:"none",borderRadius:7,fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}} onClick={()=>setShowConfirmPremio(true)} disabled={pagandoPremio}>
                              {pagandoPremio?<><Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/> Registrando...</>:<><Trophy size={12}/> Confirmar pago de premio</>}
                            </button>
                          </div>
                        )
                      ):(
                        <div className="alert-empty"><Trophy size={14} style={{display:"inline",marginRight:6,opacity:.4}}/> Este jugador no tiene premios aprobados pendientes de pago en punto físico.</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ══ VENDER PIN ══ */}
            {tab==="pines"&&(
              <div className="sec">
                <div className="sec-h">
                  <div className="sec-t">Vender PIN · {distribuidor?.pais_codigo??"CO"}</div>
                  {jugadorPin&&<button className="btn btn-g" onClick={()=>{setJugadorPin(null);setBusquedaPin("");setPinSel(null);setVentaExitosa(false);}}><X size={10}/> Nueva búsqueda</button>}
                </div>
                <div className="sec-b">
                  {!puedeVenderPin&&(
                    <div className="alert-err"><AlertTriangle size={13}/> No tienes permiso para vender PINs. Contacta a tu promotor.</div>
                  )}
                  {puedeVenderPin&&(
                    <>
                      {ventaExitosa&&<div className="alert-ok"><CheckCircle size={14}/> PIN entregado correctamente</div>}
                      {!jugadorPin&&(
                        <>
                          <div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginBottom:12}}>Busca al jugador para asignarle un PIN de <strong style={{color:"#8dc63f"}}>{distribuidor?.pais_codigo??"CO"}</strong> · {pins.length} PINs disponibles</div>
                          <div className="search-wrap">
                            <input className="search-inp" value={busquedaPin} onChange={e=>setBusquedaPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(setBuscandoPin(true),buscarJugador(busquedaPin,setJugadorPin,setJugadorPinErr).finally(()=>setBuscandoPin(false)))} placeholder="Documento, email o username..."/>
                            <button className="search-btn" onClick={()=>{setBuscandoPin(true);buscarJugador(busquedaPin,setJugadorPin,setJugadorPinErr).finally(()=>setBuscandoPin(false));}} disabled={buscandoPin}>
                              {buscandoPin?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Search size={12}/>} Buscar
                            </button>
                          </div>
                          {jugadorPinErr&&<div className="alert-err"><AlertTriangle size={12}/> {jugadorPinErr}</div>}
                        </>
                      )}
                      {jugadorPin&&(
                        <>
                          <div className="jcard">
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:4}}>
                              <div className="jcard-name">{jugadorPin.nombre_completo||jugadorPin.username||"Jugador"}</div>
                              <span className={`badge ${jugadorPin.status==="active"||jugadorPin.status==="VIVO"?"b-on":"b-off"}`}>{jugadorPin.status==="active"||jugadorPin.status==="VIVO"?"Activo":"Inactivo"}</span>
                            </div>
                            <div className="jcard-email">{jugadorPin.email} · Doc: {jugadorPin.numero_documento}</div>
                            <div className="jcard-stats">
                              <div className="jcard-stat"><div className="jcard-stat-l">Saldo PX</div><div className="jcard-stat-v" style={{color:"#8dc63f"}}>{fmt(jugadorPin.pitchx_balance)}</div></div>
                              <div className="jcard-stat"><div className="jcard-stat-l">Equiv.</div><div className="jcard-stat-v" style={{color:"#8dc63f",fontSize:12}}>{fmtLocal(jugadorPin.pitchx_balance)}</div></div>
                              <div className="jcard-stat"><div className="jcard-stat-l">Vidas</div><div className="jcard-stat-v" style={{color:"#ef4444"}}>{jugadorPin.lives} ❤️</div></div>
                              <div className="jcard-stat"><div className="jcard-stat-l">Username</div><div className="jcard-stat-v" style={{fontSize:11,color:"rgba(255,255,255,.6)"}}>{jugadorPin.username||"—"}</div></div>
                            </div>
                          </div>
                          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>PINs disponibles — {distribuidor?.pais_codigo??"CO"} ({pins.length})</div>
                          {pins.length===0?(
                            <div className="empty"><div className="empty-ico">🔑</div><div className="empty-t">Sin PINs disponibles</div><div className="empty-s">Solicita más PINs a tu promotor</div></div>
                          ):(
                            <>
                              <div style={{maxHeight:260,overflowY:"auto",marginBottom:12}}>
                                {pins.map((p:any)=>(
                                  <div key={p.id} className={`pin-item ${pinSel?.id===p.id?"sel":""}`} onClick={()=>setPinSel(pinSel?.id===p.id?null:p)}>
                                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                                      <div style={{width:16,height:16,borderRadius:3,border:`2px solid ${pinSel?.id===p.id?"#8dc63f":"rgba(255,255,255,.15)"}`,background:pinSel?.id===p.id?"#8dc63f":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                        {pinSel?.id===p.id&&<CheckCircle size={9} style={{color:"#0a0d14"}}/>}
                                      </div>
                                      <span className="pin-codigo">{p.codigo}</span>
                                    </div>
                                    <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                                      <span style={{fontFamily:"'Oswald',sans-serif",fontSize:11,color:"#ef4444",fontWeight:700}}>{p.vidas} ❤️</span>
                                      <span style={{fontFamily:"'Oswald',sans-serif",fontSize:11,color:"#8dc63f",fontWeight:700}}>{p.creditos} PX</span>
                                      <span style={{fontSize:9,color:"rgba(255,255,255,.25)"}}>≈ {fmtLocal(p.creditos)}</span>
                                      {p.expira_en&&<span style={{fontSize:9,color:"rgba(245,158,11,.5)"}}>Exp: {fmtFecha(p.expira_en)}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {pinSel&&(
                                <>
                                  <div className="com-info" style={{marginBottom:12}}>
                                    Comisión por venta ({comRec}%): <strong style={{color:"#f59e0b",fontFamily:"'Oswald',sans-serif"}}>{Math.round(pinSel.creditos*(comRec/100))} PX</strong>
                                  </div>
                                  <button className="btn btn-v" style={{width:"100%",padding:"11px",fontSize:12}} onClick={()=>setShowConfirmPin(true)} disabled={vendiendo}>
                                    {vendiendo?<><Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/> Entregando...</>:<>🔑 Entregar PIN seleccionado</>}
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ══ HISTORIAL ══ */}
            {tab==="historial"&&(
              <div className="sec">
                <div className="sec-h">
                  <div className="sec-t">Historial ({recargasFiltradas.length} de {recargas.length})</div>
                  <button className="btn btn-g" onClick={cargar}><RefreshCw size={10}/> Actualizar</button>
                </div>
                <div style={{padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                  <div className="filtro-bar">
                    <span style={{fontSize:9,color:"rgba(255,255,255,.25)",letterSpacing:1}}>TIPO:</span>
                    {(["TODOS","RECARGA","PREMIO","PIN"] as FiltroTipo[]).map(f=>(
                      <button key={f} className={`filtro-btn ${filtroTipo===f?"on":""}`} onClick={()=>setFiltroTipo(f)}>
                        {f} ({f==="TODOS"?recargas.length:recargas.filter(r=>tipoLabel(r)===f).length})
                      </button>
                    ))}
                    <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:7}}>
                      <span style={{fontSize:9,color:"rgba(255,255,255,.25)"}}>FECHA:</span>
                      <input type="date" className="fecha-inp" value={filtroFecha} onChange={e=>setFiltroFecha(e.target.value)}/>
                      {filtroFecha&&<button className="btn btn-g" style={{padding:"3px 7px",fontSize:9}} onClick={()=>setFiltroFecha("")}><X size={9}/></button>}
                    </div>
                  </div>
                </div>
                {recargasFiltradas.length===0?(
                  <div className="empty"><div className="empty-ico">📋</div><div className="empty-t">Sin operaciones</div><div className="empty-s">Ajusta los filtros</div></div>
                ):(
                  <div className="tbl-wrap">
                    <table className="tbl">
                      <thead><tr><th>Jugador</th><th>Monto PX</th><th>Equiv. local</th><th>Tipo</th><th>%</th><th>Comisión</th><th>Estado</th><th>Fecha</th><th>Hora</th></tr></thead>
                      <tbody>{recargasFiltradas.map(r=>(
                        <tr key={r.id}>
                          <td>
                            <div style={{color:"#fff",fontWeight:500}}>{r.jugador_username??"—"}</div>
                            <div style={{fontSize:10,color:"rgba(255,255,255,.2)"}}>{r.jugador_email}</div>
                          </td>
                          <td style={{fontFamily:"'Oswald',sans-serif",color:"#8dc63f",fontWeight:700}}>{fmt(r.monto_px)} PX</td>
                          <td style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>{fmtLocal(r.monto_px)}</td>
                          <td><span className={`badge ${tipoBadge(r)}`}>{tipoLabel(r)}</span></td>
                          <td style={{color:"rgba(255,255,255,.35)",fontSize:11}}>{r.comision_porcentaje}%</td>
                          <td style={{fontFamily:"'Oswald',sans-serif",color:"#f59e0b",fontWeight:700}}>{fmt(r.comision_px)} PX</td>
                          <td><span className={`badge ${r.estado==="COMPLETADA"?"b-on":"b-off"}`}>{r.estado}</span></td>
                          <td style={{fontSize:10,whiteSpace:"nowrap"}}>{fmtFecha(r.created_at)}</td>
                          <td style={{fontSize:10,color:"rgba(255,255,255,.25)",whiteSpace:"nowrap"}}>{fmtHora(r.created_at)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                <div className="totales-bar">
                  <div className="total-item">Ops: <span className="total-val">{recargasFiltradas.length}</span></div>
                  <div className="total-item">Volumen: <span className="total-val" style={{color:"#8dc63f"}}>{fmt(recargasFiltradas.reduce((a,r)=>a+r.monto_px,0))} PX</span></div>
                  <div className="total-item">≈ <span className="total-val" style={{color:"#8dc63f"}}>{fmtLocal(recargasFiltradas.reduce((a,r)=>a+r.monto_px,0))}</span></div>
                  <div className="total-item">Com. recarga: <span className="total-val" style={{color:"#8dc63f"}}>{fmt(recargasFiltradas.filter(r=>tipoLabel(r)==="RECARGA").reduce((a,r)=>a+r.comision_px,0))} PX</span></div>
                  <div className="total-item">Com. premios: <span className="total-val" style={{color:"#a855f7"}}>{fmt(recargasFiltradas.filter(r=>tipoLabel(r)==="PREMIO").reduce((a,r)=>a+r.comision_px,0))} PX</span></div>
                  <div className="total-item">Com. total: <span className="total-val" style={{color:"#f59e0b"}}>{fmt(recargasFiltradas.reduce((a,r)=>a+r.comision_px,0))} PX</span></div>
                </div>
              </div>
            )}

            {/* ══ COMISIONES ══ */}
            {tab==="comisiones"&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:14}}>
                  
                  {[
                    {l:"Por recarga",v:statsComRec,c:"#8dc63f",pct:`${comRec}%`},
                    {l:"Por premios",v:statsComPrem,c:"#a855f7",pct:`${comPrem}%`},
                    {l:"Por PINs",v:statsComPin,c:"#38bdf8",pct:`${comRec}%`},
                    {l:"Total acumulado",v:statsComTotal,c:"#f59e0b",pct:"—"},
                  ].map(s=>(
                    <div key={s.l} style={{background:"#111827",border:"1px solid rgba(255,255,255,.06)",borderRadius:8,padding:"14px 16px"}}>
                      <div style={{fontSize:9,color:"rgba(255,255,255,.25)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>{s.l}</div>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontSize:20,fontWeight:700,color:s.c}}>{fmt(s.v)} PX</div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,.25)",marginTop:4}}>{fmtLocal(s.v)} · {s.pct}</div>
                    </div>
                  ))}
                </div>
                <div className="sec">
                  <div className="sec-h"><div className="sec-t">Mis comisiones por tipo</div></div>
                  <div className="tbl-wrap">
                    <table className="tbl">
                      <thead><tr><th>Tipo</th><th>Cantidad ops.</th><th>Volumen PX</th><th>Comisión PX</th><th>Equiv. local</th><th>% aplicado</th></tr></thead>
                      <tbody>
                        {[
                          {tipo:"RECARGA",badge:"b-on",ops:recargas.filter(r=>tipoLabel(r)==="RECARGA").length,vol:recargas.filter(r=>tipoLabel(r)==="RECARGA").reduce((a,r)=>a+r.monto_px,0),com:statsComRec,pct:comRec},
                          {tipo:"PREMIO",badge:"b-purple",ops:recargas.filter(r=>tipoLabel(r)==="PREMIO").length,vol:recargas.filter(r=>tipoLabel(r)==="PREMIO").reduce((a,r)=>a+r.monto_px,0),com:statsComPrem,pct:comPrem},
                          {tipo:"PIN",badge:"b-info",ops:recargas.filter(r=>tipoLabel(r)==="PIN").length,vol:recargas.filter(r=>tipoLabel(r)==="PIN").reduce((a,r)=>a+r.monto_px,0),com:statsComPin,pct:comRec},
                        ].map(s=>(
                          <tr key={s.tipo}>
                            <td><span className={`badge ${s.badge}`}>{s.tipo}</span></td>
                            <td style={{fontFamily:"'Oswald',sans-serif",fontWeight:700}}>{s.ops}</td>
                            <td style={{fontFamily:"'Oswald',sans-serif",color:"#8dc63f",fontWeight:700}}>{fmt(s.vol)} PX</td>
                            <td style={{fontFamily:"'Oswald',sans-serif",color:"#f59e0b",fontWeight:700}}>{fmt(s.com)} PX</td>
                            <td style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>{fmtLocal(s.com)}</td>
                            <td style={{color:"rgba(255,255,255,.4)"}}>{s.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.2)",lineHeight:1.8,padding:"12px 16px",background:"rgba(255,255,255,.02)",borderRadius:8,border:"1px solid rgba(255,255,255,.05)"}}>
                  Las comisiones son configuradas por tu promotor y pueden variar. Contacta a tu promotor para solicitar ajustes.
                </div>
              </>
            )}

            {/* ══ MI CUENTA ══ */}
            {tab==="cuenta"&&distribuidor&&(
              <div className="sec">
                <div className="sec-h"><div className="sec-t">Mi cuenta</div></div>
                <div>
                  {[
                    {l:"Nombre",v:distribuidor.nombre},
                    {l:"Email",v:distribuidor.email},
                    {l:"País",v:`${PAIS_FLAG[distribuidor.pais_codigo]||"🌎"} ${distribuidor.pais}`},
                    {l:"Código de país",v:distribuidor.pais_codigo},
                    {l:"Moneda",v:`${moneda} · ${simbolo}1 USD = ${fmt(tasa)} ${moneda}`},
                    {l:"Código distribuidor",v:"codigo"},
                    {l:"Saldo PX",v:"saldo"},
                    {l:"Equivalente local",v:fmtLocal(distribuidor.balance_px)},
                    {l:"PINs disponibles",v:`${pins.length} PINs de ${distribuidor.pais_codigo}`},
                    {l:"% Comisión recarga",v:`${comRec}%`},
                    {l:"% Comisión premio",v:`${comPrem}%`},
                    {l:"Estado",v:"estado"},
                    {l:"Permisos",v:"permisos"},
                    {l:"Miembro desde",v:fmtFecha(distribuidor.created_at)},
                    {l:"Total operaciones",v:String(recargas.length)},
                  ].map(f=>(
                    <div key={f.l} className="cr">
                      <span className="cl">{f.l}</span>
                      <span className="cv">
                        {f.v==="estado"&&<span className={`badge ${distribuidor.activo?"b-on":"b-off"}`}>{distribuidor.activo?"Activo":"Inactivo"}</span>}
                        {f.v==="saldo"&&<span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,color:"#8dc63f",fontSize:15}}>{fmt(distribuidor.balance_px)} PX</span>}
                        {f.v==="codigo"&&<span style={{fontFamily:"monospace",color:"#8dc63f",fontSize:12,letterSpacing:1}}>{distribuidor.codigo_distribuidor??"—"}</span>}
                        {f.v==="permisos"&&(
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            {distribuidor.permite_recarga_saldo_px&&<span className="badge b-on">Recarga PX</span>}
                            {distribuidor.permite_venta_pines&&<span className="badge b-info">PINs</span>}
                            {distribuidor.permite_recarga_directa&&<span className="badge b-warn">Directa</span>}
                            {!distribuidor.permite_recarga_saldo_px&&!distribuidor.permite_venta_pines&&!distribuidor.permite_recarga_directa&&<span style={{color:"rgba(255,255,255,.25)",fontSize:11}}>Ninguno</span>}
                          </div>
                        )}
                        {!["estado","saldo","codigo","permisos"].includes(f.v)&&f.v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ══ MODAL CONFIRMAR RECARGA ══ */}
      {showConfirmRec&&jugadorFound&&distribuidor&&(
        <div className="mo" onClick={e=>{if(e.target===e.currentTarget)setShowConfirmRec(false)}}>
          <div className="md">
            <div className="mh"><span className="mh-t">💳 Confirmar recarga</span><button className="mh-c" onClick={()=>setShowConfirmRec(false)}><X size={14}/></button></div>
            <div className="mb">
              <div style={{textAlign:"center",background:"rgba(141,198,63,.06)",border:"1px solid rgba(141,198,63,.15)",borderRadius:8,padding:"12px",marginBottom:14}}>
                <div style={{fontSize:9,color:"rgba(141,198,63,.5)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Monto a recargar</div>
                <div style={{fontFamily:"'Oswald',sans-serif",fontSize:30,fontWeight:700,color:"#8dc63f"}}>{fmt(parseInt(montoRecarga))} PX</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginTop:3}}>{fmtLocal(parseInt(montoRecarga))}</div>
              </div>
              <div className="mo-row"><span className="mo-lbl">Jugador</span><span className="mo-val">{jugadorFound.username||jugadorFound.email}</span></div>
              <div className="mo-row"><span className="mo-lbl">Documento</span><span className="mo-val">{jugadorFound.numero_documento}</span></div>
              <div className="mo-row"><span className="mo-lbl">Saldo antes</span><span className="mo-val">{fmt(jugadorFound.pitchx_balance)} PX</span></div>
              <div className="mo-row"><span className="mo-lbl">Saldo después</span><span className="mo-val" style={{color:"#8dc63f"}}>{fmt(jugadorFound.pitchx_balance+parseInt(montoRecarga))} PX</span></div>
              <div className="mo-row"><span className="mo-lbl">Tu comisión ({comRec}%)</span><span className="mo-val" style={{color:"#f59e0b"}}>{Math.round(parseInt(montoRecarga)*(comRec/100))} PX</span></div>
            </div>
            <div className="mf">
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowConfirmRec(false)}>Cancelar</button>
              <button className="btn btn-v" style={{flex:2}} onClick={realizarRecarga}><CheckCircle size={11}/> Confirmar y recargar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL CONFIRMAR PAGO PREMIO ══ */}
      {showConfirmPremio&&jugadorPremio&&retiroPendiente&&(
        <div className="mo" onClick={e=>{if(e.target===e.currentTarget)setShowConfirmPremio(false)}}>
          <div className="md">
            <div className="mh"><span className="mh-t">🏆 Confirmar pago de premio</span><button className="mh-c" onClick={()=>setShowConfirmPremio(false)}><X size={14}/></button></div>
            <div className="mb">
              <div style={{textAlign:"center",background:"rgba(168,85,247,.06)",border:"1px solid rgba(168,85,247,.18)",borderRadius:8,padding:"12px",marginBottom:14}}>
                <div style={{fontSize:9,color:"rgba(168,85,247,.5)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Monto a pagar</div>
                <div style={{fontFamily:"'Oswald',sans-serif",fontSize:28,fontWeight:700,color:"#a855f7"}}>{Number(retiroPendiente.monto_local??retiroPendiente.monto_neto??0).toLocaleString()} {retiroPendiente.moneda??"PX"}</div>
              </div>
              <div className="mo-row"><span className="mo-lbl">Jugador</span><span className="mo-val">{jugadorPremio.username||jugadorPremio.email}</span></div>
              <div className="mo-row"><span className="mo-lbl">Método</span><span className="mo-val">{retiroPendiente.metodo_pago?.toUpperCase()??"EFECTIVO"}</span></div>
              <div className="mo-row"><span className="mo-lbl">Cuenta</span><span className="mo-val">{retiroPendiente.numero_cuenta??"—"}</span></div>
              <div className="mo-row"><span className="mo-lbl">Tu comisión ({comPrem}%)</span><span className="mo-val" style={{color:"#f59e0b"}}>{Math.round(Number(retiroPendiente.monto_neto??0)*(comPrem/100))} PX</span></div>
              <div style={{marginTop:10,padding:"9px 11px",background:"rgba(245,158,11,.04)",border:"1px solid rgba(245,158,11,.12)",borderRadius:6,fontSize:10,color:"rgba(245,158,11,.7)",lineHeight:1.5}}>
                ⚠️ Al confirmar declaras que ya realizaste el pago físico al jugador.
              </div>
            </div>
            <div className="mf">
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowConfirmPremio(false)}>Cancelar</button>
              <button className="btn btn-p" style={{flex:2}} onClick={pagarPremio}><Trophy size={11}/> Confirmar pago</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL CONFIRMAR CÓDIGO GANANCIA ══ */}
      {showConfirmCodigo&&codigoFound&&(
        <div className="mo">
          <div className="md">
            <div className="mh"><span className="mh-t">🏆 Confirmar pago de código</span></div>
            <div className="mb">
              <div style={{textAlign:"center",background:"rgba(168,85,247,.08)",border:"1px solid rgba(168,85,247,.2)",borderRadius:8,padding:"12px",marginBottom:14}}>
                <div style={{fontFamily:"monospace",fontSize:14,color:"#a855f7",letterSpacing:2,marginBottom:8}}>{codigoFound.codigo}</div>
                <div style={{fontFamily:"'Oswald',sans-serif",fontSize:26,fontWeight:700,color:"#a855f7"}}>{fmt(codigoFound.monto_local)} {codigoFound.moneda}</div>
              </div>
              <div className="mo-row"><span className="mo-lbl">Jugador</span><span className="mo-val">{codigoFound.jugador?.nombre_completo??"—"}</span></div>
              <div className="mo-row"><span className="mo-lbl">Documento</span><span className="mo-val">{codigoFound.jugador?.numero_documento??"—"}</span></div>
              <div className="mo-row"><span className="mo-lbl">Tu comisión ({comPrem}%)</span><span className="mo-val" style={{color:"#f59e0b"}}>{Math.round(codigoFound.monto_px*(comPrem/100))} PX</span></div>
              <div style={{marginTop:10,padding:"9px 11px",background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.13)",borderRadius:6,fontSize:10,color:"rgba(239,68,68,.8)",lineHeight:1.5}}>
                🔴 Este código se eliminará al confirmar. Esta acción es irreversible.
              </div>
            </div>
            <div className="mf">
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowConfirmCodigo(false)}>Cancelar</button>
              <button className="btn btn-p" style={{flex:2}} onClick={procesarCodigo} disabled={procesandoCodigo}>
                {procesandoCodigo?<><Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/> Procesando...</>:<><Trophy size={11}/> Confirmar y pagar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL CONFIRMAR PIN ══ */}
      {showConfirmPin&&jugadorPin&&pinSel&&(
        <div className="mo" onClick={e=>{if(e.target===e.currentTarget)setShowConfirmPin(false)}}>
          <div className="md">
            <div className="mh"><span className="mh-t">🔑 Confirmar entrega de PIN</span><button className="mh-c" onClick={()=>setShowConfirmPin(false)}><X size={14}/></button></div>
            <div className="mb">
              <div style={{textAlign:"center",background:"rgba(141,198,63,.06)",border:"1px solid rgba(141,198,63,.15)",borderRadius:8,padding:"12px",marginBottom:14}}>
                <div style={{fontFamily:"monospace",fontSize:16,fontWeight:700,color:"#8dc63f",letterSpacing:2}}>{pinSel.codigo}</div>
              </div>
              <div className="mo-row"><span className="mo-lbl">Jugador</span><span className="mo-val">{jugadorPin.username||jugadorPin.email}</span></div>
              <div className="mo-row"><span className="mo-lbl">Documento</span><span className="mo-val">{jugadorPin.numero_documento}</span></div>
              <div className="mo-row"><span className="mo-lbl">Vidas a acreditar</span><span className="mo-val" style={{color:"#ef4444"}}>{pinSel.vidas} ❤️</span></div>
              <div className="mo-row"><span className="mo-lbl">PX a acreditar</span><span className="mo-val" style={{color:"#8dc63f"}}>{pinSel.creditos} PX (≈ {fmtLocal(pinSel.creditos)})</span></div>
              <div className="mo-row"><span className="mo-lbl">Tu comisión ({comRec}%)</span><span className="mo-val" style={{color:"#f59e0b"}}>{Math.round(pinSel.creditos*(comRec/100))} PX</span></div>
            </div>
            <div className="mf">
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowConfirmPin(false)}>Cancelar</button>
              <button className="btn btn-v" style={{flex:2}} onClick={venderPin}><CheckCircle size={11}/> Confirmar entrega</button>
            </div>
          </div>
        </div>
      )}

      {toast&&<div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
"use client";
// ══════════════════════════════════════════════════════════════
//  PANEL PROMOTOR v6.0 — Estilo Codere/Bet365
//  UBICACIÓN: app/(promotor)/promotor/page.tsx
//  Diseño: oscuro, limpio, profesional. SIN colores neón.
//  Sistema: #8dc63f verde, #0a0d14 fondo, #111827 cards
//  Fuentes: Oswald (títulos) + Roboto (texto)
// ══════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Users, DollarSign, TrendingUp, Activity, LogOut,
  UserPlus, Eye, EyeOff, Copy, CheckCircle, X,
  Wallet, BarChart2, Shield, RefreshCw,
  AlertTriangle, Loader2, ArrowUpRight, Clock,
  FileText, CreditCard, ArrowRightLeft, Key,
  Trophy, Search, Package, ChevronRight,
  PlusCircle, Menu, Bell, Globe
} from "lucide-react";

const ROLES_PROMOTOR = ["promotor", "admin", "super_admin", "finance_admin"];

interface PerfilPromotor {
  id: string; user_id?: string; nombre: string; email: string;
  pais: string; pais_codigo: string; activo: boolean; subdominio?: string;
  created_at: string; balance_px: number;
  permite_recarga_directa?: boolean; permite_emision_pines?: boolean;
}
interface Distribuidor {
  id: string; user_id: string | null; nombre: string; email: string;
  pais: string; pais_codigo: string; activo: boolean;
  comision_porcentaje: number; comision_recarga_pct?: number;
  comision_premio_pct?: number; comision_pago_premio_pct?: number;
  created_at: string; balance_px: number; codigo_distribuidor?: string;
  permite_venta_pines?: boolean; permite_recarga_saldo_px?: boolean;
  permite_recarga_directa?: boolean;
  total_recargas?: number; total_ventas_px?: number;
}
interface Recarga {
  id: string; distribuidor_id: string; jugador_id: string;
  monto_px: number; comision_px: number; comision_porcentaje: number;
  estado: string; notas?: string; created_at: string;
  distribuidor_nombre?: string;
}
interface PagoPremio {
  id: string; distribuidor_id: string; jugador_id: string;
  monto_px: number; comision_px: number; comision_pct: number;
  metodo_pago: string; estado: string; notas?: string;
  created_at: string; distribuidor_nombre?: string;
}
interface PedidoPromotor {
  id: string; promotor_id: string; tipo: string; cantidad: number;
  monto_deuda: number; estado: string; estado_pago: string;
  notas?: string; created_at: string;
}

type Tab = "dashboard" | "distribuidores" | "recargas" | "pagos_premio" | "pedidos" | "comisiones" | "cuenta";

const fmt      = (n: number) => Number(n ?? 0).toLocaleString("es-CO");
const fmtFecha = (f: string) => new Date(f).toLocaleDateString("es-CO", { day:"2-digit", month:"short", year:"numeric" });
const fmtHora  = (f: string) => new Date(f).toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" });

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id:"dashboard",     label:"Dashboard",     icon:"📊" },
  { id:"distribuidores",label:"Distribuidores",icon:"👥" },
  { id:"recargas",      label:"Recargas",      icon:"💳" },
  { id:"pagos_premio",  label:"Pagos Premio",  icon:"🏆" },
  { id:"pedidos",       label:"Pedidos",       icon:"📦" },
  { id:"comisiones",    label:"Comisiones",    icon:"💰" },
  { id:"cuenta",        label:"Mi Cuenta",     icon:"🔐" },
];

export default function PromotorPage() {
  const router = useRouter();
  const [tab,            setTab]            = useState<Tab>("dashboard");
  const [sideOpen,       setSideOpen]       = useState(false);
  const [promotor,       setPromotor]       = useState<PerfilPromotor|null>(null);
  const [distribuidores, setDistribuidores] = useState<Distribuidor[]>([]);
  const [recargas,       setRecargas]       = useState<Recarga[]>([]);
  const [pagosPremio,    setPagosPremio]    = useState<PagoPremio[]>([]);
  const [pedidos,        setPedidos]        = useState<PedidoPromotor[]>([]);
  const [comisiones,     setComisiones]     = useState<any[]>([]);
  const [pagos,          setPagos]          = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [toast,          setToast]          = useState<{msg:string;type:"ok"|"err"|"warn"}|null>(null);

  // stats calculados
  const totalDistribuidores  = distribuidores.length;
  const distActivos          = distribuidores.filter(d=>d.activo).length;
  const totalVentas          = recargas.reduce((a,r)=>a+r.monto_px,0);
  const totalComisionesPend  = comisiones.reduce((a,c)=>a+Number(c.pendiente??0),0);
  const deudaTotal           = pedidos.filter(p=>p.estado_pago==="DEUDA").reduce((a,p)=>a+Number(p.monto_deuda),0);
  const premiosPend          = pagosPremio.filter(p=>p.estado==="REGISTRADO").length;
  const hoy                  = new Date().toISOString().split("T")[0];
  const recargasHoy          = recargas.filter(r=>r.created_at.startsWith(hoy)).length;

  // modales
  const [showModal,           setShowModal]           = useState(false);
  const [creando,             setCreando]             = useState(false);
  const [distSel,             setDistSel]             = useState<Distribuidor|null>(null);
  const [showComision,        setShowComision]        = useState(false);
  const [showPermisos,        setShowPermisos]        = useState(false);
  const [showTransfer,        setShowTransfer]        = useState(false);
  const [showConfirmTransfer, setShowConfirmTransfer] = useState(false);
  const [showPedido,          setShowPedido]          = useState(false);
  const [aprobando,           setAprobando]           = useState<string|null>(null);

  // form nuevo dist
  const [fNombre,   setFNombre]   = useState("");
  const [fEmail,    setFEmail]    = useState("");
  const [fPais,     setFPais]     = useState("Colombia");
  const [fPassword, setFPassword] = useState("");
  const [fPaisCod,  setFPaisCod]  = useState("+57");
  const [fComRec,   setFComRec]   = useState("10");
  const [fComPrem,  setFComPrem]  = useState("5");

  // form comision
  const [eComRec,   setEComRec]   = useState("10");
  const [eComPrem,  setEComPrem]  = useState("5");
  const [eVigencia, setEVigencia] = useState("");
  const [guardCom,  setGuardCom]  = useState(false);

  // form permisos
  const [pVentaPines,     setPVentaPines]     = useState(false);
  const [pRecargaSaldo,   setPRecargaSaldo]   = useState(false);
  const [pRecargaDirecta, setPRecargaDirecta] = useState(false);
  const [guardPerm,       setGuardPerm]       = useState(false);

  // form transfer
  const [busqueda,     setBusqueda]     = useState("");
  const [buscando,     setBuscando]     = useState(false);
  const [distFound,    setDistFound]    = useState<Distribuidor|null>(null);
  const [busqErr,      setBusqErr]      = useState("");
  const [monto,        setMonto]        = useState("");
  const [transfErr,    setTransfErr]    = useState("");
  const [ejecutando,   setEjecutando]   = useState(false);

  // form pedido
  const [tipoPed,    setTipoPed]    = useState<"SALDO_PX"|"PINES">("SALDO_PX");
  const [cantPed,    setCantPed]    = useState("");
  const [montoPed,   setMontoPed]   = useState("");
  const [notasPed,   setNotasPed]   = useState("");
  const [creandoPed, setCreandoPed] = useState(false);

  const showToast = (msg:string, type:"ok"|"err"|"warn"="ok") => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3500);
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data:profile } = await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
      if (!ROLES_PROMOTOR.includes(profile?.role??"")) { router.push("/radar"); return; }

      const { data:prom } = await supabase.from("promotores").select("*").eq("user_id",user.id).maybeSingle();
      if (!prom) { showToast("Perfil de promotor no encontrado","err"); setLoading(false); return; }
      setPromotor({ ...prom, balance_px:Number(prom.balance_px)||0 });

      const { data:distsSupa } = await supabase.from("distribuidores").select("*")
        .eq("promotor_id",prom.id).order("created_at",{ascending:false});
      const listaD: Distribuidor[] = (distsSupa??[]).map((d:any)=>({
        id:d.id, user_id:d.user_id??null, nombre:d.nombre??"",
        email:d.email??"", pais:d.pais??"", pais_codigo:d.pais_codigo??"",
        activo:d.activo??true, comision_porcentaje:d.comision_porcentaje??10,
        comision_recarga_pct:d.comision_recarga_pct??10,
        comision_premio_pct:d.comision_premio_pct??5,
        comision_pago_premio_pct:d.comision_pago_premio_pct??5,
        created_at:d.created_at??"", balance_px:Number(d.balance_px)||0,
        codigo_distribuidor:d.codigo_distribuidor??"",
        permite_venta_pines:d.permite_venta_pines??false,
        permite_recarga_saldo_px:d.permite_recarga_saldo_px??false,
        permite_recarga_directa:d.permite_recarga_directa??false,
        total_recargas:0, total_ventas_px:0,
      }));
      setDistribuidores(listaD);

      const distIds = listaD.map(d=>d.id);
      if (distIds.length>0) {
        const { data:recs } = await supabase.from("recargas_distribuidor").select("*")
          .in("distribuidor_id",distIds).neq("estado","FONDEO")
          .order("created_at",{ascending:false}).limit(200);
        setRecargas((recs??[]).map((r:any)=>({
          ...r, monto_px:Number(r.monto_px??0), comision_px:Number(r.comision_px??0),
          comision_porcentaje:Number(r.comision_porcentaje??0),
          distribuidor_nombre:listaD.find(d=>d.id===r.distribuidor_id)?.nombre??"—",
        })));

        const { data:pp } = await supabase.from("pagos_premio").select("*")
          .in("distribuidor_id",distIds).order("created_at",{ascending:false});
        setPagosPremio((pp??[]).map((p:any)=>({
          ...p, distribuidor_nombre:listaD.find(d=>d.id===p.distribuidor_id)?.nombre??"—",
        })));

        const { data:coms } = await supabase.from("comisiones_distribuidor").select("*")
          .in("distribuidor_id",distIds);
        setComisiones((coms??[]).map((c:any)=>({
          ...c, distribuidor_nombre:listaD.find(d=>d.id===c.distribuidor_id)?.nombre??"—",
        })));

        const { data:pgs } = await supabase.from("pagos_comision").select("*")
          .eq("promotor_id",prom.id).order("created_at",{ascending:false});
        setPagos((pgs??[]).map((p:any)=>({
          ...p, distribuidor_nombre:listaD.find(d=>d.id===p.distribuidor_id)?.nombre??"—",
        })));
      }

      const { data:peds } = await supabase.from("pedidos_promotor").select("*")
        .eq("promotor_id",prom.id).order("created_at",{ascending:false});
      setPedidos(peds??[]);

    } catch(err) { console.error("[PromotorPage]",err); showToast("Error al cargar datos","err"); }
    finally { setLoading(false); }
  },[router]);

  useEffect(()=>{ cargar(); },[cargar]);

  const crearDistribuidor = async () => {
    if (!fNombre.trim()||!fEmail.trim()) { showToast("Nombre y email requeridos","warn"); return; }
    if (!fPassword.trim()||fPassword.length<8) { showToast("Contraseña mínimo 8 caracteres","warn"); return; }
    if (!promotor) return;
    setCreando(true);
    try {
      const { data:{ session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/distribuidores`,{
        method:"POST",
        headers:{"Content-Type":"application/json",...(session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{})},
        body:JSON.stringify({email:fEmail.trim().toLowerCase(),password:fPassword,nombre:fNombre.trim(),pais:fPais,pais_codigo:fPaisCod}),
      });
      if (!res.ok) { const e=await res.json(); throw new Error(e.message??"Error al crear"); }
      const data = await res.json();
      if (data?.id) await supabase.from("distribuidores").update({
        comision_porcentaje:parseFloat(fComRec)||10,
        comision_recarga_pct:parseFloat(fComRec)||10,
        comision_premio_pct:parseFloat(fComPrem)||5,
        comision_pago_premio_pct:parseFloat(fComPrem)||5,
      }).eq("id",data.id);
      showToast(`Distribuidor ${fNombre} creado`,"ok");
      setShowModal(false);
      setFNombre(""); setFEmail(""); setFPassword(""); setFPais("Colombia"); setFPaisCod("+57");
      await cargar();
    } catch(err:any) { showToast(err.message??"Error","err"); }
    finally { setCreando(false); }
  };

  const toggleDist = async (id:string, activo:boolean) => {
    const { error } = await supabase.from("distribuidores").update({activo:!activo}).eq("id",id);
    if (error) { showToast("Error: "+error.message,"err"); return; }
    showToast(activo?"Distribuidor desactivado":"Distribuidor activado","ok");
    await cargar();
  };

  const abrirComision = (d:Distribuidor) => {
    setDistSel(d);
    setEComRec(String(d.comision_recarga_pct??d.comision_porcentaje??10));
    setEComPrem(String(d.comision_pago_premio_pct??d.comision_premio_pct??5));
    setEVigencia(new Date().toISOString().split("T")[0]);
    setShowComision(true);
  };

  const guardarComision = async () => {
    if (!distSel||!promotor) return;
    setGuardCom(true);
    try {
      const { error } = await supabase.from("distribuidores").update({
        comision_recarga_pct:parseFloat(eComRec)||10,
        comision_premio_pct:parseFloat(eComPrem)||5,
        comision_pago_premio_pct:parseFloat(eComPrem)||5,
        comision_vigencia_desde:new Date(eVigencia).toISOString(),
        comision_porcentaje:parseFloat(eComRec)||10,
      }).eq("id",distSel.id);
      if (error) throw error;
      await supabase.from("configuracion_comisiones").insert({
        distribuidor_id:distSel.id, promotor_id:promotor.id,
        porcentaje_recarga:parseFloat(eComRec)||10,
        porcentaje_premio:parseFloat(eComPrem)||5,
        fecha_vigencia:new Date(eVigencia).toISOString(),
        creado_por_id:(await supabase.auth.getUser()).data.user?.id,
      });
      showToast("Comisión actualizada","ok");
      setShowComision(false);
      await cargar();
    } catch(err:any) { showToast(err.message??"Error","err"); }
    finally { setGuardCom(false); }
  };

  const abrirPermisos = (d:Distribuidor) => {
    setDistSel(d);
    setPVentaPines(d.permite_venta_pines??false);
    setPRecargaSaldo(d.permite_recarga_saldo_px??false);
    setPRecargaDirecta(d.permite_recarga_directa??false);
    setShowPermisos(true);
  };

  const guardarPermisos = async () => {
    if (!distSel) return;
    setGuardPerm(true);
    try {
      const { error } = await supabase.from("distribuidores").update({
        permite_venta_pines:pVentaPines,
        permite_recarga_saldo_px:pRecargaSaldo,
        permite_recarga_directa:pRecargaDirecta,
      }).eq("id",distSel.id);
      if (error) throw error;
      showToast("Permisos actualizados","ok");
      setShowPermisos(false);
      await cargar();
    } catch(err:any) { showToast(err.message??"Error","err"); }
    finally { setGuardPerm(false); }
  };

  const buscarDist = () => {
    if (!busqueda.trim()) { setBusqErr("Ingresa un código, email o nombre"); return; }
    setBuscando(true); setDistFound(null); setBusqErr("");
    const q = busqueda.trim().toLowerCase();
    const found = distribuidores.find(d=>
      (d.codigo_distribuidor??"").toLowerCase()===q||
      d.email.toLowerCase().includes(q)||
      d.nombre.toLowerCase().includes(q)
    );
    found ? setDistFound(found) : setBusqErr("Distribuidor no encontrado en tu red.");
    setBuscando(false);
  };

  const ejecutarTransferencia = async () => {
    if (!promotor||!distFound) return;
    const m = parseFloat(monto);
    if (!monto||isNaN(m)||m<=0) { setTransfErr("Ingresa un monto válido"); return; }
    if (m>promotor.balance_px) { setTransfErr(`Saldo insuficiente. Disponible: ${fmt(promotor.balance_px)} PX`); return; }
    setShowConfirmTransfer(true);
  };

  const confirmarTransferencia = async () => {
    if (!promotor||!distFound) return;
    const m = parseFloat(monto);
    setShowConfirmTransfer(false); setEjecutando(true); setTransfErr("");
    try {
      const { data, error } = await supabase.rpc("transferir_saldo",{
        p_promotor_id:promotor.id, p_distribuidor_id:distFound.id, p_monto:m,
      });
      if (error) throw error;
      if (data?.error) { setTransfErr(`Error: ${data.error}`); return; }
      showToast(`${fmt(m)} PX transferidos a ${distFound.nombre}`,"ok");
      setShowTransfer(false); setDistFound(null); setBusqueda(""); setMonto("");
      await cargar();
    } catch(err:any) { setTransfErr(err.message??"Error al transferir"); }
    finally { setEjecutando(false); }
  };

  const crearPedido = async () => {
    if (!promotor) return;
    if (!cantPed||parseFloat(cantPed)<=0) { showToast("Cantidad inválida","warn"); return; }
    if (!montoPed||parseFloat(montoPed)<=0) { showToast("Monto de deuda inválido","warn"); return; }
    setCreandoPed(true);
    try {
      const { error } = await supabase.from("pedidos_promotor").insert({
        promotor_id:promotor.id, tipo:tipoPed,
        cantidad:parseFloat(cantPed), monto_deuda:parseFloat(montoPed),
        estado:"PENDIENTE", estado_pago:"DEUDA", notas:notasPed||null,
      });
      if (error) throw error;
      showToast(`Pedido enviado al admin`,"ok");
      setShowPedido(false); setCantPed(""); setMontoPed(""); setNotasPed("");
      await cargar();
    } catch(err:any) { showToast(err.message??"Error","err"); }
    finally { setCreandoPed(false); }
  };

  const aprobarPago = async (id:string) => {
    setAprobando(id);
    const { error } = await supabase.from("pagos_comision")
      .update({estado:"APROBADO",fecha_aprobacion:new Date().toISOString()}).eq("id",id);
    if (error) showToast("Error al aprobar","err");
    else { showToast("Pago aprobado","ok"); await cargar(); }
    setAprobando(null);
  };

  const verificarPagoPremio = async (id:string) => {
    const { error } = await supabase.from("pagos_premio").update({estado:"VERIFICADO"}).eq("id",id);
    if (error) showToast("Error","err"); else { showToast("Pago verificado","ok"); await cargar(); }
  };

  const copiar = (t:string) => { navigator.clipboard.writeText(t); showToast("Copiado","ok"); };
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login?message=signed-out"); };

  const paisFlag: Record<string,string> = { CO:"🇨🇴", EC:"🇪🇨", MX:"🇲🇽", BR:"🇧🇷", AR:"🇦🇷", PE:"🇵🇪", VE:"🇻🇪", CL:"🇨🇱" };

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

        /* ── LAYOUT ── */
        .pw{min-height:100vh;background:#0a0d14;display:flex;}
        .sb{width:220px;background:#0b0e1a;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:50;transition:transform .3s;}
        @media(max-width:900px){.sb{transform:translateX(-100%);}.sb.open{transform:translateX(0);}}
        .sb-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:49;}
        @media(max-width:900px){.sb-overlay.open{display:block;}}
        .mn{flex:1;margin-left:220px;display:flex;flex-direction:column;min-height:100vh;}
        @media(max-width:900px){.mn{margin-left:0;}}

        /* ── SIDEBAR ── */
        .sb-logo{padding:20px 18px 16px;border-bottom:1px solid rgba(255,255,255,.05);}
        .sb-logo img{height:26px;width:auto;object-fit:contain;}
        .sb-logo-txt{font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;color:#8dc63f;letter-spacing:2px;}
        .sb-badge{font-size:9px;font-weight:700;letter-spacing:1.5px;color:rgba(141,198,63,.6);text-transform:uppercase;margin-top:2px;}
        .sb-user{padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:10px;}
        .sb-av{width:34px;height:34px;border-radius:50%;background:rgba(141,198,63,.1);border:1px solid rgba(141,198,63,.25);display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;color:#8dc63f;flex-shrink:0;}
        .sb-uname{font-size:12px;font-weight:500;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;}
        .sb-upais{font-size:10px;color:rgba(255,255,255,.25);margin-top:1px;}
        .sb-saldo{padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.05);}
        .sb-saldo-lbl{font-size:9px;color:rgba(255,255,255,.25);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;}
        .sb-saldo-val{font-family:'Oswald',sans-serif;font-size:20px;font-weight:700;color:#8dc63f;}
        .sb-saldo-sub{font-size:9px;color:rgba(255,255,255,.2);margin-top:2px;}
        .sb-nav{flex:1;padding:10px 0;overflow-y:auto;}
        .sb-grp{font-size:9px;color:rgba(255,255,255,.15);letter-spacing:2px;text-transform:uppercase;padding:10px 18px 4px;}
        .sb-item{display:flex;align-items:center;gap:9px;width:100%;padding:10px 18px;background:transparent;border:none;border-left:2px solid transparent;color:rgba(255,255,255,.3);font-family:'Roboto',sans-serif;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;text-align:left;}
        .sb-item:hover{color:rgba(255,255,255,.7);background:rgba(255,255,255,.02);}
        .sb-item.on{color:#8dc63f;background:rgba(141,198,63,.06);border-left-color:#8dc63f;}
        .sb-item-ico{font-size:14px;width:18px;text-align:center;flex-shrink:0;}
        .sb-dot{margin-left:auto;width:6px;height:6px;border-radius:50%;background:#ef4444;flex-shrink:0;}
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
        .tb-live{display:flex;align-items:center;gap:5px;font-size:10px;color:#8dc63f;font-weight:600;letter-spacing:1px;}
        .tb-dot{width:5px;height:5px;border-radius:50%;background:#8dc63f;animation:blink 1.5s infinite;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
        .tb-fondear{padding:6px 14px;background:#8dc63f;border:none;border-radius:5px;color:#0a0d14;font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;letter-spacing:.5px;cursor:pointer;transition:background .15s;display:flex;align-items:center;gap:5px;}
        .tb-fondear:hover{background:#7ab52f;}

        /* ── BODY ── */
        .bd{flex:1;padding:20px 24px;}
        @media(max-width:600px){.bd{padding:14px;}}

        /* ── STAT CARDS ── */
        .stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;}
        @media(min-width:900px){.stats-grid{grid-template-columns:repeat(6,1fr);}}
        @media(max-width:600px){.stats-grid{grid-template-columns:repeat(2,1fr);}}
        .stat-card{background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:13px 14px;}
        .stat-lbl{font-size:9px;color:rgba(255,255,255,.25);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px;}
        .stat-val{font-family:'Oswald',sans-serif;font-size:20px;font-weight:700;color:#fff;line-height:1;}
        .stat-sub{font-size:9px;color:rgba(255,255,255,.18);margin-top:3px;}

        /* ── ALERTAS ── */
        .alert-deuda{background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.18);border-radius:8px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
        .alert-verde{background:rgba(141,198,63,.06);border:1px solid rgba(141,198,63,.15);border-radius:8px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}

        /* ── SALDO BANNER ── */
        .saldo-card{background:linear-gradient(135deg,rgba(141,198,63,.08),rgba(141,198,63,.02));border:1px solid rgba(141,198,63,.18);border-radius:10px;padding:18px 20px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
        .saldo-val{font-family:'Oswald',sans-serif;font-size:30px;font-weight:700;color:#8dc63f;line-height:1;}
        .saldo-lbl{font-size:10px;color:rgba(141,198,63,.5);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;}
        .saldo-sub{font-size:10px;color:rgba(255,255,255,.2);margin-top:4px;}

        /* ── SECCIÓN ── */
        .sec{background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:10px;overflow:hidden;margin-bottom:14px;animation:fadeIn .2s ease;}
        .sec-h{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
        .sec-t{font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;color:rgba(255,255,255,.5);letter-spacing:1.5px;text-transform:uppercase;display:flex;align-items:center;gap:7px;}
        .sec-t::before{content:'';width:3px;height:12px;background:#8dc63f;border-radius:2px;flex-shrink:0;}
        .sec-b{padding:16px;}

        /* ── TABLA ── */
        .tbl-wrap{overflow-x:auto;}
        .tbl{width:100%;border-collapse:collapse;}
        .tbl th{font-family:'Oswald',sans-serif;font-size:9px;font-weight:600;color:rgba(255,255,255,.2);letter-spacing:1.5px;text-transform:uppercase;padding:10px 14px;text-align:left;border-bottom:1px solid rgba(255,255,255,.04);}
        .tbl td{padding:10px 14px;font-size:12px;color:rgba(255,255,255,.6);border-bottom:1px solid rgba(255,255,255,.03);}
        .tbl tr:last-child td{border-bottom:none;}
        .tbl tr:hover td{background:rgba(255,255,255,.015);}

        /* ── BADGES ── */
        .badge{display:inline-flex;align-items:center;padding:2px 7px;border-radius:3px;font-family:'Oswald',sans-serif;font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;}
        .b-on{background:rgba(141,198,63,.1);color:#8dc63f;border:1px solid rgba(141,198,63,.2);}
        .b-off{background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.2);}
        .b-warn{background:rgba(245,158,11,.1);color:#f59e0b;border:1px solid rgba(245,158,11,.2);}
        .b-info{background:rgba(56,189,248,.1);color:#38bdf8;border:1px solid rgba(56,189,248,.2);}
        .b-purple{background:rgba(168,85,247,.1);color:#a855f7;border:1px solid rgba(168,85,247,.2);}

        /* ── BOTONES ── */
        .btn{padding:7px 12px;border:none;border-radius:6px;cursor:pointer;font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;transition:all .15s;display:inline-flex;align-items:center;gap:5px;}
        .btn:disabled{opacity:.4;cursor:not-allowed;}
        .btn-v{background:#8dc63f;color:#0a0d14;}.btn-v:hover{background:#7ab52f;}
        .btn-g{background:rgba(255,255,255,.06);color:rgba(255,255,255,.45);border:1px solid rgba(255,255,255,.08);}.btn-g:hover{background:rgba(255,255,255,.1);color:#fff;}
        .btn-s{background:rgba(255,255,255,.04);color:rgba(255,255,255,.3);padding:5px 9px;font-size:9px;}.btn-s:hover{background:rgba(255,255,255,.08);color:#fff;}
        .btn-danger{background:rgba(239,68,68,.08);color:#ef4444;border:1px solid rgba(239,68,68,.15);padding:5px 9px;font-size:9px;}.btn-danger:hover{background:#ef4444;color:#fff;}
        .btn-info{background:rgba(56,189,248,.08);color:#38bdf8;border:1px solid rgba(56,189,248,.15);padding:5px 9px;font-size:9px;}.btn-info:hover{background:#38bdf8;color:#0a0d14;}
        .btn-green{background:rgba(141,198,63,.08);color:#8dc63f;border:1px solid rgba(141,198,63,.2);padding:5px 9px;font-size:9px;}.btn-green:hover{background:#8dc63f;color:#0a0d14;}
        .btn-green:disabled{opacity:.3;cursor:not-allowed;pointer-events:none;}

        /* ── PERMISOS ROW ── */
        .perm-row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.04);}
        .perm-row:last-child{border-bottom:none;}
        .toggle{width:36px;height:20px;border-radius:10px;border:none;cursor:pointer;transition:background .2s;position:relative;flex-shrink:0;}
        .toggle.on{background:#8dc63f;}.toggle.off{background:rgba(255,255,255,.1);}
        .toggle::after{content:'';position:absolute;width:14px;height:14px;border-radius:50%;background:#fff;top:3px;transition:left .2s;}
        .toggle.on::after{left:19px;}.toggle.off::after{left:3px;}

        /* ── EMPTY STATE ── */
        .empty{text-align:center;padding:40px 20px;}
        .empty-ico{font-size:28px;opacity:.3;margin-bottom:8px;}
        .empty-t{font-family:'Oswald',sans-serif;font-size:13px;color:rgba(255,255,255,.2);}
        .empty-s{font-size:11px;color:rgba(255,255,255,.12);margin-top:4px;}

        /* ── MODAL ── */
        .mo{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;}
        .md{width:100%;max-width:420px;background:#0f1420;border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden;max-height:92vh;overflow-y:auto;}
        .mh{padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#0f1420;z-index:1;}
        .mh-t{font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;color:#fff;display:flex;align-items:center;gap:8px;}
        .mh-c{background:none;border:none;color:rgba(255,255,255,.3);cursor:pointer;padding:4px;transition:color .15s;}.mh-c:hover{color:#fff;}
        .mb{padding:18px;}
        .mf{padding:0 18px 18px;display:flex;gap:8px;}
        .fi{margin-bottom:13px;}
        .fl{font-size:9px;color:rgba(255,255,255,.3);letter-spacing:1px;text-transform:uppercase;margin-bottom:5px;}
        .fp{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:6px;padding:9px 12px;color:#fff;font-size:12px;font-family:'Roboto',sans-serif;outline:none;transition:border-color .15s;}
        .fp:focus{border-color:rgba(141,198,63,.35);}
        .fp::placeholder{color:rgba(255,255,255,.2);}
        select.fp option{background:#111827;}

        /* ── TRANSFER BOXES ── */
        .tbox-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;}
        .tbox{border-radius:7px;padding:11px 13px;}
        .tbox-p{background:rgba(141,198,63,.06);border:1px solid rgba(141,198,63,.15);}
        .tbox-d{background:rgba(56,189,248,.06);border:1px solid rgba(56,189,248,.15);}
        .tbox-lbl{font-size:8px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:2px;font-family:'Oswald',sans-serif;}
        .tbox-nombre{font-size:10px;color:rgba(255,255,255,.3);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .tbox-val{font-family:'Oswald',sans-serif;font-size:17px;font-weight:700;}

        /* ── PEDIDO CARD ── */
        .ped-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}

        /* ── CUENTA ROW ── */
        .cr{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.04);}
        .cr:last-child{border-bottom:none;}
        .cl{font-size:10px;color:rgba(255,255,255,.25);letter-spacing:.5px;}
        .cv{font-size:12px;color:#fff;font-weight:500;display:flex;align-items:center;gap:6px;}

        /* ── SEARCH ── */
        .search-wrap{display:flex;gap:7px;margin-bottom:10px;}
        .search-inp{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:7px;padding:9px 12px;color:#fff;font-size:12px;outline:none;transition:border-color .15s;}
        .search-inp:focus{border-color:rgba(141,198,63,.3);}
        .search-inp::placeholder{color:rgba(255,255,255,.2);}

        /* ── DIST LIST ── */
        .dist-item{display:flex;align-items:center;justify-content:space-between;padding:9px 11px;border:1px solid rgba(255,255,255,.06);border-radius:7px;margin-bottom:5px;cursor:pointer;transition:border-color .15s;}
        .dist-item:hover{border-color:rgba(141,198,63,.25);background:rgba(141,198,63,.02);}

        /* ── TOAST ── */
        .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:7px;font-size:12px;font-weight:500;z-index:999;white-space:nowrap;animation:toastIn .2s ease;}
        .toast.ok{background:#8dc63f;color:#0a0d14;}
        .toast.err{background:#ef4444;color:#fff;}
        .toast.warn{background:#f59e0b;color:#0a0d14;}

        /* ── TIPO PEDIDO ── */
        .tipo-btn{padding:12px;border-radius:7px;cursor:pointer;font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;letter-spacing:.5px;transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;}
      `}</style>

      <div className={`sb-overlay ${sideOpen?"open":""}`} onClick={()=>setSideOpen(false)}/>

      <div className="pw">
        {/* ═══ SIDEBAR ═══ */}
        <aside className={`sb ${sideOpen?"open":""}`}>
          <div className="sb-logo">
            <img src="/img/logo12.png" alt="KickLast"
              onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}/>
            <div className="sb-logo-txt" style={{display:"none"}}>KICK LAST</div>
            <div className="sb-badge">Panel Promotor</div>
          </div>

          {promotor&&(
            <div className="sb-user">
              <div className="sb-av">{promotor.nombre.charAt(0).toUpperCase()}</div>
              <div style={{overflow:"hidden"}}>
                <div className="sb-uname">{promotor.nombre}</div>
                <div className="sb-upais">
                  {paisFlag[promotor.pais_codigo]||"🌎"} {promotor.pais}
                </div>
              </div>
            </div>
          )}

          <div className="sb-saldo">
            <div className="sb-saldo-lbl">Saldo disponible</div>
            <div className="sb-saldo-val">{fmt(promotor?.balance_px??0)} PX</div>
            <div className="sb-saldo-sub">Para transferir a distribuidores</div>
          </div>

          <nav className="sb-nav">
            <div className="sb-grp">Panel</div>
            {TABS.map(t=>(
              <button key={t.id} className={`sb-item ${tab===t.id?"on":""}`}
                onClick={()=>{setTab(t.id);setSideOpen(false);}}>
                <span className="sb-item-ico">{t.icon}</span>
                {t.label}
                {t.id==="pedidos"&&deudaTotal>0&&<span className="sb-dot"/>}
                {t.id==="pagos_premio"&&premiosPend>0&&<span className="sb-dot"/>}
              </button>
            ))}
          </nav>

          <div className="sb-foot">
            <button className="sb-out" onClick={handleLogout}>
              <LogOut size={13}/> Cerrar sesión
            </button>
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
              <span className="tb-live"><span className="tb-dot"/> Sistema activo</span>
              <button className="tb-fondear" onClick={()=>{setShowTransfer(true);setDistFound(null);setBusqueda("");setMonto("");setTransfErr("");}}>
                <ArrowRightLeft size={11}/> Fondear
              </button>
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
                    <div className="saldo-val">{fmt(promotor?.balance_px??0)} PX</div>
                    <div className="saldo-sub">Fondos para transferir a distribuidores</div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <button className="btn btn-v" onClick={()=>{setShowTransfer(true);setDistFound(null);setBusqueda("");setMonto("");setTransfErr("");}}>
                      <ArrowRightLeft size={11}/> Fondear distribuidor
                    </button>
                    <button className="btn btn-g" onClick={()=>setShowPedido(true)}>
                      <Package size={11}/> Pedir al admin
                    </button>
                  </div>
                </div>

                {/* Deuda */}
                {deudaTotal>0&&(
                  <div className="alert-deuda">
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <AlertTriangle size={15} style={{color:"#ef4444",flexShrink:0}}/>
                      <div>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:700,color:"#ef4444"}}>Deuda pendiente con el admin</div>
                        <div style={{fontSize:11,color:"rgba(255,255,255,.35)"}}>Pedidos por pagar</div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontFamily:"'Oswald',sans-serif",fontSize:20,fontWeight:700,color:"#ef4444"}}>{fmt(deudaTotal)} PX</span>
                      <button className="btn btn-s" onClick={()=>setTab("pedidos")}>Ver pedidos</button>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="stats-grid">
                  {[
                    {l:"Distribuidores",v:totalDistribuidores,s:`${distActivos} activos`,c:"#fff"},
                    {l:"Recargas hoy",v:recargasHoy,s:"en el día",c:"#fff"},
                    {l:"Total ventas",v:`${fmt(totalVentas)} PX`,s:"acumulado",c:"#8dc63f"},
                    {l:"Com. pendiente",v:`${fmt(totalComisionesPend)} PX`,s:"por pagar",c:"#f59e0b"},
                    {l:"Premios pend.",v:premiosPend,s:"por verificar",c:"#a855f7"},
                    {l:"Deuda admin",v:`${fmt(deudaTotal)} PX`,s:"pendiente",c:deudaTotal>0?"#ef4444":"#8dc63f"},
                  ].map(s=>(
                    <div key={s.l} className="stat-card">
                      <div className="stat-lbl">{s.l}</div>
                      <div className="stat-val" style={{color:s.c,fontSize:typeof s.v==="string"&&s.v.length>8?14:20}}>{s.v}</div>
                      <div className="stat-sub">{s.s}</div>
                    </div>
                  ))}
                </div>

                {/* Últimas recargas */}
                <div className="sec">
                  <div className="sec-h">
                    <div className="sec-t">Últimas recargas</div>
                    <button className="btn btn-g" onClick={()=>setTab("recargas")}>Ver todas</button>
                  </div>
                  {recargas.length===0?(
                    <div className="empty"><div className="empty-ico">💳</div><div className="empty-t">Sin recargas aún</div></div>
                  ):(
                    <div className="tbl-wrap">
                      <table className="tbl">
                        <thead><tr><th>Distribuidor</th><th>Monto</th><th>Comisión</th><th>Estado</th><th>Fecha</th></tr></thead>
                        <tbody>{recargas.slice(0,6).map(r=>(
                          <tr key={r.id}>
                            <td style={{color:"#fff",fontWeight:500}}>{r.distribuidor_nombre}</td>
                            <td style={{fontFamily:"'Oswald',sans-serif",color:"#8dc63f",fontWeight:700}}>{fmt(r.monto_px)} PX</td>
                            <td style={{color:"#f59e0b"}}>{fmt(r.comision_px)} PX</td>
                            <td><span className={`badge ${r.estado==="COMPLETADA"?"b-on":"b-off"}`}>{r.estado}</span></td>
                            <td style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>{fmtFecha(r.created_at)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Top distribuidores */}
                <div className="sec">
                  <div className="sec-h">
                    <div className="sec-t">Mi red de distribuidores</div>
                    <button className="btn btn-g" onClick={()=>setTab("distribuidores")}>Ver todos</button>
                  </div>
                  {distribuidores.length===0?(
                    <div className="empty"><div className="empty-ico">👥</div><div className="empty-t">Sin distribuidores aún</div></div>
                  ):(
                    <div className="tbl-wrap">
                      <table className="tbl">
                        <thead><tr><th>Nombre</th><th>País</th><th>Saldo PX</th><th>% Recarga</th><th>Estado</th><th>Desde</th></tr></thead>
                        <tbody>{[...distribuidores].sort((a,b)=>b.balance_px-a.balance_px).slice(0,5).map(d=>(
                          <tr key={d.id}>
                            <td>
                              <div style={{color:"#fff",fontWeight:500}}>{d.nombre}</div>
                              <div style={{fontSize:10,color:"rgba(255,255,255,.25)"}}>{d.email}</div>
                            </td>
                            <td style={{fontSize:11}}>{paisFlag[d.pais_codigo]||"🌎"} {d.pais}</td>
                            <td style={{fontFamily:"'Oswald',sans-serif",color:"#38bdf8",fontWeight:700}}>{fmt(d.balance_px)} PX</td>
                            <td style={{fontFamily:"'Oswald',sans-serif",color:"#8dc63f"}}>{d.comision_recarga_pct??d.comision_porcentaje}%</td>
                            <td><span className={`badge ${d.activo?"b-on":"b-off"}`}>{d.activo?"Activo":"Inactivo"}</span></td>
                            <td style={{fontSize:10,color:"rgba(255,255,255,.25)"}}>{fmtFecha(d.created_at)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ══ DISTRIBUIDORES ══ */}
            {tab==="distribuidores"&&(
              <div className="sec">
                <div className="sec-h">
                  <div className="sec-t">Mis distribuidores ({distribuidores.length})</div>
                  <div style={{display:"flex",gap:7}}>
                    <button className="btn btn-g" onClick={cargar}><RefreshCw size={10}/> Actualizar</button>
                    <button className="btn btn-v" onClick={()=>setShowModal(true)}><UserPlus size={10}/> Nuevo</button>
                  </div>
                </div>
                {distribuidores.length===0?(
                  <div className="empty"><div className="empty-ico">👥</div><div className="empty-t">Sin distribuidores</div><div className="empty-s">Crea el primero con el botón Nuevo</div></div>
                ):(
                  <div className="tbl-wrap">
                    <table className="tbl">
                      <thead><tr>
                        <th>Distribuidor</th><th>País</th><th>% Rec.</th><th>% Premio</th>
                        <th>Saldo PX</th><th>Permisos</th><th>Estado</th><th>Acciones</th>
                      </tr></thead>
                      <tbody>{distribuidores.map(d=>(
                        <tr key={d.id}>
                          <td>
                            <div style={{color:"#fff",fontWeight:500}}>{d.nombre}</div>
                            <div style={{fontSize:10,color:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",gap:3}}>
                              {d.email}
                              <button style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.15)",padding:0}} onClick={()=>copiar(d.email)}><Copy size={9}/></button>
                            </div>
                            {d.codigo_distribuidor&&<div style={{fontSize:9,fontFamily:"monospace",color:"rgba(56,189,248,.4)",marginTop:1}}>{d.codigo_distribuidor}</div>}
                          </td>
                          <td style={{fontSize:11}}>{paisFlag[d.pais_codigo]||"🌎"} {d.pais}</td>
                          <td style={{fontFamily:"'Oswald',sans-serif",color:"#8dc63f",fontWeight:700}}>{d.comision_recarga_pct??d.comision_porcentaje}%</td>
                          <td style={{fontFamily:"'Oswald',sans-serif",color:"#a855f7"}}>{d.comision_pago_premio_pct??d.comision_premio_pct??5}%</td>
                          <td style={{fontFamily:"'Oswald',sans-serif",color:"#38bdf8",fontWeight:700}}>{fmt(d.balance_px)} PX</td>
                          <td>
                            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                              {d.permite_recarga_saldo_px&&<span className="badge b-on" style={{padding:"1px 5px",fontSize:8}}>PX</span>}
                              {d.permite_venta_pines&&<span className="badge b-info" style={{padding:"1px 5px",fontSize:8}}>PIN</span>}
                              {d.permite_recarga_directa&&<span className="badge b-warn" style={{padding:"1px 5px",fontSize:8}}>DIR</span>}
                              {!d.permite_recarga_saldo_px&&!d.permite_venta_pines&&!d.permite_recarga_directa&&<span style={{color:"rgba(255,255,255,.15)",fontSize:10}}>—</span>}
                            </div>
                          </td>
                          <td><span className={`badge ${d.activo?"b-on":"b-off"}`}>{d.activo?"Activo":"Inactivo"}</span></td>
                          <td>
                            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                              <button className="btn btn-green" onClick={()=>{setDistFound(d);setMonto("");setTransfErr("");setShowTransfer(true);}} disabled={!d.activo||(promotor?.balance_px??0)<=0}>
                                <ArrowRightLeft size={9}/> Fondear
                              </button>
                              <button className="btn btn-info" onClick={()=>abrirPermisos(d)}>
                                <Shield size={9}/> Permisos
                              </button>
                              <button className="btn btn-s" onClick={()=>abrirComision(d)}>
                                <TrendingUp size={9}/> Comisión
                              </button>
                              <button className={d.activo?"btn btn-danger":"btn btn-s"} onClick={()=>toggleDist(d.id,d.activo)}>
                                {d.activo?<><EyeOff size={9}/> Desactivar</>:<><Eye size={9}/> Activar</>}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══ RECARGAS ══ */}
            {tab==="recargas"&&(
              <div className="sec">
                <div className="sec-h">
                  <div className="sec-t">Recargas de mi red ({recargas.length})</div>
                  <button className="btn btn-g" onClick={cargar}><RefreshCw size={10}/> Actualizar</button>
                </div>
                {recargas.length===0?(
                  <div className="empty"><div className="empty-ico">💳</div><div className="empty-t">Sin recargas aún</div></div>
                ):(
                  <div className="tbl-wrap">
                    <table className="tbl">
                      <thead><tr><th>Distribuidor</th><th>Monto PX</th><th>%</th><th>Comisión PX</th><th>Estado</th><th>Fecha</th><th>Hora</th></tr></thead>
                      <tbody>{recargas.map(r=>(
                        <tr key={r.id}>
                          <td style={{color:"#fff",fontWeight:500}}>{r.distribuidor_nombre}</td>
                          <td style={{fontFamily:"'Oswald',sans-serif",color:"#8dc63f",fontWeight:700}}>{fmt(r.monto_px)} PX</td>
                          <td style={{color:"rgba(255,255,255,.35)"}}>{r.comision_porcentaje}%</td>
                          <td style={{color:"#f59e0b",fontFamily:"'Oswald',sans-serif",fontWeight:700}}>{fmt(r.comision_px)} PX</td>
                          <td><span className={`badge ${r.estado==="COMPLETADA"?"b-on":"b-off"}`}>{r.estado}</span></td>
                          <td style={{fontSize:10}}>{fmtFecha(r.created_at)}</td>
                          <td style={{fontSize:10,color:"rgba(255,255,255,.25)"}}>{fmtHora(r.created_at)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══ PAGOS PREMIO ══ */}
            {tab==="pagos_premio"&&(
              <div className="sec">
                <div className="sec-h">
                  <div className="sec-t">Pagos de premios ({pagosPremio.length})</div>
                  <button className="btn btn-g" onClick={cargar}><RefreshCw size={10}/> Actualizar</button>
                </div>
                {pagosPremio.length===0?(
                  <div className="empty"><div className="empty-ico">🏆</div><div className="empty-t">Sin pagos de premios</div><div className="empty-s">Aparecerán cuando tus distribuidores paguen premios</div></div>
                ):(
                  <div className="tbl-wrap">
                    <table className="tbl">
                      <thead><tr><th>Distribuidor</th><th>Monto PX</th><th>%</th><th>Comisión PX</th><th>Método</th><th>Estado</th><th>Fecha</th><th>Acción</th></tr></thead>
                      <tbody>{pagosPremio.map(p=>(
                        <tr key={p.id}>
                          <td style={{color:"#fff",fontWeight:500}}>{p.distribuidor_nombre}</td>
                          <td style={{fontFamily:"'Oswald',sans-serif",color:"#a855f7",fontWeight:700}}>{fmt(p.monto_px)} PX</td>
                          <td style={{color:"rgba(255,255,255,.35)"}}>{p.comision_pct}%</td>
                          <td style={{color:"#f59e0b",fontFamily:"'Oswald',sans-serif",fontWeight:700}}>{fmt(p.comision_px)} PX</td>
                          <td style={{fontSize:11}}>{p.metodo_pago}</td>
                          <td><span className={`badge ${p.estado==="VERIFICADO"?"b-on":p.estado==="RECHAZADO"?"b-off":"b-warn"}`}>{p.estado}</span></td>
                          <td style={{fontSize:10,color:"rgba(255,255,255,.25)"}}>{fmtFecha(p.created_at)}</td>
                          <td>{p.estado==="REGISTRADO"&&(
                            <button className="btn btn-info" onClick={()=>verificarPagoPremio(p.id)}>
                              <CheckCircle size={9}/> Verificar
                            </button>
                          )}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══ PEDIDOS ══ */}
            {tab==="pedidos"&&(
              <>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontSize:11,color:"rgba(255,255,255,.35)",letterSpacing:2,textTransform:"uppercase"}}>
                    Pedidos al admin ({pedidos.length})
                  </div>
                  <button className="btn btn-v" onClick={()=>setShowPedido(true)}>
                    <PlusCircle size={10}/> Nuevo pedido
                  </button>
                </div>
                {deudaTotal>0&&(
                  <div className="alert-deuda" style={{marginBottom:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <AlertTriangle size={14} style={{color:"#ef4444"}}/>
                      <div>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:700,color:"#ef4444"}}>Deuda total pendiente</div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>Saldo por cancelar al admin</div>
                      </div>
                    </div>
                    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:20,fontWeight:700,color:"#ef4444"}}>{fmt(deudaTotal)} PX</div>
                  </div>
                )}
                {pedidos.length===0?(
                  <div className="empty"><div className="empty-ico">📦</div><div className="empty-t">Sin pedidos aún</div><div className="empty-s">Crea un pedido de saldo PX o PINs al admin</div></div>
                ):(
                  pedidos.map(p=>(
                    <div key={p.id} className="ped-card">
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap"}}>
                          <span style={{fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:700,color:"#fff"}}>
                            {p.tipo==="SALDO_PX"?"Saldo PX":"PINs"} — {fmt(p.cantidad)} {p.tipo==="SALDO_PX"?"PX":"uds"}
                          </span>
                          <span className={`badge ${p.estado==="ENTREGADO"?"b-on":p.estado==="CANCELADO"?"b-off":"b-warn"}`}>{p.estado}</span>
                          <span className={`badge ${p.estado_pago==="CANCELADO"?"b-on":"b-off"}`}>{p.estado_pago==="CANCELADO"?"Pagado":"Deuda"}</span>
                        </div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,.25)"}}>
                          {fmtFecha(p.created_at)}{p.notas&&<span style={{marginLeft:8}}>· {p.notas}</span>}
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:8,color:"rgba(255,255,255,.2)",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>Deuda</div>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:17,fontWeight:700,color:p.estado_pago==="CANCELADO"?"#8dc63f":"#ef4444"}}>{fmt(Number(p.monto_deuda))} PX</div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* ══ COMISIONES ══ */}
            {tab==="comisiones"&&(
              <>
                <div className="sec">
                  <div className="sec-h">
                    <div className="sec-t">Comisiones acumuladas</div>
                    <button className="btn btn-g" onClick={cargar}><RefreshCw size={10}/> Actualizar</button>
                  </div>
                  {comisiones.length===0?(
                    <div className="empty"><div className="empty-ico">💰</div><div className="empty-t">Sin comisiones aún</div></div>
                  ):(
                    <div className="tbl-wrap">
                      <table className="tbl">
                        <thead><tr><th>Distribuidor</th><th>Acumulado</th><th>Pagado</th><th>Pendiente</th><th>Periodo</th></tr></thead>
                        <tbody>{comisiones.map((c:any)=>(
                          <tr key={c.id}>
                            <td style={{color:"#fff",fontWeight:500}}>{c.distribuidor_nombre}</td>
                            <td style={{fontFamily:"'Oswald',sans-serif"}}>{fmt(Number(c.total_acumulado))} PX</td>
                            <td style={{color:"#8dc63f",fontFamily:"'Oswald',sans-serif"}}>{fmt(Number(c.total_pagado))} PX</td>
                            <td style={{color:"#f59e0b",fontFamily:"'Oswald',sans-serif",fontWeight:700}}>{fmt(Number(c.pendiente))} PX</td>
                            <td><span className="badge b-info">{c.periodo}</span></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="sec">
                  <div className="sec-h"><div className="sec-t">Historial de pagos</div></div>
                  {pagos.length===0?(
                    <div className="empty"><div className="empty-ico">📄</div><div className="empty-t">Sin pagos registrados</div></div>
                  ):(
                    <div className="tbl-wrap">
                      <table className="tbl">
                        <thead><tr><th>Distribuidor</th><th>Monto</th><th>Periodo</th><th>Estado</th><th>Aprobación</th><th>Acción</th></tr></thead>
                        <tbody>{pagos.map((p:any)=>(
                          <tr key={p.id}>
                            <td style={{color:"#fff",fontWeight:500}}>{p.distribuidor_nombre}</td>
                            <td style={{fontFamily:"'Oswald',sans-serif",color:"#8dc63f",fontWeight:700}}>{fmt(Number(p.monto))} PX</td>
                            <td style={{fontSize:10,color:"rgba(255,255,255,.25)"}}>{fmtFecha(p.periodo_desde)} — {fmtFecha(p.periodo_hasta)}</td>
                            <td><span className={`badge ${p.estado==="PAGADO"?"b-on":p.estado==="APROBADO"?"b-info":"b-warn"}`}>{p.estado}</span></td>
                            <td style={{fontSize:10,color:"rgba(255,255,255,.25)"}}>{p.fecha_aprobacion?fmtFecha(p.fecha_aprobacion):"—"}</td>
                            <td>{p.estado==="PENDIENTE"&&(
                              <button className="btn btn-info" onClick={()=>aprobarPago(p.id)} disabled={aprobando===p.id}>
                                {aprobando===p.id?<Loader2 size={9} style={{animation:"spin 1s linear infinite"}}/>:<CheckCircle size={9}/>} Aprobar
                              </button>
                            )}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ══ MI CUENTA ══ */}
            {tab==="cuenta"&&promotor&&(
              <div className="sec">
                <div className="sec-h"><div className="sec-t">Mi cuenta</div></div>
                <div>
                  {[
                    {l:"Nombre",v:promotor.nombre},
                    {l:"Email",v:promotor.email,copy:true},
                    {l:"País",v:`${paisFlag[promotor.pais_codigo]||"🌎"} ${promotor.pais}`},
                    {l:"Código de país",v:promotor.pais_codigo},
                    ...(promotor.subdominio?[{l:"Subdominio",v:`${promotor.subdominio}.kicklast.com`}]:[]),
                    {l:"Estado",v:"badge"},
                    {l:"Saldo disponible",v:"saldo"},
                    {l:"Permisos",v:"permisos"},
                    {l:"Miembro desde",v:fmtFecha(promotor.created_at)},
                    {l:"Total distribuidores",v:String(distribuidores.length)},
                  ].map(f=>(
                    <div key={f.l} className="cr">
                      <span className="cl">{f.l}</span>
                      <span className="cv">
                        {f.v==="badge"&&<span className={`badge ${promotor.activo?"b-on":"b-off"}`}>{promotor.activo?"Activo":"Inactivo"}</span>}
                        {f.v==="saldo"&&<span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,color:"#8dc63f",fontSize:15}}>{fmt(promotor.balance_px)} PX</span>}
                        {f.v==="permisos"&&(
                          <div style={{display:"flex",gap:5}}>
                            {promotor.permite_emision_pines&&<span className="badge b-info">Emitir PINs</span>}
                            {promotor.permite_recarga_directa&&<span className="badge b-warn">Recarga directa</span>}
                            {!promotor.permite_emision_pines&&!promotor.permite_recarga_directa&&<span style={{color:"rgba(255,255,255,.25)",fontSize:11}}>Estándar</span>}
                          </div>
                        )}
                        {f.v!=="badge"&&f.v!=="saldo"&&f.v!=="permisos"&&(
                          <>
                            {f.v}
                            {(f as any).copy&&<button style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.2)",padding:0}} onClick={()=>copiar(f.v)}><Copy size={10}/></button>}
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ══ MODAL NUEVO DISTRIBUIDOR ══ */}
      {showModal&&(
        <div className="mo" onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
          <div className="md">
            <div className="mh">
              <span className="mh-t"><UserPlus size={14} style={{color:"#8dc63f"}}/> Nuevo Distribuidor</span>
              <button className="mh-c" onClick={()=>setShowModal(false)}><X size={15}/></button>
            </div>
            <div className="mb">
              <div className="fi"><div className="fl">Nombre completo</div><input className="fp" value={fNombre} onChange={e=>setFNombre(e.target.value)} placeholder="Ej: Juan Pérez"/></div>
              <div className="fi"><div className="fl">Email</div><input className="fp" type="email" value={fEmail} onChange={e=>setFEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
              <div className="fi"><div className="fl">Contraseña</div><input className="fp" type="password" value={fPassword} onChange={e=>setFPassword(e.target.value)} placeholder="Mínimo 8 caracteres"/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div className="fi"><div className="fl">País</div><input className="fp" value={fPais} onChange={e=>setFPais(e.target.value)}/></div>
                <div className="fi"><div className="fl">Cód. país</div><input className="fp" value={fPaisCod} onChange={e=>setFPaisCod(e.target.value)} placeholder="+57"/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div className="fi"><div className="fl">% Comisión recarga</div><input className="fp" type="number" min={0} max={100} value={fComRec} onChange={e=>setFComRec(e.target.value)}/></div>
                <div className="fi"><div className="fl">% Comisión premio</div><input className="fp" type="number" min={0} max={100} value={fComPrem} onChange={e=>setFComPrem(e.target.value)}/></div>
              </div>
              <div style={{fontSize:10,color:"rgba(245,158,11,.5)",lineHeight:1.6,background:"rgba(245,158,11,.04)",border:"1px solid rgba(245,158,11,.12)",borderRadius:6,padding:"8px 10px"}}>
                ⚠️ El distribuidor se creará vía backend. Asegúrate de que el servidor esté disponible.
              </div>
            </div>
            <div className="mf">
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowModal(false)}>Cancelar</button>
              <button className="btn btn-v" style={{flex:2}} onClick={crearDistribuidor} disabled={creando}>
                {creando?<><Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/> Creando...</>:<><UserPlus size={11}/> Crear distribuidor</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL FONDEAR ══ */}
      {showTransfer&&promotor&&(
        <div className="mo" onClick={e=>{if(e.target===e.currentTarget){setShowTransfer(false);setDistFound(null);setBusqueda("");}}}>
          <div className="md">
            <div className="mh">
              <span className="mh-t"><ArrowRightLeft size={14} style={{color:"#8dc63f"}}/> Fondear distribuidor</span>
              <button className="mh-c" onClick={()=>{setShowTransfer(false);setDistFound(null);setBusqueda("");}}><X size={15}/></button>
            </div>
            <div className="mb">
              {!distFound?(
                <>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginBottom:12}}>Busca por código, email o nombre</div>
                  <div className="search-wrap">
                    <input className="search-inp" value={busqueda} onChange={e=>setBusqueda(e.target.value)} onKeyDown={e=>e.key==="Enter"&&buscarDist()} placeholder="Código, email o nombre..."/>
                    <button style={{padding:"9px 14px",background:"#8dc63f",color:"#0a0d14",border:"none",borderRadius:7,fontFamily:"'Oswald',sans-serif",fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}} onClick={buscarDist} disabled={buscando}>
                      {buscando?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Search size={12}/>} Buscar
                    </button>
                  </div>
                  {busqErr&&<div style={{display:"flex",alignItems:"center",gap:7,padding:"9px 11px",background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.18)",borderRadius:7,fontSize:11,color:"#ef4444",marginBottom:10}}><AlertTriangle size={12}/>{busqErr}</div>}
                  <div style={{marginTop:10}}>
                    <div style={{fontSize:9,color:"rgba(255,255,255,.2)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>O selecciona de tu red</div>
                    {distribuidores.filter(d=>d.activo).map(d=>(
                      <div key={d.id} className="dist-item" onClick={()=>setDistFound(d)}>
                        <div>
                          <div style={{fontSize:12,color:"#fff",fontWeight:500}}>{d.nombre}</div>
                          <div style={{fontSize:10,color:"rgba(255,255,255,.25)"}}>{d.codigo_distribuidor||d.email}</div>
                        </div>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:"#38bdf8"}}>{fmt(d.balance_px)} PX</div>
                      </div>
                    ))}
                  </div>
                </>
              ):(
                <>
                  <div className="tbox-grid">
                    <div className="tbox tbox-p">
                      <div className="tbox-lbl" style={{color:"rgba(141,198,63,.5)"}}>Tu saldo</div>
                      <div className="tbox-nombre">{promotor.nombre}</div>
                      <div className="tbox-val" style={{color:"#8dc63f"}}>{fmt(promotor.balance_px)} PX</div>
                    </div>
                    <div className="tbox tbox-d">
                      <div className="tbox-lbl" style={{color:"rgba(56,189,248,.5)"}}>Destino</div>
                      <div className="tbox-nombre">{distFound.nombre}</div>
                      <div className="tbox-val" style={{color:"#38bdf8"}}>{fmt(distFound.balance_px)} PX</div>
                    </div>
                  </div>
                  <button style={{background:"none",border:"none",color:"rgba(255,255,255,.25)",cursor:"pointer",fontSize:11,marginBottom:12,display:"flex",alignItems:"center",gap:4}} onClick={()=>{setDistFound(null);setMonto("");setTransfErr("");}}>
                    ← Cambiar distribuidor
                  </button>
                  <div className="fi" style={{marginBottom:0}}>
                    <div className="fl">Monto a transferir (PX)</div>
                    <input className="fp" type="number" min="1" max={promotor.balance_px} value={monto} onChange={e=>{setMonto(e.target.value);setTransfErr("");}} placeholder={`Máx. ${fmt(promotor.balance_px)} PX`} autoFocus/>
                  </div>
                  {monto&&!isNaN(parseFloat(monto))&&parseFloat(monto)>0&&parseFloat(monto)<=promotor.balance_px&&(
                    <div style={{background:"rgba(141,198,63,.06)",border:"1px solid rgba(141,198,63,.15)",borderRadius:7,padding:"9px 13px",marginTop:10,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
                      <div><div style={{fontSize:8,color:"rgba(255,255,255,.25)",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>Tu saldo después</div><div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:"#8dc63f"}}>{fmt(promotor.balance_px-parseFloat(monto))} PX</div></div>
                      <ArrowRightLeft size={11} style={{color:"rgba(255,255,255,.15)"}}/>
                      <div style={{textAlign:"right"}}><div style={{fontSize:8,color:"rgba(255,255,255,.25)",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>{distFound.nombre.split(" ")[0]} después</div><div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:"#38bdf8"}}>{fmt(distFound.balance_px+parseFloat(monto))} PX</div></div>
                    </div>
                  )}
                  {transfErr&&<div style={{display:"flex",alignItems:"center",gap:7,padding:"9px 11px",background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.18)",borderRadius:7,fontSize:11,color:"#ef4444",marginTop:10}}><AlertTriangle size={12}/>{transfErr}</div>}
                </>
              )}
            </div>
            {distFound&&(
              <div className="mf">
                <button className="btn btn-g" style={{flex:1}} onClick={()=>{setShowTransfer(false);setDistFound(null);setBusqueda("");}}>Cancelar</button>
                <button className="btn btn-v" style={{flex:2}} onClick={ejecutarTransferencia} disabled={ejecutando||!monto||parseFloat(monto)<=0}>
                  {ejecutando?<><Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/> Procesando...</>:<><ArrowRightLeft size={11}/> Continuar</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ MODAL CONFIRMAR TRANSFERENCIA ══ */}
      {showConfirmTransfer&&distFound&&promotor&&(
        <div className="mo">
          <div className="md">
            <div className="mh"><span className="mh-t"><AlertTriangle size={14} style={{color:"#f59e0b"}}/> Confirmar transferencia</span></div>
            <div className="mb">
              <div style={{textAlign:"center",background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.18)",borderRadius:8,padding:"14px",marginBottom:14}}>
                <div style={{fontSize:9,color:"rgba(245,158,11,.5)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Monto a transferir</div>
                <div style={{fontFamily:"'Oswald',sans-serif",fontSize:30,fontWeight:700,color:"#f59e0b"}}>{fmt(parseFloat(monto))} PX</div>
              </div>
              {[
                {l:"De",v:promotor.nombre},
                {l:"Para",v:distFound.nombre},
                {l:"Código",v:distFound.codigo_distribuidor||"—"},
                {l:"Tu saldo después",v:`${fmt(promotor.balance_px-parseFloat(monto))} PX`,c:"#8dc63f"},
                {l:`${distFound.nombre.split(" ")[0]} después`,v:`${fmt(distFound.balance_px+parseFloat(monto))} PX`,c:"#38bdf8"},
              ].map(r=>(
                <div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,.04)",fontSize:12}}>
                  <span style={{color:"rgba(255,255,255,.3)"}}>{r.l}</span>
                  <span style={{color:(r as any).c||"#fff",fontWeight:600,fontFamily:"'Oswald',sans-serif"}}>{r.v}</span>
                </div>
              ))}
              <div style={{marginTop:12,padding:"9px 11px",background:"rgba(245,158,11,.04)",border:"1px solid rgba(245,158,11,.12)",borderRadius:6,fontSize:10,color:"rgba(245,158,11,.7)",lineHeight:1.5}}>
                ⚠️ Esta operación es irreversible. Verifica los datos antes de confirmar.
              </div>
            </div>
            <div className="mf">
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowConfirmTransfer(false)}>Cancelar</button>
              <button className="btn btn-v" style={{flex:2}} onClick={confirmarTransferencia} disabled={ejecutando}>
                {ejecutando?<><Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/> Transfiriendo...</>:<><CheckCircle size={11}/> Confirmar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL COMISIÓN ══ */}
      {showComision&&distSel&&(
        <div className="mo" onClick={e=>{if(e.target===e.currentTarget)setShowComision(false)}}>
          <div className="md">
            <div className="mh">
              <span className="mh-t"><TrendingUp size={14} style={{color:"#8dc63f"}}/> Comisión — {distSel.nombre}</span>
              <button className="mh-c" onClick={()=>setShowComision(false)}><X size={15}/></button>
            </div>
            <div className="mb">
              <div className="fi">
                <div className="fl">% Comisión por recarga</div>
                <input className="fp" type="number" min={0} max={100} step={0.5} value={eComRec} onChange={e=>setEComRec(e.target.value)}/>
                <div style={{fontSize:9,color:"rgba(255,255,255,.2)",marginTop:4}}>% que gana el distribuidor por cada recarga realizada</div>
              </div>
              <div className="fi">
                <div className="fl">% Comisión por pago de premio</div>
                <input className="fp" type="number" min={0} max={100} step={0.5} value={eComPrem} onChange={e=>setEComPrem(e.target.value)}/>
                <div style={{fontSize:9,color:"rgba(255,255,255,.2)",marginTop:4}}>% que gana el distribuidor al pagar un premio</div>
              </div>
              <div className="fi">
                <div className="fl">Fecha de vigencia</div>
                <input className="fp" type="date" value={eVigencia} onChange={e=>setEVigencia(e.target.value)}/>
              </div>
            </div>
            <div className="mf">
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowComision(false)}>Cancelar</button>
              <button className="btn btn-v" style={{flex:2}} onClick={guardarComision} disabled={guardCom}>
                {guardCom?<><Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/> Guardando...</>:<><CheckCircle size={11}/> Guardar comisión</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL PERMISOS ══ */}
      {showPermisos&&distSel&&(
        <div className="mo" onClick={e=>{if(e.target===e.currentTarget)setShowPermisos(false)}}>
          <div className="md">
            <div className="mh">
              <span className="mh-t"><Shield size={14} style={{color:"#8dc63f"}}/> Permisos — {distSel.nombre}</span>
              <button className="mh-c" onClick={()=>setShowPermisos(false)}><X size={15}/></button>
            </div>
            <div className="mb">
              <div style={{fontSize:11,color:"rgba(255,255,255,.25)",marginBottom:14,lineHeight:1.6,background:"rgba(255,255,255,.02)",borderRadius:6,padding:"10px 12px"}}>
                Activa o desactiva funciones para este distribuidor. Los cambios aplican de inmediato.
              </div>
              {[
                {v:pRecargaSaldo, s:setPRecargaSaldo, l:"Recarga de saldo PX", d:"Puede recargar PX a jugadores", dis:false},
                {v:pVentaPines,   s:setPVentaPines,   l:"Venta de PINs",       d:"Puede vender códigos PIN",    dis:false},
                {v:pRecargaDirecta, s:setPRecargaDirecta, l:"Recarga directa", d:"Solo el admin puede activar esta opción", dis:true},
              ].map(item=>(
                <div key={item.l} className="perm-row">
                  <div>
                    <div style={{fontSize:12,color:item.dis?"rgba(255,255,255,.2)":"rgba(255,255,255,.7)",fontWeight:500}}>{item.l}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,.2)",marginTop:2}}>{item.d}</div>
                  </div>
                  <button className={`toggle ${item.v?"on":"off"}`} onClick={()=>!item.dis&&item.s(!item.v)} disabled={item.dis}/>
                </div>
              ))}
            </div>
            <div className="mf">
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowPermisos(false)}>Cancelar</button>
              <button className="btn btn-v" style={{flex:2}} onClick={guardarPermisos} disabled={guardPerm}>
                {guardPerm?<><Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/> Guardando...</>:<><CheckCircle size={11}/> Guardar permisos</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL PEDIDO AL ADMIN ══ */}
      {showPedido&&(
        <div className="mo" onClick={e=>{if(e.target===e.currentTarget)setShowPedido(false)}}>
          <div className="md">
            <div className="mh">
              <span className="mh-t"><Package size={14} style={{color:"#8dc63f"}}/> Nuevo pedido al admin</span>
              <button className="mh-c" onClick={()=>setShowPedido(false)}><X size={15}/></button>
            </div>
            <div className="mb">
              <div className="fi">
                <div className="fl">Tipo de pedido</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {(["SALDO_PX","PINES"] as const).map(t=>(
                    <button key={t} onClick={()=>setTipoPed(t)} className="tipo-btn" style={{
                      border:`1px solid ${tipoPed===t?"rgba(141,198,63,.4)":"rgba(255,255,255,.07)"}`,
                      background:tipoPed===t?"rgba(141,198,63,.08)":"rgba(255,255,255,.02)",
                      color:tipoPed===t?"#8dc63f":"rgba(255,255,255,.4)",
                    }}>
                      <span style={{fontSize:22}}>{t==="SALDO_PX"?"💰":"🔑"}</span>
                      {t==="SALDO_PX"?"Saldo PX":"PINs"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="fi">
                <div className="fl">{tipoPed==="SALDO_PX"?"Cantidad en PX":"Cantidad de PINs"}</div>
                <input className="fp" type="number" min={1} value={cantPed} onChange={e=>setCantPed(e.target.value)} placeholder={tipoPed==="SALDO_PX"?"Ej: 10000":"Ej: 50"}/>
              </div>
              <div className="fi">
                <div className="fl">Monto de deuda (PX a pagar al admin)</div>
                <input className="fp" type="number" min={0} value={montoPed} onChange={e=>setMontoPed(e.target.value)} placeholder="Ej: 10000"/>
                <div style={{fontSize:9,color:"rgba(255,255,255,.2)",marginTop:4}}>Quedará registrado como deuda hasta que el admin la marque como pagada</div>
              </div>
              <div className="fi">
                <div className="fl">Notas (opcional)</div>
                <input className="fp" value={notasPed} onChange={e=>setNotasPed(e.target.value)} placeholder="Ej: Urgente para evento del sábado"/>
              </div>
            </div>
            <div className="mf">
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowPedido(false)}>Cancelar</button>
              <button className="btn btn-v" style={{flex:2}} onClick={crearPedido} disabled={creandoPed}>
                {creandoPed?<><Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/> Enviando...</>:<><Package size={11}/> Enviar pedido</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast&&<div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
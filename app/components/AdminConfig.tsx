"use client";
// ══════════════════════════════════════════════════════════════
//  AdminConfig.tsx — Tab Config del Panel Admin v2
//  Corregido: hooks fuera de map(), componentes separados
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  DollarSign, TrendingUp, Settings, RefreshCw,
  Save, Loader2, AlertTriangle, Globe
} from "lucide-react";

interface TasaCambio {
  id: string;
  pais_codigo: string;
  moneda: string;
  simbolo: string;
  tasa_usd: number;
}

interface LimiteComision {
  id: string;
  comision_recarga_min: number;
  comision_recarga_max: number;
  comision_premio_min: number;
  comision_premio_max: number;
  comision_retiro_min: number;
  comision_retiro_max: number;
  retiro_minimo_px: number;
}

const PAISES = [
  { codigo:"CO", nombre:"Colombia",   moneda:"COP" },
  { codigo:"MX", nombre:"México",     moneda:"MXN" },
  { codigo:"PE", nombre:"Perú",       moneda:"PEN" },
  { codigo:"EC", nombre:"Ecuador",    moneda:"USD" },
  { codigo:"AR", nombre:"Argentina",  moneda:"ARS" },
  { codigo:"CL", nombre:"Chile",      moneda:"CLP" },
  { codigo:"VE", nombre:"Venezuela",  moneda:"USD" },
  { codigo:"BO", nombre:"Bolivia",    moneda:"BOB" },
  { codigo:"PA", nombre:"Panamá",     moneda:"USD" },
  { codigo:"CR", nombre:"Costa Rica", moneda:"CRC" },
];

// ── Fila de tasa — componente separado para cumplir rules of hooks ──
function FilaTasa({ pais, tasa, guardando, onGuardar }: {
  pais: typeof PAISES[0];
  tasa: TasaCambio | undefined;
  guardando: string | null;
  onGuardar: (codigo: string, val: number) => void;
}) {
  const [val, setVal] = useState(String(tasa?.tasa_usd ?? 1));
  const cargando = guardando === `tasa_${pais.codigo}`;

  useEffect(() => {
    if (tasa) setVal(String(tasa.tasa_usd));
  }, [tasa]);

  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.05)",gap:12,flexWrap:"wrap" }}>
      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
        <span style={{ fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:700,color:"#fff",minWidth:24 }}>{pais.codigo}</span>
        <span style={{ fontSize:11,color:"rgba(255,255,255,.3)" }}>{pais.nombre}</span>
        <span style={{ fontSize:10,color:"rgba(56,189,248,.6)",background:"rgba(56,189,248,.08)",border:"1px solid rgba(56,189,248,.15)",borderRadius:3,padding:"1px 6px" }}>{pais.moneda}</span>
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
        <span style={{ fontSize:10,color:"rgba(255,255,255,.25)" }}>1 PX =</span>
        <input
          type="number" min="0" step="1"
          value={val}
          onChange={e => setVal(e.target.value)}
          style={{ background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:6,padding:"6px 10px",color:"#fff",fontSize:13,fontFamily:"'Oswald',sans-serif",fontWeight:700,width:100,outline:"none",textAlign:"right" }}
        />
        <span style={{ fontSize:11,color:"rgba(255,255,255,.3)",minWidth:30 }}>{pais.moneda}</span>
        <button
          onClick={() => onGuardar(pais.codigo, parseFloat(val))}
          disabled={cargando || !tasa}
          style={{ background:"rgba(141,198,63,.1)",border:"1px solid rgba(141,198,63,.2)",borderRadius:6,color:"#8dc63f",cursor:"pointer",padding:"6px 10px",display:"flex",alignItems:"center",gap:4,fontFamily:"'Oswald',sans-serif",fontSize:10,fontWeight:700,opacity:!tasa?0.3:1 }}
        >
          {cargando ? <Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/> : <Save size={11}/>}
        </button>
      </div>
    </div>
  );
}

// ── Campo editable — componente separado ──
function Campo({ label, value, onGuardar, tipo="text", sufijo="", cargando }: {
  label: string;
  value: string;
  onGuardar: (val: string) => void;
  tipo?: string;
  sufijo?: string;
  cargando: boolean;
}) {
  const [val, setVal] = useState(value);
  useEffect(() => { setVal(value); }, [value]);
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.05)",gap:12,flexWrap:"wrap" }}>
      <span style={{ fontSize:12,color:"rgba(255,255,255,.5)",flex:1 }}>{label}</span>
      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
        <input
          type={tipo} value={val} onChange={e => setVal(e.target.value)}
          style={{ background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:6,padding:"6px 10px",color:"#fff",fontSize:13,fontFamily:"'Oswald',sans-serif",fontWeight:700,width:100,outline:"none",textAlign:"right" }}
        />
        {sufijo && <span style={{ fontSize:11,color:"rgba(255,255,255,.3)" }}>{sufijo}</span>}
        <button onClick={() => onGuardar(val)} disabled={cargando}
          style={{ background:"rgba(141,198,63,.1)",border:"1px solid rgba(141,198,63,.2)",borderRadius:6,color:"#8dc63f",cursor:"pointer",padding:"6px 10px",display:"flex",alignItems:"center",gap:4,fontFamily:"'Oswald',sans-serif",fontSize:10,fontWeight:700 }}>
          {cargando ? <Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/> : <Save size={11}/>}
        </button>
      </div>
    </div>
  );
}

// ── Campo límite — componente separado ──
function CampoLimite({ label, value, campo, sufijo="%", min=0, max=100, onGuardar, cargando }: {
  label: string; value: number; campo: string; sufijo?: string;
  min?: number; max?: number;
  onGuardar: (campo: string, val: number) => void;
  cargando: boolean;
}) {
  const [val, setVal] = useState(String(value));
  useEffect(() => { setVal(String(value)); }, [value]);
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.05)",gap:12,flexWrap:"wrap" }}>
      <span style={{ fontSize:12,color:"rgba(255,255,255,.5)",flex:1 }}>{label}</span>
      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
        <input type="number" min={min} max={max} step="0.5" value={val} onChange={e => setVal(e.target.value)}
          style={{ background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:6,padding:"6px 10px",color:"#fff",fontSize:13,fontFamily:"'Oswald',sans-serif",fontWeight:700,width:80,outline:"none",textAlign:"right" }}
        />
        <span style={{ fontSize:11,color:"rgba(255,255,255,.3)" }}>{sufijo}</span>
        <button onClick={() => onGuardar(campo, parseFloat(val))} disabled={cargando}
          style={{ background:"rgba(141,198,63,.1)",border:"1px solid rgba(141,198,63,.2)",borderRadius:6,color:"#8dc63f",cursor:"pointer",padding:"6px 10px",display:"flex",alignItems:"center",gap:4,fontFamily:"'Oswald',sans-serif",fontSize:10,fontWeight:700 }}>
          {cargando ? <Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/> : <Save size={11}/>}
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function AdminConfig() {
  const [config,    setConfig]    = useState<Record<string,string>>({});
  const [tasas,     setTasas]     = useState<TasaCambio[]>([]);
  const [limites,   setLimites]   = useState<LimiteComision | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [toast,     setToast]     = useState<{msg:string;type:"ok"|"err"|"warn"}|null>(null);
  const [seccion,   setSeccion]   = useState<"economia"|"comisiones"|"juego"|"plataforma">("economia");

  const showToast = (msg: string, type: "ok"|"err"|"warn" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data: cfgs } = await supabase.from("platform_config").select("key,value");
      if (cfgs) {
        const map: Record<string,string> = {};
        cfgs.forEach((c: any) => { map[c.key] = c.value; });
        setConfig(map);
      }
      const { data: ts } = await supabase.from("tasas_cambio").select("*").order("pais_codigo");
      setTasas(ts ?? []);
      const { data: lim } = await supabase.from("config_comisiones").select("*").limit(1).maybeSingle();
      setLimites(lim ?? null);
    } catch (err) {
      console.error("[AdminConfig]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardarConfig = async (key: string, value: string) => {
    setGuardando(key);
    try {
      const { error } = await supabase.from("platform_config").upsert({ key, value }, { onConflict: "key" });
      if (error) throw error;
      setConfig(prev => ({ ...prev, [key]: value }));
      showToast("Guardado", "ok");
    } catch (err: any) {
      showToast(err.message ?? "Error", "err");
    } finally { setGuardando(null); }
  };

  const guardarTasa = async (pais_codigo: string, tasa_usd: number) => {
    setGuardando(`tasa_${pais_codigo}`);
    try {
      const { error } = await supabase.from("tasas_cambio")
        .update({ tasa_usd, updated_at: new Date().toISOString() })
        .eq("pais_codigo", pais_codigo);
      if (error) throw error;
      setTasas(prev => prev.map(t => t.pais_codigo === pais_codigo ? { ...t, tasa_usd } : t));
      showToast(`Tasa ${pais_codigo} actualizada`, "ok");
    } catch (err: any) {
      showToast(err.message ?? "Error", "err");
    } finally { setGuardando(null); }
  };

  const guardarLimites = async (campo: string, valor: number) => {
    setGuardando(`limite_${campo}`);
    try {
      if (limites) {
        const { error } = await supabase.from("config_comisiones")
          .update({ [campo]: valor, updated_at: new Date().toISOString() }).eq("id", limites.id);
        if (error) throw error;
        setLimites(prev => prev ? { ...prev, [campo]: valor } : null);
      } else {
        const { data, error } = await supabase.from("config_comisiones").insert({ [campo]: valor }).select().single();
        if (error) throw error;
        setLimites(data);
      }
      showToast("Límite actualizado", "ok");
    } catch (err: any) {
      showToast(err.message ?? "Error", "err");
    } finally { setGuardando(null); }
  };

  if (loading) return (
    <div style={{ display:"flex",justifyContent:"center",padding:40 }}>
      <Loader2 size={24} style={{ color:"#8dc63f",animation:"spin 1s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const secBtns = [
    { id:"economia",   label:"Economía",   icon:<DollarSign size={12}/> },
    { id:"comisiones", label:"Comisiones", icon:<TrendingUp size={12}/> },
    { id:"juego",      label:"Juego",      icon:<Settings size={12}/> },
    { id:"plataforma", label:"Plataforma", icon:<Globe size={12}/> },
  ] as const;

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Selector sección */}
      <div style={{ display:"flex",gap:4,marginBottom:16,flexWrap:"wrap" }}>
        {secBtns.map(s => (
          <button key={s.id} onClick={() => setSeccion(s.id)}
            style={{ padding:"7px 14px",border:"none",borderRadius:7,cursor:"pointer",fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:700,letterSpacing:".5px",display:"flex",alignItems:"center",gap:5,transition:"all .15s",background:seccion===s.id?"#8dc63f":"rgba(255,255,255,.06)",color:seccion===s.id?"#0a0d14":"rgba(255,255,255,.4)" }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ── ECONOMÍA ── */}
      {seccion==="economia" && <>
        <div style={{ background:"#111827",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,overflow:"hidden",marginBottom:14 }}>
          <div style={{ padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,.05)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <div style={{ fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:600,color:"#fff",display:"flex",alignItems:"center",gap:7 }}>
              <Globe size={13}/> Tasas de cambio (1 PX = X moneda local)
            </div>
            <button onClick={cargar} style={{ background:"rgba(255,255,255,.05)",border:"none",borderRadius:6,color:"rgba(255,255,255,.4)",cursor:"pointer",padding:"5px 10px",fontFamily:"'Oswald',sans-serif",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",gap:4 }}>
              <RefreshCw size={10}/> Actualizar
            </button>
          </div>
          <div style={{ padding:"0 16px" }}>
            {PAISES.map(p => (
              <FilaTasa key={p.codigo} pais={p} tasa={tasas.find(t => t.pais_codigo === p.codigo)} guardando={guardando} onGuardar={guardarTasa}/>
            ))}
          </div>
        </div>

        <div style={{ background:"#111827",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,overflow:"hidden",marginBottom:14 }}>
          <div style={{ padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,.05)" }}>
            <div style={{ fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:600,color:"#fff",display:"flex",alignItems:"center",gap:7 }}>
              <DollarSign size={13}/> Configuración de retiros
            </div>
          </div>
          <div style={{ padding:"0 16px" }}>
            <Campo label="Comisión de retiro (%)" value={config["commission_withdrawal"]??""} onGuardar={v=>guardarConfig("commission_withdrawal",v)} tipo="number" sufijo="%" cargando={guardando==="commission_withdrawal"}/>
            <Campo label="Máx. retiros por día" value={config["max_withdrawal_daily"]??""} onGuardar={v=>guardarConfig("max_withdrawal_daily",v)} tipo="number" sufijo="retiros" cargando={guardando==="max_withdrawal_daily"}/>
            <Campo label="Mínimo retiro Colombia" value={config["min_withdrawal_CO"]??""} onGuardar={v=>guardarConfig("min_withdrawal_CO",v)} tipo="number" sufijo="PX" cargando={guardando==="min_withdrawal_CO"}/>
            <Campo label="Mínimo retiro México" value={config["min_withdrawal_MX"]??""} onGuardar={v=>guardarConfig("min_withdrawal_MX",v)} tipo="number" sufijo="PX" cargando={guardando==="min_withdrawal_MX"}/>
            <Campo label="Mínimo retiro Perú" value={config["min_withdrawal_PE"]??""} onGuardar={v=>guardarConfig("min_withdrawal_PE",v)} tipo="number" sufijo="PX" cargando={guardando==="min_withdrawal_PE"}/>
            <Campo label="Mínimo retiro Ecuador" value={config["min_withdrawal_EC"]??""} onGuardar={v=>guardarConfig("min_withdrawal_EC",v)} tipo="number" sufijo="PX" cargando={guardando==="min_withdrawal_EC"}/>
            <Campo label="Mínimo retiro Argentina" value={config["min_withdrawal_AR"]??""} onGuardar={v=>guardarConfig("min_withdrawal_AR",v)} tipo="number" sufijo="PX" cargando={guardando==="min_withdrawal_AR"}/>
          </div>
        </div>
      </>}

      {/* ── COMISIONES ── */}
      {seccion==="comisiones" && (
        <div style={{ background:"#111827",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,overflow:"hidden",marginBottom:14 }}>
          <div style={{ padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,.05)" }}>
            <div style={{ fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:600,color:"#fff",display:"flex",alignItems:"center",gap:7 }}>
              <TrendingUp size={13}/> Límites de comisiones para distribuidores
            </div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,.25)",marginTop:4 }}>Los promotores no pueden configurar comisiones fuera de estos rangos</div>
          </div>
          <div style={{ padding:"0 16px" }}>
            <div style={{ padding:"10px 0",fontSize:10,color:"rgba(141,198,63,.6)",letterSpacing:1,textTransform:"uppercase",fontFamily:"'Oswald',sans-serif",fontWeight:700 }}>Comisión por recarga</div>
            <CampoLimite label="Mínimo comisión recarga" value={limites?.comision_recarga_min??1} campo="comision_recarga_min" onGuardar={guardarLimites} cargando={guardando==="limite_comision_recarga_min"}/>
            <CampoLimite label="Máximo comisión recarga" value={limites?.comision_recarga_max??20} campo="comision_recarga_max" onGuardar={guardarLimites} cargando={guardando==="limite_comision_recarga_max"}/>
            <div style={{ padding:"10px 0",fontSize:10,color:"rgba(168,85,247,.6)",letterSpacing:1,textTransform:"uppercase",fontFamily:"'Oswald',sans-serif",fontWeight:700,marginTop:8 }}>Comisión por pago de premio</div>
            <CampoLimite label="Mínimo comisión premio" value={limites?.comision_premio_min??1} campo="comision_premio_min" onGuardar={guardarLimites} cargando={guardando==="limite_comision_premio_min"}/>
            <CampoLimite label="Máximo comisión premio" value={limites?.comision_premio_max??15} campo="comision_premio_max" onGuardar={guardarLimites} cargando={guardando==="limite_comision_premio_max"}/>
            <div style={{ padding:"10px 0",fontSize:10,color:"rgba(245,158,11,.6)",letterSpacing:1,textTransform:"uppercase",fontFamily:"'Oswald',sans-serif",fontWeight:700,marginTop:8 }}>Retiro mínimo</div>
            <CampoLimite label="Mínimo PX para retirar" value={limites?.retiro_minimo_px??10} campo="retiro_minimo_px" sufijo="PX" min={1} max={1000} onGuardar={guardarLimites} cargando={guardando==="limite_retiro_minimo_px"}/>
          </div>
        </div>
      )}

      {/* ── JUEGO ── */}
      {seccion==="juego" && (
        <div style={{ background:"#111827",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,overflow:"hidden",marginBottom:14 }}>
          <div style={{ padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,.05)" }}>
            <div style={{ fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:600,color:"#fff",display:"flex",alignItems:"center",gap:7 }}>
              <Settings size={13}/> Sistema de juego
            </div>
          </div>
          <div style={{ padding:"0 16px" }}>
            <Campo label="Tasa PX → USD (1 USD = X PX)" value={config["px_to_usd_rate"]??""} onGuardar={v=>guardarConfig("px_to_usd_rate",v)} tipo="number" sufijo="PX" cargando={guardando==="px_to_usd_rate"}/>
            <Campo label="Comisión por referido (%)" value={config["commission_referral"]??""} onGuardar={v=>guardarConfig("commission_referral",v)} tipo="number" sufijo="%" cargando={guardando==="commission_referral"}/>
            <Campo label="Tipo bonus referido" value={config["referral_bonus_type"]??""} onGuardar={v=>guardarConfig("referral_bonus_type",v)} cargando={guardando==="referral_bonus_type"}/>
            <Campo label="Valor bonus referido" value={config["referral_bonus_value"]??""} onGuardar={v=>guardarConfig("referral_bonus_value",v)} tipo="number" cargando={guardando==="referral_bonus_value"}/>
            <Campo label="Auto aprobar retiros (0=no)" value={config["auto_approve_threshold"]??""} onGuardar={v=>guardarConfig("auto_approve_threshold",v)} tipo="number" sufijo="PX" cargando={guardando==="auto_approve_threshold"}/>
          </div>
        </div>
      )}

      {/* ── PLATAFORMA ── */}
      {seccion==="plataforma" && <>
        <div style={{ background:"#111827",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,overflow:"hidden",marginBottom:14 }}>
          <div style={{ padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,.05)" }}>
            <div style={{ fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:600,color:"#fff",display:"flex",alignItems:"center",gap:7 }}>
              <Globe size={13}/> Monedas por país
            </div>
          </div>
          <div style={{ padding:"0 16px" }}>
            {PAISES.map(p => (
              <Campo key={p.codigo} label={`Moneda ${p.nombre}`} value={config[`platform_currency_${p.codigo}`]??""} onGuardar={v=>guardarConfig(`platform_currency_${p.codigo}`,v)} cargando={guardando===`platform_currency_${p.codigo}`}/>
            ))}
          </div>
        </div>
        <div style={{ background:"rgba(56,189,248,.05)",border:"1px solid rgba(56,189,248,.15)",borderRadius:8,padding:"12px 14px" }}>
          <div style={{ fontSize:11,color:"rgba(56,189,248,.7)",lineHeight:1.6,display:"flex",alignItems:"flex-start",gap:8 }}>
            <AlertTriangle size={13} style={{ flexShrink:0,marginTop:1 }}/>
            Los cambios aplican inmediatamente para nuevas solicitudes. Las existentes mantienen la tasa original.
          </div>
        </div>
      </>}

      {toast && (
        <div style={{ position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",padding:"10px 20px",borderRadius:8,fontSize:13,fontWeight:500,zIndex:999,background:toast.type==="ok"?"#8dc63f":toast.type==="err"?"#ef4444":"#f59e0b",color:toast.type==="ok"?"#0a0d14":"#fff" }}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
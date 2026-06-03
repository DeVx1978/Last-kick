"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  FileText, CreditCard, CheckCircle, AlertTriangle,
  Save, Loader2, ChevronDown
} from "lucide-react";

interface PerfilExtendidoProps {
  userId: string;
}

interface DatosPerfil {
  tipo_documento: string;
  numero_documento: string;
  fecha_nacimiento: string;
  telefono: string;
  banco: string;
  numero_cuenta: string;
  tipo_cuenta: string;
  titular_cuenta: string;
  perfil_completo: boolean;
}

const TIPOS_DOC = ["CEDULA","PASAPORTE","RUT","DNI","CURP","OTRO"];
const TIPOS_CUENTA = ["AHORROS","CORRIENTE"];
const BANCOS_CO = [
  "Bancolombia","Davivienda","BBVA","Banco de Bogotá","Nequi",
  "Daviplata","Banco Popular","Colpatria","Occidente","Otro"
];

export default function PerfilExtendido({ userId }: PerfilExtendidoProps) {
  const [datos,     setDatos]     = useState<DatosPerfil>({
    tipo_documento:   "CEDULA",
    numero_documento: "",
    fecha_nacimiento: "",
    telefono:         "",
    banco:            "",
    numero_cuenta:    "",
    tipo_cuenta:      "AHORROS",
    titular_cuenta:   "",
    perfil_completo:  false,
  });
  const [loading,   setLoading]   = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [toast,     setToast]     = useState<{msg:string;type:"ok"|"err"|"warn"}|null>(null);
  const [existe,    setExiste]    = useState(false);

  const showToast = (msg:string, type:"ok"|"err"|"warn"="ok") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 3500);
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("perfiles_jugador")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setExiste(true);
        setDatos({
          tipo_documento:   data.tipo_documento   ?? "CEDULA",
          numero_documento: data.numero_documento ?? "",
          fecha_nacimiento: data.fecha_nacimiento ?? "",
          telefono:         data.telefono         ?? "",
          banco:            data.banco            ?? "",
          numero_cuenta:    data.numero_cuenta    ?? "",
          tipo_cuenta:      data.tipo_cuenta      ?? "AHORROS",
          titular_cuenta:   data.titular_cuenta   ?? "",
          perfil_completo:  data.perfil_completo  ?? false,
        });
      }
    } catch (err) {
      console.error("[PerfilExtendido]", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (!datos.numero_documento.trim()) {
      showToast("El número de documento es obligatorio","warn"); return;
    }
    setGuardando(true);
    try {
      const completo = !!(
        datos.numero_documento &&
        datos.fecha_nacimiento &&
        datos.banco &&
        datos.numero_cuenta &&
        datos.titular_cuenta
      );

      const payload = {
        user_id:          userId,
        tipo_documento:   datos.tipo_documento,
        numero_documento: datos.numero_documento.trim(),
        fecha_nacimiento: datos.fecha_nacimiento || null,
        telefono:         datos.telefono.trim() || null,
        banco:            datos.banco.trim() || null,
        numero_cuenta:    datos.numero_cuenta.trim() || null,
        tipo_cuenta:      datos.tipo_cuenta,
        titular_cuenta:   datos.titular_cuenta.trim() || null,
        perfil_completo:  completo,
        updated_at:       new Date().toISOString(),
      };

      let error;
      if (existe) {
        ({ error } = await supabase
          .from("perfiles_jugador")
          .update(payload)
          .eq("user_id", userId));
      } else {
        ({ error } = await supabase
          .from("perfiles_jugador")
          .insert(payload));
        if (!error) setExiste(true);
      }

      if (error) throw error;
      setDatos(prev => ({ ...prev, perfil_completo: completo }));
      showToast(completo ? "¡Perfil completo guardado!" : "Datos guardados correctamente","ok");
    } catch (err:any) {
      showToast(err.message ?? "Error al guardar","err");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return (
    <div style={{display:"flex",justifyContent:"center",padding:16}}>
      <Loader2 size={18} style={{color:"#8dc63f",animation:"spin 1s linear infinite"}}/>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .pe-panel{background:#111827;border:1px solid rgba(255,255,255,.07);border-radius:10px;overflow:hidden;margin-top:14px;width:100%;}
        .pe-head{padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;}
        .pe-title{font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;color:#fff;letter-spacing:.5px;display:flex;align-items:center;gap:7px;}
        .pe-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:4px;font-family:'Oswald',sans-serif;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;}
        .pe-badge.ok{background:rgba(141,198,63,.1);color:#8dc63f;border:1px solid rgba(141,198,63,.2);}
        .pe-badge.pend{background:rgba(245,158,11,.1);color:#f59e0b;border:1px solid rgba(245,158,11,.2);}
        .pe-body{padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;}
        @media(max-width:500px){.pe-body{grid-template-columns:1fr;}}
        .pe-field{display:flex;flex-direction:column;gap:4px;}
        .pe-label{font-size:9px;color:rgba(255,255,255,.3);letter-spacing:1px;text-transform:uppercase;}
        .pe-input{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:6px;padding:7px 10px;color:#fff;font-size:12px;outline:none;transition:border-color .15s;width:100%;}
        .pe-input:focus{border-color:rgba(141,198,63,.4);}
        .pe-select{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:6px;padding:7px 10px;color:#fff;font-size:12px;outline:none;width:100%;appearance:none;cursor:pointer;}
        .pe-select option{background:#111827;color:#fff;}
        .pe-footer{padding:0 12px 12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;}
        .pe-info{font-size:10px;color:rgba(255,255,255,.25);display:flex;align-items:center;gap:5px;}
        .pe-btn{padding:7px 16px;border:none;border-radius:6px;cursor:pointer;font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;transition:all .2s;display:inline-flex;align-items:center;gap:6px;background:#8dc63f;color:#0a0d14;}
        .pe-btn:hover{background:#7ab52f;}
        .pe-btn:disabled{opacity:.5;cursor:not-allowed;}
        .pe-section{grid-column:1/-1;font-family:'Oswald',sans-serif;font-size:9px;font-weight:600;color:rgba(255,255,255,.2);letter-spacing:2px;text-transform:uppercase;padding-bottom:3px;border-bottom:1px solid rgba(255,255,255,.05);}
        .pe-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:8px;font-size:13px;font-weight:500;z-index:999;white-space:nowrap;}
        .pe-toast.ok{background:#8dc63f;color:#0a0d14;}
        .pe-toast.err{background:#ef4444;color:#fff;}
        .pe-toast.warn{background:#f59e0b;color:#0a0d14;}
      `}</style>

      <div className="pe-panel">
        <div className="pe-head">
          <div className="pe-title">
            <FileText size={12}/> Datos de identificación y pago
          </div>
          <span className={`pe-badge ${datos.perfil_completo ? "ok" : "pend"}`}>
            {datos.perfil_completo
              ? <><CheckCircle size={9}/> Perfil completo</>
              : <><AlertTriangle size={9}/> Datos pendientes</>
            }
          </span>
        </div>

        <div className="pe-body">
          <div className="pe-section">Identificación</div>

          <div className="pe-field">
            <label className="pe-label">Tipo de documento</label>
            <select className="pe-select" value={datos.tipo_documento}
              onChange={e=>setDatos(p=>({...p,tipo_documento:e.target.value}))}>
              {TIPOS_DOC.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="pe-field">
            <label className="pe-label">Número de documento *</label>
            <input className="pe-input" value={datos.numero_documento}
              onChange={e=>setDatos(p=>({...p,numero_documento:e.target.value}))}
              placeholder="Ej: 1234567890"/>
          </div>

          <div className="pe-field">
            <label className="pe-label">Fecha de nacimiento</label>
            <input className="pe-input" type="date" value={datos.fecha_nacimiento}
              onChange={e=>setDatos(p=>({...p,fecha_nacimiento:e.target.value}))}/>
          </div>

          <div className="pe-field">
            <label className="pe-label">Teléfono</label>
            <input className="pe-input" value={datos.telefono}
              onChange={e=>setDatos(p=>({...p,telefono:e.target.value}))}
              placeholder="Ej: 3001234567"/>
          </div>

          <div className="pe-section">Datos bancarios para recibir premios</div>

          <div className="pe-field">
            <label className="pe-label">Banco</label>
            <select className="pe-select" value={datos.banco}
              onChange={e=>setDatos(p=>({...p,banco:e.target.value}))}>
              <option value="">Selecciona tu banco</option>
              {BANCOS_CO.map(b=><option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="pe-field">
            <label className="pe-label">Tipo de cuenta</label>
            <select className="pe-select" value={datos.tipo_cuenta}
              onChange={e=>setDatos(p=>({...p,tipo_cuenta:e.target.value}))}>
              {TIPOS_CUENTA.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="pe-field">
            <label className="pe-label">Número de cuenta</label>
            <input className="pe-input" value={datos.numero_cuenta}
              onChange={e=>setDatos(p=>({...p,numero_cuenta:e.target.value}))}
              placeholder="Número de cuenta bancaria"/>
          </div>

          <div className="pe-field">
            <label className="pe-label">Titular de la cuenta</label>
            <input className="pe-input" value={datos.titular_cuenta}
              onChange={e=>setDatos(p=>({...p,titular_cuenta:e.target.value}))}
              placeholder="Nombre como aparece en la cuenta"/>
          </div>
        </div>

        <div className="pe-footer">
          <div className="pe-info">
            <AlertTriangle size={10}/> Los datos bancarios solo se usan para pago de premios
          </div>
          <button className="pe-btn" onClick={guardar} disabled={guardando}>
            {guardando
              ? <><Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/> Guardando...</>
              : <><Save size={11}/> Guardar datos</>
            }
          </button>
        </div>
      </div>

      {toast && <div className={`pe-toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
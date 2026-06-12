"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminConfig from '@/app/components/AdminConfig';
import {
  LayoutDashboard, Trophy, Plus, CheckCircle, Users,
  Wallet, Settings, LogOut, Menu, X, Activity,
  ChevronRight, ChevronDown, AlertTriangle,
  Shield, TrendingUp, DollarSign,
  RefreshCw, Eye, Ban, Check, Gift, Zap, Star,
  Target, Lock, Unlock, UserPlus, EyeOff,
  CreditCard, Loader2, Trash2, Upload, FileText,
  Key, Globe, Search, Edit2, Award, Package, QrCode
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Torneo {
  id: string; name: string; slug: string; status: string;
  created_at: string; tipo_evento: string; costo_px: number;
  vidas_base: number; vidas_bonus: number; premio_px: number;
  bonus_activo: boolean; bonus_px: number; bonus_descripcion: string;
  bonus_expira_en: string; bonus_tipo: string; es_vip: boolean;
  fecha_inicio: string; fecha_cierre: string; descripcion: string;
  featured: boolean; sort_order: number;
}
interface Partido {
  id: string; home_team: string; away_team: string;
  match_date: string; status: string; tournament_id: string | null;
  city: string; stadium: string; cuota_1: number;
  cuota_x: number; cuota_2: number; phase: string;
  home_flag: string; away_flag: string;
  costo_px: number; premio_px: number; match_number: number;
tipo_evento: string;
  home_score?: number;
  away_score?: number;
  result?: string;
}
interface Retiro {
  id: string; user_id: string; creditos_solicitados: number;
  monto_local: number; moneda: string; metodo_pago: string;
  nombre_beneficiario: string; numero_cuenta: string; numero_documento?: string;
  banco: string; tipo_cuenta: string;
  estado: string; created_at: string;
  notas_admin?: string; motivo_rechazo?: string; revisado_en?: string; pagado_en?: string;
}
interface Usuario {
  id: string; username: string; email: string;
  lives: number; pitchx_balance: number; status: string;
  country: string; created_at: string; role: string;
}
type Tab = 'dashboard' | 'torneos' | 'partidos' | 'combinadas' | 'vip' | 'retiros' | 'pedidos' | 'codigos' | 'usuarios' | 'inscripciones' | 'distribuidores' | 'pins' | 'tasas' | 'promotores' | 'red_comercial' | 'config';
interface Distribuidor {
  id: string; promotor_id: string; nombre: string; email: string;
  pais: string; telefono: string; activo: boolean;
  comision_recarga_pct: number; comision_premio_pct: number;
  created_at: string; balance_px?: number;
  permite_recarga_saldo?: boolean; permite_emision_pin?: boolean;
}
interface Promotor {
  id: string; nombre: string; email: string;
  pais: string; activo: boolean; created_at: string;
  acepta_terminos?: boolean; balance_px?: number;
  permite_recarga_saldo?: boolean; permite_emision_pin?: boolean;
}
interface RecargaDistribuidor {
  id: string; distribuidor_id: string;
  monto_px: number; comision_px: number;
  comision_porcentaje: number; estado: string; created_at: string;
}
interface CodigoPin {
  id: string; codigo: string; vidas: number; creditos: number;
  estado: string; lote_id: string; expira_en: string; created_at: string;
}
interface TasaCambio {
  id: string; pais_codigo: string; moneda: string;
  simbolo: string; tasa_usd: number; updated_at: string;
}
interface PedidoPromotor {
  id: string; promotor_id: string; tipo: string;
  cantidad: number; monto_deuda: number; estado: string;
  estado_pago: string; notas?: string; created_at: string;
  promotor_nombre?: string;
}
interface PerfilBasic { username?: string; email?: string; }
interface Inscripcion {
  id: string; user_id: string; tournament_id: string;
  vidas: number; vidas_iniciales: number; status: string;
  nivel_ingreso: number; fecha_ingreso: string;
  profiles?: PerfilBasic | null;
}
interface AdminStats {
  total_recargas?: number; total_px?: number;
  total_comisiones?: number; total_promotores?: number;
  total_distribuidores?: number; total_usuarios?: number;
  usuarios_activos?: number; pozo_global?: number;
}
interface NuevoPartidoForm {
  tournament_id: string; home_team: string; away_team: string;
  home_flag: string; away_flag: string; match_date: string;
  stadium: string; city: string; match_number: number;
  cuota_1: string | number; cuota_x: string | number; cuota_2: string | number;
  phase: string; costo_px: number; premio_px: number; es_individual: boolean;
  apuestas_activas: boolean;
}
interface NuevoDistribuidorForm {
  promotor_id: string; nombre: string; email: string;
  pais: string; telefono: string; comision_recarga_pct: number;
  comision_premio_pct: number; permite_recarga_saldo: boolean; permite_emision_pin: boolean;
}
interface NuevaTasaForm {
  pais_codigo: string; moneda: string; simbolo: string; tasa_usd: number | string;
}

/* ══════════════════════════════════════════════════════════════
   CODIGOS DE GANANCIA
══════════════════════════════════════════════════════════════ */
function TabCodigosGanancia() {
  const [codigos, setCodigos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('ACTIVO');
  const [toast, setToast] = useState<{msg:string;type:"ok"|"err"}|null>(null);
  const showToast = (msg:string, type:"ok"|"err"="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };
  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase.from('codigos_ganancia').select('*, profiles:jugador_id(username, email)').order('created_at', { ascending: false });
    setCodigos(data ?? []); setLoading(false);
  };
  useEffect(() => { cargar(); }, []);
  const cancelarCodigo = async (id: string) => {
    if (!confirm('¿Cancelar este código?')) return;
    const { error } = await supabase.from('codigos_ganancia').update({ estado: 'CANCELADO' }).eq('id', id);
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Código cancelado', 'ok'); cargar();
  };
  const filtrados = filtro === 'TODOS' ? codigos : codigos.filter(c => c.estado === filtro);
  const fmt = (n: number) => Number(n).toLocaleString('es-CO');
  return (
    <>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        {[{l:'Activos',v:codigos.filter(c=>c.estado==='ACTIVO').length,c:'#8dc63f'},{l:'Usados',v:codigos.filter(c=>c.estado==='USADO').length,c:'#38bdf8'},{l:'Expirados',v:codigos.filter(c=>c.estado==='EXPIRADO').length,c:'#f59e0b'},{l:'Cancelados',v:codigos.filter(c=>c.estado==='CANCELADO').length,c:'#ef4444'}].map(s=>(
          <div key={s.l} style={{background:'#111827',border:'1px solid rgba(255,255,255,.07)',borderRadius:10,padding:14}}>
            <div style={{fontSize:9,color:'rgba(255,255,255,.25)',letterSpacing:1.5,textTransform:'uppercase',marginBottom:6}}>{s.l}</div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
          </div>
        ))}
      </div>
      <div className="filtro-tabs">
        {['ACTIVO','USADO','EXPIRADO','CANCELADO','TODOS'].map(e=>(
          <button key={e} className={`filtro-tab ${filtro===e?'on':''}`} onClick={()=>setFiltro(e)}>
            {e} <span style={{opacity:.6}}>({e==='TODOS'?codigos.length:codigos.filter(c=>c.estado===e).length})</span>
          </button>
        ))}
      </div>
      <div style={{background:'#111827',border:'1px solid rgba(255,255,255,.07)',borderRadius:10,overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          {loading ? <div style={{textAlign:'center',padding:40}}><Loader2 size={24} style={{color:'#8dc63f',animation:'spin 1s linear infinite',margin:'0 auto',display:'block'}}/></div>
          : filtrados.length===0 ? <div style={{textAlign:'center',padding:32,color:'rgba(255,255,255,.2)',fontFamily:"'Oswald',sans-serif",fontSize:13}}>Sin códigos</div>
          : <table className="tbl">
              <thead><tr><th>Código</th><th>Jugador</th><th>País</th><th>Monto PX</th><th>Monto local</th><th>Estado</th><th>Vence</th><th>Acción</th></tr></thead>
              <tbody>{filtrados.map(c=>(
                <tr key={c.id}>
                  <td><span style={{fontFamily:'monospace',fontSize:12,color:'#8dc63f',background:'rgba(141,198,63,.08)',padding:'3px 7px',borderRadius:4,letterSpacing:1}}>{c.codigo}</span></td>
                  <td><div style={{color:'#fff',fontWeight:500,fontSize:12}}>{c.profiles?.username??'—'}</div><div style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>{c.profiles?.email??'—'}</div></td>
                  <td style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,color:'#38bdf8'}}>{c.pais_codigo}</td>
                  <td style={{fontFamily:"'Oswald',sans-serif",color:'#8dc63f',fontWeight:700}}>{fmt(c.monto_px)} PX</td>
                  <td style={{fontFamily:"'Oswald',sans-serif",color:'#fff',fontWeight:700}}>${fmt(c.monto_local)} {c.moneda}</td>
                  <td><span className={`badge ${c.estado==='ACTIVO'?'b-ok':c.estado==='USADO'?'b-info':c.estado==='CANCELADO'?'b-err':'b-warn'}`}>{c.estado}</span></td>
                  <td style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>{new Date(c.expira_en).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                  <td>{c.estado==='ACTIVO'&&(<button className="btn btn-r" style={{padding:'4px 8px',fontSize:9}} onClick={()=>cancelarCodigo(c.id)}><X size={10}/> Cancelar</button>)}</td>
                </tr>
              ))}</tbody>
            </table>}
        </div>
      </div>
      {toast&&<div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',padding:'10px 20px',borderRadius:8,fontSize:13,fontWeight:500,zIndex:999,background:toast.type==='ok'?'#8dc63f':'#ef4444',color:toast.type==='ok'?'#0a0d14':'#fff'}}>{toast.msg}</div>}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   PROMOTORES
══════════════════════════════════════════════════════════════ */
function TabPromotores() {
  const [promotores, setPromotores] = useState<Promotor[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{msg:string;type:"ok"|"err"|"warn"}|null>(null);
  const [showModal, setShowModal] = useState(false);
  const [fNombre, setFNombre] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPais, setFPais] = useState("EC");
  const [fPermiteRecarga, setFPermiteRecarga] = useState(true);
  const [fPermitePin, setFPermitePin] = useState(false);
  const [creando, setCreando] = useState(false);
  const showToast = (msg:string, type:"ok"|"err"|"warn"="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };
  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("promotores").select("*").order("created_at",{ascending:false});
    setPromotores((data as Promotor[]) ?? []); setLoading(false);
  },[]);
  useEffect(()=>{ cargar(); },[cargar]);
  const togglePromotor = async (id:string, activo:boolean) => {
    await supabase.from("promotores").update({activo:!activo}).eq("id",id);
    showToast(activo?"Desactivado":"Activado","ok"); await cargar();
  };
  const crearPromotor = async () => {
    if (!fNombre.trim()||!fEmail.trim()) { showToast("Nombre y email requeridos","warn"); return; }
    setCreando(true);
    try {
      const payload = { nombre:fNombre.trim(), email:fEmail.trim().toLowerCase(), pais:fPais.toUpperCase(), activo:true, acepta_terminos:false, balance_px: 0, permite_recarga_saldo: fPermiteRecarga, permite_emision_pin: fPermitePin };
      const { error } = await supabase.from("promotores").insert(payload);
      if (error) throw error;
      await supabase.from("profiles").update({role:"promotor"}).eq("email",fEmail.trim().toLowerCase());
      showToast(`Promotor ${fNombre} creado`,"ok");
      setShowModal(false); setFNombre(""); setFEmail(""); setFPais("EC"); await cargar();
    } catch(e:any){ showToast(e.message??"Error","err"); }
    finally { setCreando(false); }
  };
  return (
    <>
      <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,overflow:"hidden",marginBottom:14}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,.05)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:600,color:"#fff",display:"flex",alignItems:"center",gap:7}}><Shield size={13}/> Promotores ({promotores.length})</div>
          <button className="btn btn-g" onClick={()=>setShowModal(true)}><UserPlus size={11}/> Nuevo promotor</button>
        </div>
        <div style={{overflowX:"auto"}}>
          {loading ? <div style={{textAlign:"center",padding:40}}><Loader2 size={24} style={{color:"#8dc63f",animation:"spin 1s linear infinite",margin:"0 auto",display:"block"}}/></div>
          : promotores.length===0 ? <div style={{textAlign:"center",padding:40,color:"rgba(255,255,255,.2)"}}><Shield size={28} style={{margin:"0 auto 10px",display:"block",opacity:.3}}/><div style={{fontFamily:"'Oswald',sans-serif",fontSize:13}}>Sin promotores aún</div></div>
          : <table className="tbl"><thead><tr><th>Nombre</th><th>Email</th><th>País</th><th>Balance</th><th>Permisos</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>{promotores.map(p=>(
              <tr key={p.id}>
                <td style={{color:"#fff",fontWeight:500}}>{p.nombre}</td>
                <td style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>{p.email}</td>
                <td style={{fontFamily:"'Oswald',sans-serif",fontWeight:700}}>{p.pais}</td>
                <td style={{fontFamily:"'Oswald',sans-serif",color:"#38bdf8",fontWeight:700}}>{(p.balance_px ?? 0).toLocaleString()} PX</td>
                <td><div style={{display:'flex',gap:4}}>
                  {p.permite_recarga_saldo ? <span className="badge b-ok">SALDO</span> : <span className="badge" style={{background:'transparent',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.3)'}}>SALDO</span>}
                  {p.permite_emision_pin ? <span className="badge b-purple">PIN</span> : <span className="badge" style={{background:'transparent',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.3)'}}>PIN</span>}
                </div></td>
                <td><span className={`badge ${p.activo?"b-ok":"b-err"}`}>{p.activo?"Activo":"Inactivo"}</span></td>
                <td><button onClick={()=>togglePromotor(p.id,p.activo)} className={`btn ${p.activo?"btn-r":"btn-g"}`} style={{padding:"4px 10px",fontSize:9}}>{p.activo?<><EyeOff size={10}/> Desactivar</>:<><Eye size={10}/> Activar</>}</button></td>
              </tr>
            ))}</tbody></table>}
        </div>
      </div>
      {showModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
          <div style={{width:"100%",maxWidth:400,background:"#0f1420",border:"1px solid rgba(255,255,255,.1)",borderRadius:14,overflow:"hidden"}}>
            <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontFamily:"'Oswald',sans-serif",fontSize:15,fontWeight:700,color:"#fff"}}>Nuevo Promotor</span>
              <button style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",cursor:"pointer"}} onClick={()=>setShowModal(false)}><X size={16}/></button>
            </div>
            <div style={{padding:20,maxHeight:'70vh',overflowY:'auto'}}>
              <div style={{marginBottom:14}}><div style={{fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>Nombre</div><input type="text" className="inp" style={{marginBottom:0}} value={fNombre} onChange={e=>setFNombre(e.target.value)} placeholder="Nombre del promotor"/></div>
              <div style={{marginBottom:14}}><div style={{fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>Email</div><input type="email" className="inp" style={{marginBottom:0}} value={fEmail} onChange={e=>setFEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
              <div style={{marginBottom:14}}><div style={{fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>País (ISO)</div><input type="text" className="inp" style={{marginBottom:0}} value={fPais} onChange={e=>setFPais(e.target.value.toUpperCase())} placeholder="EC, CO, PE"/></div>
              <div style={{borderTop:'1px solid rgba(255,255,255,.05)',margin:'16px 0',paddingTop:16}}>
                <div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:600,color:"#8dc63f",marginBottom:12}}>PERMISOS</div>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                  <button className={`toggle ${fPermiteRecarga?'on':'off'}`} onClick={()=>setFPermiteRecarga(!fPermiteRecarga)}/>
                  <div><div style={{fontSize:12,color:'#fff'}}>Recarga de Saldo</div></div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <button className={`toggle ${fPermitePin?'on':'off'}`} onClick={()=>setFPermitePin(!fPermitePin)}/>
                  <div><div style={{fontSize:12,color:'#fff'}}>Emisión de PINs</div></div>
                </div>
              </div>
            </div>
            <div style={{padding:"0 20px 20px",display:"flex",gap:8}}>
              <button className="btn" style={{flex:1,background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)"}} onClick={()=>setShowModal(false)}>Cancelar</button>
              <button className="btn btn-g" style={{flex:2}} onClick={crearPromotor} disabled={creando}>{creando?<><Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/> Creando...</>:<><UserPlus size={12}/> Crear promotor</>}</button>
            </div>
          </div>
        </div>
      )}
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",padding:"10px 20px",borderRadius:8,fontSize:13,fontWeight:500,zIndex:999,background:toast.type==="ok"?"#8dc63f":toast.type==="err"?"#ef4444":"#f59e0b",color:toast.type==="ok"?"#0a0d14":"#fff"}}>{toast.msg}</div>}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   RED COMERCIAL
══════════════════════════════════════════════════════════════ */
function TabRedComercial() {
  const [recargas, setRecargas] = useState<RecargaDistribuidor[]>([]);
  const [promotores, setPromotores] = useState<Promotor[]>([]);
  const [distribuidores, setDistribuidores] = useState<Distribuidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({total_recargas:0,total_px:0,total_comisiones:0,total_promotores:0,total_distribuidores:0});
  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [r,p,d] = await Promise.all([
        supabase.from("recargas_distribuidor").select("*").order("created_at",{ascending:false}).limit(200),
        supabase.from("promotores").select("*"),
        supabase.from("distribuidores").select("*"),
      ]);
      const recs = (r.data as RecargaDistribuidor[]) ?? [];
      const proms = (p.data as Promotor[]) ?? [];
      const dists = (d.data as Distribuidor[]) ?? [];
      setRecargas(recs); setPromotores(proms); setDistribuidores(dists);
      setStats({ total_recargas: recs.length, total_px: recs.reduce((a,x)=>a+x.monto_px,0), total_comisiones: recs.reduce((a,x)=>a+x.comision_px,0), total_promotores: proms.length, total_distribuidores: dists.length });
    } finally { setLoading(false); }
  },[]);
  useEffect(()=>{ cargar(); },[cargar]);
  const fmt = (n:number) => n.toLocaleString("es-CO");
  const fmtF = (f:string) => new Date(f).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"});
  return (
    <>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:16}}>
        {[{l:"Promotores",v:stats.total_promotores,c:"#8dc63f"},{l:"Distribuidores",v:stats.total_distribuidores,c:"#38bdf8"},{l:"Recargas",v:stats.total_recargas,c:"#fff"},{l:"Total PX",v:`${fmt(stats.total_px||0)} PX`,c:"#8dc63f"},{l:"Comisiones",v:`${fmt(stats.total_comisiones||0)} PX`,c:"#f59e0b"}].map(s=>(
          <div key={s.l} style={{background:"#111827",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,padding:14}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,.25)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>{s.l}</div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,overflow:"hidden",marginBottom:14}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,.05)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:600,color:"#fff",display:"flex",alignItems:"center",gap:7}}><CreditCard size={13}/> Recargas ({recargas.length})</div>
          <button onClick={cargar} style={{background:"rgba(255,255,255,.05)",border:"none",borderRadius:6,color:"rgba(255,255,255,.4)",cursor:"pointer",padding:"5px 10px",fontFamily:"'Oswald',sans-serif",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",gap:4}}><RefreshCw size={10}/> Actualizar</button>
        </div>
        <div style={{overflowX:"auto"}}>
          {loading?<div style={{textAlign:"center",padding:40}}><Loader2 size={24} style={{color:"#8dc63f",animation:"spin 1s linear infinite",margin:"0 auto",display:"block"}}/></div>
          :recargas.length===0?<div style={{textAlign:"center",padding:32,color:"rgba(255,255,255,.2)",fontFamily:"'Oswald',sans-serif",fontSize:13}}>Sin recargas aún</div>
          :<table className="tbl"><thead><tr><th>Distribuidor</th><th>Monto PX</th><th>Comisión PX</th><th>%</th><th>Estado</th><th>Fecha</th></tr></thead>
            <tbody>{recargas.map(r=>{
              const dist=distribuidores.find(d=>d.id===r.distribuidor_id);
              return <tr key={r.id}>
                <td><div style={{color:"#fff",fontWeight:500}}>{dist?.nombre??"—"}</div><div style={{fontSize:10,color:"rgba(255,255,255,.25)"}}>{dist?.email??"—"}</div></td>
                <td style={{fontFamily:"'Oswald',sans-serif",color:"#8dc63f",fontWeight:700}}>{fmt(r.monto_px)} PX</td>
                <td style={{color:"#f59e0b",fontFamily:"'Oswald',sans-serif"}}>{fmt(r.comision_px)} PX</td>
                <td style={{color:"rgba(255,255,255,.4)"}}>{r.comision_porcentaje}%</td>
                <td><span className={`badge ${r.estado==="COMPLETADA"?"b-ok":"b-err"}`}>{r.estado}</span></td>
                <td style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>{fmtF(r.created_at)}</td>
              </tr>;
            })}</tbody></table>}
        </div>
      </div>
      <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,overflow:"hidden"}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,.05)"}}><div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:600,color:"#fff",display:"flex",alignItems:"center",gap:7}}><Shield size={13}/> Resumen por promotor</div></div>
        <div style={{overflowX:"auto"}}>
          <table className="tbl"><thead><tr><th>Promotor</th><th>Distribuidores</th><th>Total PX</th><th>Comisiones</th><th>Estado</th></tr></thead>
          <tbody>{promotores.map(p=>{
            const dp=distribuidores.filter(d=>d.promotor_id===p.id);
            const rp=recargas.filter(r=>dp.map(d=>d.id).includes(r.distribuidor_id));
            return <tr key={p.id}>
              <td><div style={{color:"#fff",fontWeight:500}}>{p.nombre}</div><div style={{fontSize:10,color:"rgba(255,255,255,.25)"}}>{p.email}</div></td>
              <td style={{fontFamily:"'Oswald',sans-serif"}}>{dp.length}</td>
              <td style={{fontFamily:"'Oswald',sans-serif",color:"#8dc63f",fontWeight:700}}>{fmt(rp.reduce((a,r)=>a+r.monto_px,0))} PX</td>
              <td style={{color:"#f59e0b",fontFamily:"'Oswald',sans-serif"}}>{fmt(rp.reduce((a,r)=>a+r.comision_px,0))} PX</td>
              <td><span className={`badge ${p.activo?"b-ok":"b-err"}`}>{p.activo?"Activo":"Inactivo"}</span></td>
            </tr>;
          })}</tbody></table>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   FORM EVENTO — FUERA DE ADMINPANEL (fix cursor)
══════════════════════════════════════════════════════════════ */
interface FormEventoProps {
  tipoFijo: string;
  nuevoTorneo: any;
  setNuevoTorneo: (fn: any) => void;
  torneoVacio: any;
  crearEvento: () => void;
  setMostrarFormEvento: (v: boolean) => void;
}

function FormEvento({ tipoFijo, nuevoTorneo, setNuevoTorneo, torneoVacio, crearEvento, setMostrarFormEvento }: FormEventoProps) {
  return (
    <div className="panel" style={{marginBottom:16}}>
      <div className="panel-title"><Plus size={13} style={{color:'#8dc63f'}}/> Crear {tipoFijo==='TORNEO'?'Torneo':tipoFijo==='VIP'?'Evento VIP':'Evento'}</div>
      <div className="form-grid">
        <div><div className="lbl">Nombre *</div><input className="inp" placeholder="Ej: Mundial FIFA 2026" value={nuevoTorneo.name} onChange={e=>setNuevoTorneo((p:any)=>({...p,name:e.target.value}))}/></div>
        <div><div className="lbl">Slug (URL) *</div><input className="inp" placeholder="mundial-2026" value={nuevoTorneo.slug} onChange={e=>setNuevoTorneo((p:any)=>({...p,slug:e.target.value}))}/></div>
        <div>
          <div className="lbl">Estado</div>
          <select className="inp" value={nuevoTorneo.status} onChange={e=>setNuevoTorneo((p:any)=>({...p,status:e.target.value}))}>
            <option value="ACTIVO">Activo</option><option value="PROXIMO">Próximamente</option>
            <option value="PAUSADO">Pausado</option><option value="FINALIZADO">Finalizado</option>
          </select>
        </div>
        <div><div className="lbl">Orden</div><input type="number" className="inp" min={0} value={nuevoTorneo.sort_order} onChange={e=>setNuevoTorneo((p:any)=>({...p,sort_order:parseInt(e.target.value)||0}))}/></div>
        <div className="full"><div className="lbl">Descripción</div><input className="inp" placeholder="Describe el evento..." value={nuevoTorneo.descripcion} onChange={e=>setNuevoTorneo((p:any)=>({...p,descripcion:e.target.value}))}/></div>
        <div><div className="lbl">Costo entrada (PX) *</div><input type="number" className="inp" min={0} value={nuevoTorneo.costo_px} onChange={e=>{const px=parseInt(e.target.value)||0;setNuevoTorneo((p:any)=>({...p,costo_px:px,vidas_base:px}));}}/></div>
        <div><div className="lbl">Vidas base</div><input type="number" className="inp" min={0} value={nuevoTorneo.vidas_base} onChange={e=>setNuevoTorneo((p:any)=>({...p,vidas_base:parseInt(e.target.value)||0}))}/></div>
        <div><div className="lbl">Vidas bonus</div><input type="number" className="inp" min={0} value={nuevoTorneo.vidas_bonus} onChange={e=>setNuevoTorneo((p:any)=>({...p,vidas_bonus:parseInt(e.target.value)||0}))}/></div>
        <div><div className="lbl">Premio (PX)</div><input type="number" className="inp" min={0} value={nuevoTorneo.premio_px} onChange={e=>setNuevoTorneo((p:any)=>({...p,premio_px:parseInt(e.target.value)||0}))}/></div>
        <div className="full">
          <div style={{background:'rgba(141,198,63,.05)',border:'1px solid rgba(141,198,63,.15)',borderRadius:6,padding:'12px 16px',display:'flex',gap:20,flexWrap:'wrap'}}>
            {[{l:'COSTO',v:`${nuevoTorneo.costo_px} PX`,c:'#8dc63f'},{l:'VIDAS BASE',v:`${nuevoTorneo.vidas_base} ❤️`,c:'#fff'},{l:'BONUS',v:`+${nuevoTorneo.vidas_bonus} 🎁`,c:'#f59e0b'},{l:'TOTAL VIDAS',v:`${nuevoTorneo.vidas_base+nuevoTorneo.vidas_bonus} ❤️`,c:'#8dc63f'},{l:'PREMIO',v:`${nuevoTorneo.premio_px.toLocaleString()} PX`,c:'#a855f7'}].map(s=>(
              <div key={s.l}><div style={{fontSize:9,color:'rgba(255,255,255,.3)'}}>{s.l}</div><div style={{fontFamily:"'Oswald',sans-serif",fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div></div>
            ))}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'4px 0'}}>
          <button className={`toggle ${nuevoTorneo.featured?'on':'off'}`} onClick={()=>setNuevoTorneo((p:any)=>({...p,featured:!p.featured}))}/>
          <div><div style={{fontSize:12,color:'rgba(255,255,255,.7)'}}>Evento destacado</div><div style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>Aparece primero en el Radar</div></div>
        </div>
        {tipoFijo==='VIP'&&(<>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'4px 0'}}>
            <button className="toggle on" style={{pointerEvents:'none'}}/>
            <div><div style={{fontSize:12,color:'#a855f7'}}>Evento VIP ⭐</div><div style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>Configuración exclusiva VIP activa</div></div>
          </div>
          <div className="full">
            <div style={{background:'rgba(168,85,247,.06)',border:'1px solid rgba(168,85,247,.2)',borderRadius:10,padding:16,marginTop:4}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:700,color:'#a855f7',letterSpacing:1,marginBottom:14,display:'flex',alignItems:'center',gap:6}}><Star size={12}/> CONFIGURACIÓN VIP</div>
              <div className="form-grid">
                <div><div className="lbl">Costo entrada VIP (PX)</div><input type="number" className="inp" min={1} value={nuevoTorneo.vip_costo_entrada} onChange={e=>setNuevoTorneo((p:any)=>({...p,vip_costo_entrada:parseInt(e.target.value)||0}))}/></div>
                <div><div className="lbl">Límite jugadores (0=ilimitado)</div><input type="number" className="inp" min={0} value={nuevoTorneo.vip_limite_jugadores} onChange={e=>setNuevoTorneo((p:any)=>({...p,vip_limite_jugadores:parseInt(e.target.value)||0}))}/></div>
                <div><div className="lbl">Acceso</div><select className="inp" value={nuevoTorneo.vip_acceso} onChange={e=>setNuevoTorneo((p:any)=>({...p,vip_acceso:e.target.value}))}><option value="TODOS">Abierto a todos</option><option value="MEMBRESIA">Solo membresía VIP</option><option value="INVITACION">Solo por invitación</option></select></div>
                <div><div className="lbl">Máximo ganadores</div><input type="number" className="inp" min={1} value={nuevoTorneo.vip_max_ganadores} onChange={e=>setNuevoTorneo((p:any)=>({...p,vip_max_ganadores:parseInt(e.target.value)||1}))}/></div>
                <div><div className="lbl">Premio garantizado (PX)</div><input type="number" className="inp" min={0} value={nuevoTorneo.vip_premio_garantizado} onChange={e=>setNuevoTorneo((p:any)=>({...p,vip_premio_garantizado:parseInt(e.target.value)||0}))}/></div>
                <div style={{display:'flex',alignItems:'center',gap:10,paddingTop:20}}><button className={`toggle ${nuevoTorneo.vip_cuotas_activas?'on':'off'}`} onClick={()=>setNuevoTorneo((p:any)=>({...p,vip_cuotas_activas:!p.vip_cuotas_activas}))}/><div><div style={{fontSize:12,color:'#fff'}}>Cuotas activas</div><div style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>Mostrar cuotas al jugador</div></div></div>
                <div className="full"><div className="lbl">Descripción VIP</div><input className="inp" placeholder='Ej: "Final Copa del Mundo — premio 500 PX"' value={nuevoTorneo.vip_descripcion} onChange={e=>setNuevoTorneo((p:any)=>({...p,vip_descripcion:e.target.value}))}/></div>
              </div>
            </div>
          </div>
        </>)}
        <div><div className="lbl">Fecha inicio</div><input type="datetime-local" className="inp" value={nuevoTorneo.fecha_inicio} onChange={e=>setNuevoTorneo((p:any)=>({...p,fecha_inicio:e.target.value}))}/></div>
        <div><div className="lbl">Fecha cierre</div><input type="datetime-local" className="inp" value={nuevoTorneo.fecha_cierre} onChange={e=>setNuevoTorneo((p:any)=>({...p,fecha_cierre:e.target.value}))}/></div>
      </div>
      <div className="bonus-box">
        <div className="bonus-title"><Gift size={12}/> Bonus de promoción</div>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <button className={`toggle ${nuevoTorneo.bonus_activo?'on':'off'}`} onClick={()=>setNuevoTorneo((p:any)=>({...p,bonus_activo:!p.bonus_activo}))}/>
          <span style={{fontSize:12,color:'rgba(255,255,255,.6)'}}>{nuevoTorneo.bonus_activo?'Bonus activo':'Bonus inactivo'}</span>
        </div>
        {nuevoTorneo.bonus_activo&&(
          <div className="form-grid">
            <div><div className="lbl">PX bonus</div><input type="number" className="inp" min={0} value={nuevoTorneo.bonus_px} onChange={e=>setNuevoTorneo((p:any)=>({...p,bonus_px:parseInt(e.target.value)||0}))}/></div>
            <div><div className="lbl">Tipo</div><select className="inp" value={nuevoTorneo.bonus_tipo} onChange={e=>setNuevoTorneo((p:any)=>({...p,bonus_tipo:e.target.value}))}><option value="GLOBAL">Global</option><option value="EVENTO">Solo este evento</option></select></div>
            <div className="full"><div className="lbl">Descripción del bonus *</div><input className="inp" placeholder='Ej: "Recarga 5 PX y recibe 5 PX más"' value={nuevoTorneo.bonus_descripcion} onChange={e=>setNuevoTorneo((p:any)=>({...p,bonus_descripcion:e.target.value}))}/></div>
            <div className="full"><div className="lbl">Expira en</div><input type="datetime-local" className="inp" value={nuevoTorneo.bonus_expira_en} onChange={e=>setNuevoTorneo((p:any)=>({...p,bonus_expira_en:e.target.value}))}/></div>
          </div>
        )}
      </div>
      <div style={{display:'flex',gap:8,marginTop:14}}>
        <button className="btn" style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)"}} onClick={()=>{setMostrarFormEvento(false);setNuevoTorneo(torneoVacio);}}>Cancelar</button>
        <button className="btn btn-g" style={{flex:1}} onClick={()=>{
          setNuevoTorneo((p:any)=>({...p,tipo_evento:tipoFijo==='VIP'?'TORNEO':tipoFijo,es_vip:tipoFijo==='VIP'}));
          setTimeout(crearEvento,0);
        }}><Plus size={13}/> Crear evento</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FORM PARTIDO — FUERA DE ADMINPANEL (fix cursor)
══════════════════════════════════════════════════════════════ */
interface FormPartidoProps {
  nuevoPartido: any;
  setNuevoPartido: (fn: any) => void;
  partidoVacio: any;
  crearPartido: () => void;
  setMostrarFormPartido: (v: boolean) => void;
}

function FormPartido({ nuevoPartido, setNuevoPartido, partidoVacio, crearPartido, setMostrarFormPartido }: FormPartidoProps) {
  return (
    <div className="panel" style={{marginBottom:16}}>
      <div className="panel-title"><Plus size={13} style={{color:'#38bdf8'}}/> Agregar partido único</div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,padding:'12px 14px',background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.15)',borderRadius:8}}>
        <button className="toggle on" style={{background:'#ef4444',pointerEvents:'none'}}/>
        <div><div style={{fontSize:12,color:'#ef4444',fontWeight:600}}>⚡ Evento Individual</div><div style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>Aparecerá suelto en el Radar del jugador.</div></div>
      </div>
      <div className="form-grid">
        <div><div className="lbl">Equipo local *</div><input className="inp" placeholder="Colombia" value={nuevoPartido.home_team} onChange={e=>setNuevoPartido((p:any)=>({...p,home_team:e.target.value}))}/></div>
        <div><div className="lbl">Equipo visitante *</div><input className="inp" placeholder="Ecuador" value={nuevoPartido.away_team} onChange={e=>setNuevoPartido((p:any)=>({...p,away_team:e.target.value}))}/></div>
        <div><div className="lbl">Flag local (ISO)</div><input className="inp" placeholder="co" value={nuevoPartido.home_flag} onChange={e=>setNuevoPartido((p:any)=>({...p,home_flag:e.target.value}))}/></div>
        <div><div className="lbl">Flag visitante (ISO)</div><input className="inp" placeholder="ec" value={nuevoPartido.away_flag} onChange={e=>setNuevoPartido((p:any)=>({...p,away_flag:e.target.value}))}/></div>
        <div className="full"><div className="lbl">Fecha y hora *</div><input type="datetime-local" className="inp" value={nuevoPartido.match_date} onChange={e=>setNuevoPartido((p:any)=>({...p,match_date:e.target.value}))}/></div>
        <div><div className="lbl">Estadio</div><input className="inp" placeholder="MetLife Stadium" value={nuevoPartido.stadium} onChange={e=>setNuevoPartido((p:any)=>({...p,stadium:e.target.value}))}/></div>
        <div><div className="lbl">Ciudad</div><input className="inp" placeholder="Nueva York" value={nuevoPartido.city} onChange={e=>setNuevoPartido((p:any)=>({...p,city:e.target.value}))}/></div>
        <div><div className="lbl">Fase</div><select className="inp" value={nuevoPartido.phase} onChange={e=>setNuevoPartido((p:any)=>({...p,phase:e.target.value}))}>{['Amistoso','Grupos','Octavos','Cuartos','Semifinal','Tercer Puesto','Final'].map(f=><option key={f} value={f}>{f}</option>)}</select></div>
        <div><div className="lbl">Número partido</div><input type="number" className="inp" min={1} value={nuevoPartido.match_number} onChange={e=>setNuevoPartido((p:any)=>({...p,match_number:parseInt(e.target.value)||1}))}/></div>
        <div><div className="lbl">Cuota Local (1)</div><input type="number" step="0.01" className="inp" placeholder="1.85" value={nuevoPartido.cuota_1} onChange={e=>setNuevoPartido((p:any)=>({...p,cuota_1:e.target.value}))}/></div>
        <div><div className="lbl">Cuota Empate (X)</div><input type="number" step="0.01" className="inp" placeholder="3.20" value={nuevoPartido.cuota_x} onChange={e=>setNuevoPartido((p:any)=>({...p,cuota_x:e.target.value}))}/></div>
        <div><div className="lbl">Cuota Visitante (2)</div><input type="number" step="0.01" className="inp" placeholder="2.40" value={nuevoPartido.cuota_2} onChange={e=>setNuevoPartido((p:any)=>({...p,cuota_2:e.target.value}))}/></div>
        <div><div className="lbl">Costo entrada (PX)</div><input type="number" className="inp" min={0} value={nuevoPartido.costo_px} onChange={e=>setNuevoPartido((p:any)=>({...p,costo_px:parseInt(e.target.value)||0}))}/></div>
        <div><div className="lbl">Premio (PX)</div><input type="number" className="inp" min={0} value={nuevoPartido.premio_px} onChange={e=>setNuevoPartido((p:any)=>({...p,premio_px:parseInt(e.target.value)||0}))}/></div>
        <div style={{gridColumn:"span 2"}}>
  <div className="lbl">Apuestas por cuota</div>
  <div style={{display:"flex",alignItems:"center",gap:10,marginTop:4}}>
    <button
      onClick={()=>setNuevoPartido((p:any)=>({...p,apuestas_activas:!p.apuestas_activas}))}
      style={{width:38,height:22,borderRadius:11,border:"none",cursor:"pointer",
        background:nuevoPartido.apuestas_activas?"#8dc63f":"rgba(255,255,255,.1)",
        position:"relative",transition:"background .2s",flexShrink:0}}>
      <div style={{position:"absolute",width:16,height:16,borderRadius:"50%",background:"#fff",
        top:3,left:nuevoPartido.apuestas_activas?19:3,transition:"left .2s"}}/>
    </button>
    <span style={{fontSize:12,color:nuevoPartido.apuestas_activas?"#8dc63f":"rgba(255,255,255,.3)"}}>
      {nuevoPartido.apuestas_activas?"Apuestas activas — los jugadores pueden apostar por cuota":"Apuestas desactivadas"}
    </span>
  </div>
</div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button className="btn" style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)"}} onClick={()=>{setMostrarFormPartido(false);setNuevoPartido(partidoVacio);}}>Cancelar</button>
        <button className="btn btn-g" style={{flex:1}} onClick={crearPartido}><Plus size={13}/> Publicar partido</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LISTA EVENTOS — FUERA DE ADMINPANEL
══════════════════════════════════════════════════════════════ */
interface ListaEventosProps {
  lista: Torneo[]; tipo: string;
  expandedEvento: string|null; setExpandedEvento: (v:string|null)=>void;
  partidos: Partido[];
  actualizarEvento: (id:string, u:any)=>void;
  eliminarEvento: (id:string)=>void;
  eliminarPartido: (id:string)=>void;
  editandoEvento: string|null;
  setEditandoEvento: (v:string|null)=>void;
  formEdicion: any;
  setFormEdicion: (v:any)=>void;
  guardarEdicion: ()=>void;
  scores: Record<string,{h:string;a:string}>;
  setScores: (fn: (prev: Record<string,{h:string;a:string}>) => Record<string,{h:string;a:string}>) => void;
  statsJson: Record<string,string>;
  setStatsJson: (fn: (prev: Record<string,string>) => Record<string,string>) => void;
  mostrarStats: string|null;
  setMostrarStats: (v:string|null)=>void;
  procesandoStats: boolean;
  resolverPartido: (id:string, result:'LOCAL'|'EMPATE'|'VISITANTE')=>void;
  evaluarConStats: (matchId:string)=>void;
}

function ListaEventos({ lista, tipo, expandedEvento, setExpandedEvento, partidos, actualizarEvento, eliminarEvento, eliminarPartido, editandoEvento, setEditandoEvento, formEdicion, setFormEdicion, guardarEdicion, scores, setScores, statsJson, setStatsJson, mostrarStats, setMostrarStats, procesandoStats, resolverPartido, evaluarConStats }: ListaEventosProps) {
  return (
    <div>
      {lista.length===0?(
        <div className="empty"><Trophy size={28} style={{margin:"0 auto",opacity:.3,display:"block"}}/><div className="empty-t">Sin eventos {tipo} creados</div></div>
      ):lista.map(t=>(
        <div key={t.id} style={{background:"#111827",border:`1px solid ${expandedEvento===t.id?"rgba(141,198,63,.25)":"rgba(255,255,255,.07)"}`,borderRadius:10,marginBottom:8,overflow:"hidden",transition:"border-color .2s"}}>
          <div style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setExpandedEvento(expandedEvento===t.id?null:t.id)}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <span style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:700,color:"#fff"}}>{t.name}</span>
                <span className={`badge ${t.status==='ACTIVO'?'b-ok':t.status==='FINALIZADO'?'b-info':t.status==='PAUSADO'?'b-err':'b-warn'}`}>{t.status}</span>
                {t.bonus_activo&&<span className="badge b-warn">BONUS +{t.bonus_px} PX</span>}
                {t.es_vip&&<span className="badge b-purple">⭐ VIP</span>}
                {t.featured&&<span className="badge b-info">DESTACADO</span>}
              </div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.3)",marginTop:3}}>{t.slug} · {t.costo_px} PX · Premio: {(t.premio_px||0).toLocaleString()} PX</div>
            </div>
            <ChevronDown size={14} style={{color:"rgba(255,255,255,.3)",transform:expandedEvento===t.id?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s",flexShrink:0}}/>
          </div>
          {expandedEvento===t.id&&(
            <div style={{borderTop:"1px solid rgba(255,255,255,.05)",padding:"14px 16px"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:14}}>
                {[{l:"Costo",v:`${t.costo_px} PX`,c:"#8dc63f"},{l:"Vidas base",v:`${t.vidas_base} ❤️`,c:"#fff"},{l:"Bonus",v:`+${t.vidas_bonus||0}`,c:"#f59e0b"},{l:"Total vidas",v:`${(t.vidas_base||0)+(t.vidas_bonus||0)} ❤️`,c:"#8dc63f"},{l:"Premio",v:`${(t.premio_px||0).toLocaleString()} PX`,c:"#a855f7"}].map(s=>(
                  <div key={s.l} style={{background:"rgba(255,255,255,.03)",borderRadius:6,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:"rgba(255,255,255,.25)",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{s.l}</div>
                    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div>
                  </div>
                ))}
              </div>
              {t.descripcion&&<div style={{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:12,padding:"8px 10px",background:"rgba(255,255,255,.03)",borderRadius:6}}>{t.descripcion}</div>}
              {editandoEvento===t.id&&formEdicion&&(
  <div style={{background:"rgba(56,189,248,.04)",border:"1px solid rgba(56,189,248,.2)",borderRadius:8,padding:14,marginBottom:14}}>
    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:11,color:"#38bdf8",letterSpacing:1,marginBottom:12,display:"flex",alignItems:"center",gap:6}}><Edit2 size={11}/> EDITANDO EVENTO</div>
    <div className="form-grid">
      <div><div className="lbl">Nombre *</div><input className="inp" value={formEdicion.name||''} onChange={e=>setFormEdicion((p:any)=>({...p,name:e.target.value}))}/></div>
      <div><div className="lbl">Slug *</div><input className="inp" value={formEdicion.slug||''} onChange={e=>setFormEdicion((p:any)=>({...p,slug:e.target.value}))}/></div>
      <div><div className="lbl">Estado</div><select className="inp" value={formEdicion.status||''} onChange={e=>setFormEdicion((p:any)=>({...p,status:e.target.value}))}><option value="ACTIVO">Activo</option><option value="PROXIMO">Próximamente</option><option value="PAUSADO">Pausado</option><option value="FINALIZADO">Finalizado</option></select></div>
      <div><div className="lbl">Orden</div><input type="number" className="inp" value={formEdicion.sort_order||0} onChange={e=>setFormEdicion((p:any)=>({...p,sort_order:parseInt(e.target.value)||0}))}/></div>
      <div><div className="lbl">Costo PX</div><input type="number" className="inp" value={formEdicion.costo_px||0} onChange={e=>setFormEdicion((p:any)=>({...p,costo_px:parseInt(e.target.value)||0}))}/></div>
      <div><div className="lbl">Premio PX</div><input type="number" className="inp" value={formEdicion.premio_px||0} onChange={e=>setFormEdicion((p:any)=>({...p,premio_px:parseInt(e.target.value)||0}))}/></div>
      <div><div className="lbl">Vidas base</div><input type="number" className="inp" value={formEdicion.vidas_base||0} onChange={e=>setFormEdicion((p:any)=>({...p,vidas_base:parseInt(e.target.value)||0}))}/></div>
      <div><div className="lbl">Vidas bonus</div><input type="number" className="inp" value={formEdicion.vidas_bonus||0} onChange={e=>setFormEdicion((p:any)=>({...p,vidas_bonus:parseInt(e.target.value)||0}))}/></div>
      <div><div className="lbl">Fecha inicio</div><input type="datetime-local" className="inp" value={formEdicion.fecha_inicio||''} onChange={e=>setFormEdicion((p:any)=>({...p,fecha_inicio:e.target.value}))}/></div>
      <div><div className="lbl">Fecha cierre</div><input type="datetime-local" className="inp" value={formEdicion.fecha_cierre||''} onChange={e=>setFormEdicion((p:any)=>({...p,fecha_cierre:e.target.value}))}/></div>
      <div className="full"><div className="lbl">Descripción</div><input className="inp" value={formEdicion.descripcion||''} onChange={e=>setFormEdicion((p:any)=>({...p,descripcion:e.target.value}))}/></div>
    </div>
    <div style={{display:"flex",gap:8,marginTop:8}}>
      <button className="btn" style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)"}} onClick={()=>{setEditandoEvento(null);setFormEdicion(null);}}>Cancelar</button>
      <button className="btn btn-g" style={{flex:1}} onClick={guardarEdicion}><Check size={12}/> Guardar cambios</button>
    </div>
  </div>
)}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button className="btn btn-a" style={{padding:"5px 10px",fontSize:10}} onClick={()=>actualizarEvento(t.id,{bonus_activo:!t.bonus_activo})}>{t.bonus_activo?<><X size={10}/> Desactivar bonus</>:<><Gift size={10}/> Activar bonus</>}</button>
                <button className="btn btn-a" style={{padding:"5px 10px",fontSize:10}} onClick={()=>actualizarEvento(t.id,{status:t.status==='ACTIVO'?'PAUSADO':'ACTIVO'})}>{t.status==='ACTIVO'?<><Lock size={10}/> Pausar</>:<><Unlock size={10}/> Activar</>}</button>
                <button className="btn btn-a" style={{padding:"5px 10px",fontSize:10}} onClick={()=>actualizarEvento(t.id,{featured:!t.featured})}><Star size={10}/> {t.featured?'Quitar destacado':'Destacar'}</button>
                <button className="btn btn-b" style={{padding:"5px 10px",fontSize:10}} onClick={()=>{setEditandoEvento(editandoEvento===t.id?null:t.id);setFormEdicion({...t});}}>
  <Edit2 size={10}/> Editar
</button>
<button className="btn btn-r" style={{padding:"5px 10px",fontSize:10}} onClick={()=>eliminarEvento(t.id)}><Trash2 size={10}/> Eliminar</button>
              </div>
              {tipo==='de torneo'&&(()=>{
                const fixture=partidos.filter(p=>p.tournament_id===t.id);
                return (
                  <div style={{marginTop:16,borderTop:"1px solid rgba(255,255,255,.05)",paddingTop:12}}>
                    <div style={{fontSize:11,color:"rgba(255,255,255,.4)",fontFamily:"'Oswald',sans-serif",textTransform:"uppercase",letterSpacing:1,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
  <span style={{display:"flex",alignItems:"center",gap:6}}><Activity size={12}/> Fixture ({fixture.length} partidos)</span>
</div>
                    {fixture.length===0?<div style={{fontSize:11,color:"rgba(255,255,255,.2)"}}>Sin partidos inyectados.</div>:(
                      <div style={{display:'grid',gap:4}}>
                        {fixture.map(m=>(
                          <div key={m.id} style={{background:'rgba(255,255,255,.02)',borderRadius:6,border:'1px solid rgba(255,255,255,.04)',marginBottom:2}}>
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',flexWrap:'wrap' as const,gap:6}}>
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <span className={`badge ${m.status==='FINALIZADO'?'b-info':m.status==='EN_VIVO'?'b-err':'b-warn'}`} style={{fontSize:8,padding:'2px 4px'}}>{m.status}</span>
      <span style={{fontSize:11,fontWeight:500,color:'#fff'}}>{m.home_team} vs {m.away_team}</span>
      {m.status==='FINALIZADO'&&<span style={{fontSize:10,color:'#38bdf8'}}>{m.home_score}–{m.away_score}</span>}
    </div>
    <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' as const}}>
      <span style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>{new Date(m.match_date).toLocaleDateString('es-CO',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
      {m.status!=='FINALIZADO'&&<><input type="number" min={0} max={20} placeholder="0" className="sc-inp" value={scores[m.id]?.h??''} onChange={e=>setScores((s:any)=>({...s,[m.id]:{...s[m.id]??{h:'',a:''},h:e.target.value}}))}/><span style={{color:'rgba(255,255,255,.3)'}}>-</span><input type="number" min={0} max={20} placeholder="0" className="sc-inp" value={scores[m.id]?.a??''} onChange={e=>setScores((s:any)=>({...s,[m.id]:{...s[m.id]??{h:'',a:''},a:e.target.value}}))}/>{(['LOCAL','EMPATE','VISITANTE'] as const).map(r=>(<button key={r} className="btn" style={{padding:"2px 6px",fontSize:8,background:r==='LOCAL'?'rgba(141,198,63,.12)':r==='EMPATE'?'rgba(56,189,248,.12)':'rgba(239,68,68,.12)',color:r==='LOCAL'?'#8dc63f':r==='EMPATE'?'#38bdf8':'#ef4444',border:`1px solid ${r==='LOCAL'?'rgba(141,198,63,.3)':r==='EMPATE'?'rgba(56,189,248,.3)':'rgba(239,68,68,.3)'}`}} onClick={e=>{e.stopPropagation();resolverPartido(m.id,r);}}>{r==='LOCAL'?m.home_team:r==='EMPATE'?'Empate':m.away_team}</button>))}</>}
      <button className="btn" style={{padding:"2px 6px",fontSize:8,background:"rgba(168,85,247,.12)",color:"#a855f7",border:"1px solid rgba(168,85,247,.3)"}} onClick={e=>{e.stopPropagation();setMostrarStats(mostrarStats===m.id?null:m.id);}}>📊</button>
      <button className="btn btn-r" style={{padding:"2px 6px",fontSize:8}} onClick={e=>{e.stopPropagation();eliminarPartido(m.id);}}><Trash2 size={8}/></button>
    </div>
  </div>
  {mostrarStats===m.id&&(<div style={{margin:'0 8px 8px',padding:"8px 10px",background:"rgba(168,85,247,.04)",border:"1px solid rgba(168,85,247,.15)",borderRadius:6}}><textarea rows={3} placeholder='{"resultado":"LOCAL","total_goles":2}' value={statsJson[m.id]||''} onChange={e=>setStatsJson((prev:any)=>({...prev,[m.id]:e.target.value}))} style={{width:"100%",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:6,padding:"6px 8px",color:"#fff",fontSize:10,fontFamily:"monospace",resize:"vertical" as const,outline:"none"}}/><div style={{display:"flex",gap:4,marginTop:4}}><button className="btn" style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)",padding:"3px 8px",fontSize:8}} onClick={()=>setMostrarStats(null)}>Cancelar</button><button className="btn" style={{flex:1,background:"rgba(168,85,247,.15)",color:"#a855f7",border:"1px solid rgba(168,85,247,.3)",padding:"3px 8px",fontSize:8}} onClick={e=>{e.stopPropagation();evaluarConStats(m.id);}} disabled={procesandoStats}>{procesandoStats?'...':'✅ Evaluar'}</button></div></div>)}
</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════
   ADMIN PRINCIPAL
══════════════════════════════════════════════════════════════ */
export default function AdminPanel() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sideOpen, setSideOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{text:string;type:'ok'|'err'}|null>(null);
  const [logoErr, setLogoErr] = useState(false);
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [retiros, setRetiros] = useState<Retiro[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [stats, setStats] = useState<AdminStats|null>(null);
  const [distribuidores, setDistribuidores] = useState<Distribuidor[]>([]);
  const [pins, setPins] = useState<CodigoPin[]>([]);
  const [tasas, setTasas] = useState<TasaCambio[]>([]);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [promotoresList, setPromotoresList] = useState<Promotor[]>([]);
  const [pedidos, setPedidos] = useState<PedidoPromotor[]>([]);
  const [pedidoFiltro, setPedidoFiltro] = useState('PENDIENTE');

  const torneosNorm  = torneos.filter(t=>t.tipo_evento==='TORNEO'&&!t.es_vip);
  const torneosCombi = torneos.filter(t=>t.tipo_evento==='COMBINADA'&&!t.es_vip);
  const torneosVip   = torneos.filter(t=>t.es_vip);

  const [expandedEvento, setExpandedEvento] = useState<string|null>(null);
  const [expandedPartido, setExpandedPartido] = useState<string|null>(null);
  const [scores, setScores] = useState<Record<string,{h:string;a:string}>>({});
  const [statsJson,      setStatsJson]      = useState<Record<string,string>>({});
const [mostrarStats,   setMostrarStats]   = useState<string|null>(null);
const [procesandoStats,setProcesandoStats]= useState(false);
  const [retiroFiltroEstado, setRetiroFiltroEstado] = useState('PENDIENTE');
  const [torneoInscFiltro, setTorneoInscFiltro] = useState('');
  const [retiroSelId, setRetiroSelId] = useState<string|null>(null);
  const [notaRetiro, setNotaRetiro] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [ajusteUserId, setAjusteUserId] = useState('');
  const [ajusteUsername, setAjusteUsername] = useState('');
  const [ajustePx, setAjustePx] = useState(0);
  const [ajusteVidas, setAjusteVidas] = useState(0);
  const [ajusteNota, setAjusteNota] = useState('');
  const [mostrarAjuste, setMostrarAjuste] = useState(false);
  const [guardandoAjuste, setGuardandoAjuste] = useState(false);
  const [pinFiltro, setPinFiltro] = useState('DISPONIBLE');
  const [mostrarFormPin, setMostrarFormPin] = useState(false);
  const [generandoPins, setGenerandoPins] = useState(false);
  const pinVacio = { cantidad:10, vidas:5, creditos:0, lote_id:'', expira_en:'' };
  const [nuevoPin, setNuevoPin] = useState(pinVacio);
  const [mostrarFormTasa, setMostrarFormTasa] = useState(false);
  const [editTasa, setEditTasa] = useState<TasaCambio|null>(null);
  const [nuevaTasa, setNuevaTasa] = useState<NuevaTasaForm>({pais_codigo:'',moneda:'',simbolo:'',tasa_usd:0});
  const [mostrarFormDist, setMostrarFormDist] = useState(false);
  const distVacio: NuevoDistribuidorForm = { promotor_id:'', nombre:'', email:'', pais:'EC', telefono:'', comision_recarga_pct:10, comision_premio_pct:5, permite_recarga_saldo:true, permite_emision_pin:false };
  const [nuevoDist, setNuevoDist] = useState<NuevoDistribuidorForm>(distVacio);
  const [buscarUsuario, setBuscarUsuario] = useState('');
const [isSearchingUsers, setIsSearchingUsers] = useState(false);
const [editandoEvento, setEditandoEvento] = useState<string|null>(null);
const [formEdicion, setFormEdicion] = useState<any>(null);
const [editandoPartido, setEditandoPartido] = useState<string|null>(null);
const [formEdicionPartido, setFormEdicionPartido] = useState<any>(null);

  const retirosFiltrados = retiroFiltroEstado==='TODOS' ? retiros : retiros.filter(r=>r.estado===retiroFiltroEstado);
  const partidosIndividuales = partidos.filter(p=>p.tipo_evento==='INDIVIDUAL'||!p.tournament_id);

  const torneoVacio = {
    name:'', slug:'', tipo_evento:'TORNEO', status:'ACTIVO',
    costo_px:5, vidas_base:5, vidas_bonus:0, premio_px:0,
    bonus_activo:false, bonus_px:0, bonus_descripcion:'',
    bonus_expira_en:'', bonus_tipo:'GLOBAL', es_vip:false,
    fecha_inicio:'', fecha_cierre:'', descripcion:'',
    featured:false, sort_order:0,
    vip_costo_entrada:10, vip_limite_jugadores:0, vip_acceso:'TODOS',
    vip_cuotas_activas:false, vip_descripcion:'', vip_premio_garantizado:0, vip_max_ganadores:1,
  };
  const [nuevoTorneo, setNuevoTorneo] = useState(torneoVacio);
  const [mostrarFormEvento, setMostrarFormEvento] = useState(false);

  const partidoVacio: NuevoPartidoForm = {
    tournament_id:'', home_team:'', away_team:'', home_flag:'', away_flag:'', match_date:'',
    stadium:'', city:'', match_number:1, cuota_1:'', cuota_x:'', cuota_2:'',
    phase:'Grupos', costo_px:0, premio_px:0, es_individual:true, apuestas_activas:false,
  };
  const [nuevoPartido, setNuevoPartido] = useState<NuevoPartidoForm>(partidoVacio);
  const [mostrarFormPartido, setMostrarFormPartido] = useState(false);

  const combinadaVacia = { nombre:'', slug:'', tipo:'DOBLE', status:'ACTIVO', costo_px:3, premio_px:1000, fecha_dia:'', partidos_ids:[] as string[], descripcion:'' };
  const [nuevaCombinada, setNuevaCombinada] = useState(combinadaVacia);
  const [mostrarFormCombinada, setMostrarFormCombinada] = useState(false);
  const [filtroCombiFecha, setFiltroCombiFecha] = useState('');
  const [filtroCombiTorneo, setFiltroCombiTorneo] = useState('');
  const [jsonMasivo, setJsonMasivo] = useState('');
  const [mostrarMasivo, setMostrarMasivo] = useState(false);
  const [cargandoMasivo, setCargandoMasivo] = useState(false);
  const [masivoTorneoId, setMasivoTorneoId] = useState('');

  const showMsg = (text:string, type:'ok'|'err') => { setMsg({text,type}); setTimeout(()=>setMsg(null),8000); };
  const getHeaders = async () => {
    const { data:{ session } } = await supabase.auth.getSession();
    return { 'Content-Type':'application/json', ...(session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{}) };
  };

  useEffect(()=>{
    const check = async () => {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data:p } = await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
      if (!p||!['admin','super_admin','finance_admin'].includes(p.role)) { router.push('/radar'); return; }
      cargarDatos();
    };
    check();
  },[]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      try { const res = await fetch(`${API_URL}/admin/dashboard`,{headers}); if (res.ok) setStats(await res.json()); } catch {}
      const { data:t } = await supabase.from('tournaments').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});
      if (t) setTorneos(t as Torneo[]);
      const { data:m } = await supabase.from('matches').select('*').order('match_date',{ascending:true});
      if (m) setPartidos(m as Partido[]);
      const { data:r } = await supabase.from('withdrawal_requests').select('*').in('estado',['PENDIENTE','EN_REVISION']).order('created_at',{ascending:true});
      if (r) setRetiros(r as Retiro[]);
      try {
        const resU = await fetch(`${API_URL}/admin/usuarios`,{headers});
        if (resU.ok) { const u=await resU.json(); setUsuarios((Array.isArray(u)?u:u.data||[]).slice(0,100)); throw new Error(); }
      } catch {
        const { data:u } = await supabase.from('profiles').select('id,username,email,lives,pitchx_balance,status,country,created_at,role').order('created_at',{ascending:false}).limit(100);
        if (u) setUsuarios(u as Usuario[]);
      }
      const { data: proms } = await supabase.from('promotores').select('*');
      if (proms) setPromotoresList(proms as Promotor[]);
      const { data: peds } = await supabase.from('pedidos_promotor').select('*').order('created_at',{ascending:false});
      if (peds) {
        const promsMap = new Map((proms??[]).map((p:any)=>[p.id,p.nombre]));
        setPedidos((peds as PedidoPromotor[]).map(p=>({...p,promotor_nombre:promsMap.get(p.promotor_id)??'—'})));
      }
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  },[]);

  useEffect(() => {
    const fn = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        if (buscarUsuario.trim()==='') {
          const { data:u } = await supabase.from('profiles').select('id,username,email,lives,pitchx_balance,status,country,created_at,role').order('created_at',{ascending:false}).limit(100);
          if (u) setUsuarios(u as Usuario[]);
        } else {
          const s = `%${buscarUsuario.trim()}%`;
          const { data:u } = await supabase.from('profiles').select('id,username,email,lives,pitchx_balance,status,country,created_at,role').or(`email.ilike.${s},username.ilike.${s}`).order('created_at',{ascending:false}).limit(100);
          if (u) setUsuarios(u as Usuario[]);
        }
      } catch(e){ console.error(e); }
      finally { setIsSearchingUsers(false); }
    }, 400);
    return () => clearTimeout(fn);
  }, [buscarUsuario]);

  const crearEvento = async () => {
    if (!nuevoTorneo.name||!nuevoTorneo.slug) { showMsg('Nombre y slug son obligatorios','err'); return; }
    const { error } = await supabase.from('tournaments').insert({
      ...nuevoTorneo,
      slug: nuevoTorneo.slug.toLowerCase().replace(/\s+/g,'-'),
      vidas_base: nuevoTorneo.costo_px,
      fecha_inicio: nuevoTorneo.fecha_inicio||null,
      fecha_cierre: nuevoTorneo.fecha_cierre||null,
      bonus_expira_en: nuevoTorneo.bonus_expira_en||null,
      descripcion: nuevoTorneo.descripcion||null,
      ...(nuevoTorneo.es_vip ? {
        vip_costo_entrada: nuevoTorneo.vip_costo_entrada,
        vip_limite_jugadores: nuevoTorneo.vip_limite_jugadores,
        vip_acceso: nuevoTorneo.vip_acceso,
        vip_cuotas_activas: nuevoTorneo.vip_cuotas_activas,
        vip_descripcion: nuevoTorneo.vip_descripcion||null,
        vip_premio_garantizado: nuevoTorneo.vip_premio_garantizado,
        vip_max_ganadores: nuevoTorneo.vip_max_ganadores,
      } : {}),
    });
    if (error) { showMsg('Error: '+error.message,'err'); return; }
    showMsg('Evento creado','ok'); setNuevoTorneo(torneoVacio); setMostrarFormEvento(false); cargarDatos();
  };

  const actualizarEvento = async (id:string, updates:Partial<Torneo>) => {
    const { error } = await supabase.from('tournaments').update(updates).eq('id',id);
    if (error) { showMsg('Error: '+error.message,'err'); return; }
    showMsg('Actualizado','ok'); cargarDatos();
  };

  const eliminarEvento = async (id:string) => {
    if (!confirm('¿Eliminar este evento?')) return;
    const { error } = await supabase.from('tournaments').delete().eq('id',id);
    if (error) { showMsg('Error: '+error.message,'err'); return; }
    showMsg('Eliminado','ok'); cargarDatos();
  };

  const crearPartido = async () => {
    if (!nuevoPartido.home_team||!nuevoPartido.away_team||!nuevoPartido.match_date) { showMsg('Completa los campos obligatorios','err'); return; }
    const { error } = await supabase.from('matches').insert({
      tournament_id: null,
      home_team: nuevoPartido.home_team, away_team: nuevoPartido.away_team,
      home_flag: nuevoPartido.home_flag.toLowerCase()||'un',
      away_flag: nuevoPartido.away_flag.toLowerCase()||'un',
      match_date: nuevoPartido.match_date,
      stadium: nuevoPartido.stadium||'', city: nuevoPartido.city||'',
      match_number: nuevoPartido.match_number,
      cuota_1: nuevoPartido.cuota_1?parseFloat(nuevoPartido.cuota_1 as string):null,
      cuota_x: nuevoPartido.cuota_x?parseFloat(nuevoPartido.cuota_x as string):null,
      cuota_2: nuevoPartido.cuota_2?parseFloat(nuevoPartido.cuota_2 as string):null,
      phase: nuevoPartido.phase||'Grupos',
      costo_operacion: nuevoPartido.costo_px||0,
      status: 'PROXIMAMENTE',
      apuestas_activas: nuevoPartido.apuestas_activas,
    });
    if (error) { showMsg('Error: '+error.message,'err'); return; }
    showMsg('Partido publicado','ok');
    setNuevoPartido(p=>({...partidoVacio,match_number:p.match_number+1}));
    setMostrarFormPartido(false); cargarDatos();
  };

  const crearCombinada = async () => {
    if (!nuevaCombinada.nombre||!nuevaCombinada.fecha_dia) { showMsg('Nombre y fecha son obligatorios','err'); return; }
    if (nuevaCombinada.partidos_ids.length<2) { showMsg('Selecciona al menos 2 partidos','err'); return; }
    const slug = nuevaCombinada.nombre.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
    const { error } = await supabase.from('tournaments').insert({
      name: nuevaCombinada.nombre, slug, tipo_evento: 'COMBINADA', status: nuevaCombinada.status,
      costo_px: nuevaCombinada.costo_px, premio_px: nuevaCombinada.premio_px,
      fecha_inicio: nuevaCombinada.fecha_dia||null, descripcion: nuevaCombinada.descripcion||null,
      partidos_combinada: nuevaCombinada.partidos_ids.map((id,i)=>{
        const p=partidos.find(x=>x.id===id);
        return {orden:i+1,partido_id:id,home_team:p?.home_team,away_team:p?.away_team,match_date:p?.match_date,cuota_1:p?.cuota_1,cuota_x:p?.cuota_x,cuota_2:p?.cuota_2};
      }),
    });
    if (error) { showMsg('Error: '+error.message,'err'); return; }
    showMsg('Combinada creada','ok'); setNuevaCombinada(combinadaVacia); setMostrarFormCombinada(false); cargarDatos();
  };

  const togglePartidoCombinada = (id:string) => {
    setNuevaCombinada(prev=>{
      const existe=prev.partidos_ids.includes(id);
      return {...prev,partidos_ids:existe?prev.partidos_ids.filter(x=>x!==id):[...prev.partidos_ids,id]};
    });
  };

  const cargarMasivo = async () => {
    if (!masivoTorneoId) { showMsg('Selecciona el torneo destino','err'); return; }
    try {
      const data=JSON.parse(jsonMasivo);
      if (!Array.isArray(data)) { showMsg('El JSON debe ser un array','err'); return; }
      setCargandoMasivo(true);
      const { error } = await supabase.from('matches').insert(data.map((p:any)=>({
        tournament_id: masivoTorneoId, home_team:p.home_team, away_team:p.away_team,
        home_flag:(p.home_flag||'un').toLowerCase(), away_flag:(p.away_flag||'un').toLowerCase(),
        match_date:p.match_date, stadium:p.stadium||'', city:p.city||'',
        match_number:p.match_number||1,
        cuota_1:p.cuota_1?parseFloat(p.cuota_1):null, cuota_x:p.cuota_x?parseFloat(p.cuota_x):null, cuota_2:p.cuota_2?parseFloat(p.cuota_2):null,
        phase:p.phase||'Grupos', costo_operacion:p.costo_px||0,
status:'PROXIMAMENTE'
      })));
      if (error) throw error;
      showMsg(`${data.length} partidos inyectados`,'ok');
      setJsonMasivo(''); setMostrarMasivo(false); setMasivoTorneoId(''); cargarDatos();
    } catch(e:any){ showMsg(e.message??'JSON inválido','err'); }
    finally { setCargandoMasivo(false); }
  };
const evaluarConStats = async (matchId: string) => {
    const jsonStr = statsJson[matchId];
    if (!jsonStr) { showMsg('Pega el JSON de estadísticas primero', 'err'); return; }
    
    let stats: any;
    try { stats = JSON.parse(jsonStr); }
    catch { showMsg('JSON inválido — verifica el formato', 'err'); return; }
    
    setProcesandoStats(true);
    try {
      // Guardar estadísticas del partido
      await supabase.from('match_stats').upsert({
        match_id:           matchId,
        resultado:          stats.resultado,
        goles_local:        stats.goles_local ?? 0,
        goles_visitante:    stats.goles_visitante ?? 0,
        total_goles:        stats.total_goles ?? 0,
        tarjeta_roja:       stats.tarjeta_roja ?? false,
        tarjeta_roja_local: stats.tarjeta_roja_local ?? false,
        tarjeta_roja_visitante: stats.tarjeta_roja_visitante ?? false,
        total_corners:      stats.total_corners ?? 0,
        corners_local:      stats.corners_local ?? 0,
        corners_visitante:  stats.corners_visitante ?? 0,
        hubo_var:           stats.hubo_var ?? false,
        hubo_penales:       stats.hubo_penales ?? false,
        tanda_penales:      stats.tanda_penales ?? false,
        total_faltas:       stats.total_faltas ?? 0,
        manos:              stats.manos ?? false,
        posesion_local:     stats.posesion_local ?? 0,
        posesion_visitante: stats.posesion_visitante ?? 0,
        tiempo_extra:       stats.tiempo_extra ?? false,
        primer_gol:         stats.primer_gol ?? null,
        raw_json:           stats,
      }, { onConflict: 'match_id' });

      // Cargar todas las predicciones del partido
      const { data: preds } = await supabase.from('predictions')
        .select('id, user_id, question_id, answer_id')
        .eq('match_id', matchId)
        .neq('question_id', 'resultado'); // resultado ya se evalúa en resolverPartido

      if (!preds || preds.length === 0) {
        showMsg('Estadísticas guardadas. Sin predicciones adicionales que evaluar.', 'ok');
        setProcesandoStats(false);
        setMostrarStats(null);
        return;
      }

      // Mapa de evaluación por categoría
      const evaluarRespuesta = (question_id: string, answer_id: string): boolean | null => {
        switch (question_id) {
          case 'goles':
            const tg = stats.total_goles ?? 0;
            if (answer_id === '0-1') return tg <= 1;
            if (answer_id === '2')   return tg === 2;
            if (answer_id === '3')   return tg === 3;
            if (answer_id === '4+')  return tg >= 4;
            return null;
          case 'tarjetas':
            if (answer_id === 'no_roja')     return !stats.tarjeta_roja;
            if (answer_id === 'roja_local')  return stats.tarjeta_roja_local && !stats.tarjeta_roja_visitante;
            if (answer_id === 'roja_visita') return stats.tarjeta_roja_visitante && !stats.tarjeta_roja_local;
            if (answer_id === 'roja_ambos')  return stats.tarjeta_roja_local && stats.tarjeta_roja_visitante;
            return null;
          case 'corners':
            const tc = stats.total_corners ?? 0;
            if (answer_id === '0-5')  return tc <= 5;
            if (answer_id === '6-9')  return tc >= 6 && tc <= 9;
            if (answer_id === '10+')  return tc >= 10;
            return null;
          case 'var':
            if (answer_id === 'si')  return stats.hubo_var === true;
            if (answer_id === 'no')  return stats.hubo_var === false;
            return null;
          case 'penales':
            if (answer_id === 'si')  return stats.hubo_penales === true;
            if (answer_id === 'no')  return stats.hubo_penales === false;
            return null;
          case 'tanda_penales':
            if (answer_id === 'si')  return stats.tanda_penales === true;
            if (answer_id === 'no')  return stats.tanda_penales === false;
            return null;
          case 'faltas':
            const tf = stats.total_faltas ?? 0;
            if (answer_id === '0-15') return tf <= 15;
            if (answer_id === '16-25') return tf >= 16 && tf <= 25;
            if (answer_id === '26+')  return tf >= 26;
            return null;
          case 'manos':
            if (answer_id === 'si')  return stats.manos === true;
            if (answer_id === 'no')  return stats.manos === false;
            return null;
          case 'posesion':
            const pl = stats.posesion_local ?? 50;
            if (answer_id === 'local_domina')    return pl >= 55;
            if (answer_id === 'equilibrio')      return pl >= 45 && pl <= 55;
            if (answer_id === 'visita_domina')   return pl <= 45;
            return null;
          case 'primer_gol':
            if (answer_id === 'local')     return stats.primer_gol === 'LOCAL';
            if (answer_id === 'visitante') return stats.primer_gol === 'VISITANTE';
            if (answer_id === 'ninguno')   return stats.total_goles === 0;
            return null;
          default:
            return null;
        }
      };

      let correctas = 0;
      let evaluadas = 0;

      for (const pred of preds) {
        const esCorrecta = evaluarRespuesta(pred.question_id, pred.answer_id);
        if (esCorrecta === null) continue;

        await supabase.from('predictions').update({
          is_correct:   esCorrecta,
          evaluated_at: new Date().toISOString(),
          status:       'evaluated',
        }).eq('id', pred.id);

        if (esCorrecta) correctas++;
        evaluadas++;
      }

      showMsg(`✅ ${evaluadas} predicciones evaluadas — ${correctas} correctas`, 'ok');
      setMostrarStats(null);
      setStatsJson(prev => ({ ...prev, [matchId]: '' }));
    } catch (err: any) {
      showMsg('Error: ' + err.message, 'err');
    } finally {
      setProcesandoStats(false);
    }
  };
  const resolverPartido = async (id:string, result:'LOCAL'|'EMPATE'|'VISITANTE') => {
    const sc=scores[id]||{h:'0',a:'0'};
    const { error } = await supabase.from('matches').update({
      status:'FINALIZADO', result,
      home_score:parseInt(sc.h)||0,
      away_score:parseInt(sc.a)||0
    }).eq('id',id);
    if (error) { showMsg('Error: '+error.message,'err'); return; }

    // Buscar el torneo al que pertenece el partido
    const { data: partido } = await supabase.from('matches').select('tournament_id').eq('id',id).maybeSingle();
    const torneoId = partido?.tournament_id;

    // Buscar todas las predicciones de este partido
    const { data: preds } = await supabase.from('predictions')
      .select('id, user_id, answer_id, question_id')
      .eq('match_id', id)
      .eq('question_id', '0c3dc09c-a149-4aed-8301-5cd84249721c');

    if (preds && preds.length > 0) {
      // Mapeo answer_id → resultado
      const mapaResultado: Record<string,string> = { '1457b8e1-2aa6-4cd4-b91c-2a77d69622a8':'LOCAL', '7f61bf08-b9d3-4134-b6cb-f7cfe85d59f9':'EMPATE', '47b8dfe4-9e37-4429-b6d0-8d1f083b7f13':'VISITANTE' };

      for (const pred of preds) {
        const esCorrecta = mapaResultado[pred.answer_id] === result;

        // Actualizar predicción
        await supabase.from('predictions').update({
          is_correct: esCorrecta,
          evaluated_at: new Date().toISOString(),
          status: 'evaluated',
        }).eq('id', pred.id);

        // Si falló y hay torneo → restar vida en tournament_entries
        if (!esCorrecta && torneoId) {
          const { data: entrada } = await supabase
            .from('tournament_entries')
            .select('id, vidas, status')
            .eq('user_id', pred.user_id)
            .eq('tournament_id', torneoId)
            .maybeSingle();

          if (entrada && entrada.vidas > 0) {
            const nuevasVidas = entrada.vidas - 1;
            const nuevoStatus = nuevasVidas === 0 ? 'ELIMINADO' : nuevasVidas === 1 ? 'EN_COMA' : entrada.status;
            await supabase.from('tournament_entries').update({
              vidas: nuevasVidas,
              status: nuevoStatus,
              matches_played: (entrada as any).matches_played ? (entrada as any).matches_played + 1 : 1,
            }).eq('id', entrada.id);

            // Notificar al jugador
            await supabase.from('notifications').insert({
              user_id: pred.user_id,
              type: 'VIDA_PERDIDA',
              title: nuevasVidas === 0 ? '¡Eliminado!' : nuevasVidas === 1 ? '⚠ Último chance' : 'Perdiste una vida',
              message: nuevasVidas === 0
                ? `Fallaste la predicción y quedaste eliminado del torneo.`
                : `Fallaste una predicción. Te quedan ${nuevasVidas} vida${nuevasVidas === 1 ? '' : 's'}.`,
              read: false,
            });
          }
        }

        // Si acertó → actualizar aciertos
        if (esCorrecta && torneoId) {
          const { data: entrada } = await supabase
            .from('tournament_entries')
            .select('id, aciertos_totales, matches_correct, matches_played')
            .eq('user_id', pred.user_id)
            .eq('tournament_id', torneoId)
            .maybeSingle();

          if (entrada) {
            await supabase.from('tournament_entries').update({
              aciertos_totales: (entrada.aciertos_totales || 0) + 1,
              matches_correct:  (entrada.matches_correct  || 0) + 1,
              matches_played:   (entrada.matches_played   || 0) + 1,
            }).eq('id', entrada.id);
          }
        }
      }

      const correctas = preds.filter(p => mapaResultado[p.answer_id] === result).length;
      showMsg(`Resultado guardado ✓ — ${correctas}/${preds.length} predicciones correctas`, 'ok');
    } else {
     showMsg('Resultado guardado','ok');
    }

    // Verificar si todos los partidos del torneo están finalizados → distribuir premio
    if (torneoId) {
      const { data: todosPartidos } = await supabase
        .from('matches').select('id, status').eq('tournament_id', torneoId);
      
      const todosFinalizados = todosPartidos && todosPartidos.length > 0 &&
        todosPartidos.every((p:any) => p.status === 'FINALIZADO');

      if (todosFinalizados) {
        const { data: entradas } = await supabase
          .from('tournament_entries')
          .select('id, user_id, aciertos_totales, matches_played, vidas, status')
          .eq('tournament_id', torneoId)
          .neq('status', 'ELIMINADO');

        const { data: torneoData } = await supabase
          .from('tournaments')
          .select('premio_px, name, vip_max_ganadores, es_vip')
          .eq('id', torneoId).maybeSingle();

        const totalPartidos = todosPartidos.length;
        const premioPx = torneoData?.premio_px || 0;
        const maxGanadores = torneoData?.vip_max_ganadores || 999;

        if (entradas && premioPx > 0) {
          const ganadores = entradas
            .filter((e:any) => (e.aciertos_totales || 0) >= totalPartidos)
            .slice(0, maxGanadores);

          const premioPorGanador = ganadores.length > 0 ? Math.floor(premioPx / ganadores.length) : 0;

          for (const ganador of ganadores) {
            const { data: perfil } = await supabase
              .from('profiles').select('pitchx_balance').eq('id', ganador.user_id).maybeSingle();
            if (perfil) {
              await supabase.from('profiles').update({
                pitchx_balance: (perfil.pitchx_balance || 0) + premioPorGanador
              }).eq('id', ganador.user_id);
            }
            await supabase.from('tournament_entries').update({
              status: 'GANADOR',
              fecha_ganador: new Date().toISOString(),
            }).eq('id', ganador.id);
            await supabase.from('notifications').insert({
              user_id: ganador.user_id,
              type: 'PREMIO',
              title: '¡Ganaste!',
              message: `Has ganado ${premioPorGanador.toLocaleString()} PX en ${torneoData?.name}`,
              read: false,
            });
          }

          if (ganadores.length > 0) {
            showMsg(`🏆 ${ganadores.length} ganador(es) — ${premioPorGanador.toLocaleString()} PX cada uno`, 'ok');
          } else {
            showMsg('Torneo finalizado — sin ganadores', 'ok');
          }
        }
      }
    }

    cargarDatos();
  };

  const eliminarPartido = async (id:string) => {
    if (!confirm('¿Eliminar este partido?')) return;
    const { error } = await supabase.from('matches').delete().eq('id',id);
    if (error) { showMsg('Error: '+error.message,'err'); return; }
    showMsg('Partido eliminado','ok'); cargarDatos();
  };

  const gestionarRetiro = async (id:string, estado:'APROBADO'|'RECHAZADO') => { await gestionarRetiroCompleto(id,estado); };

  const bloquearUsuario = async (id:string, bloquear:boolean) => {
    await supabase.from('profiles').update({status:bloquear?'BLOQUEADO':'VIVO'}).eq('id',id);
    showMsg(bloquear?'Usuario bloqueado':'Usuario reactivado','ok'); cargarDatos();
  };

  const cargarInscripciones = async (torneoId:string) => {
    const { data } = await supabase.from('tournament_entries').select('*, profiles(username,email)').eq('tournament_id',torneoId).order('fecha_ingreso',{ascending:false});
    if (data) setInscripciones(data as Inscripcion[]);
  };

  const gestionarRetiroCompleto = async (id:string, estado:'APROBADO'|'RECHAZADO'|'PAGADO'|'EN_REVISION', nota?:string, motivo?:string) => {
    const updates:any = { estado, revisado_en:new Date().toISOString() };
    if (nota) updates.notas_admin=nota;
    if (motivo) updates.motivo_rechazo=motivo;
    if (estado==='PAGADO') updates.pagado_en=new Date().toISOString();
    const { error } = await supabase.from('withdrawal_requests').update(updates).eq('id',id);
    if (error) { showMsg('Error: '+error.message,'err'); return; }
    if (estado==='APROBADO') {
      try {
        const { data: retiro } = await supabase.from('withdrawal_requests').select('*').eq('id',id).maybeSingle();
        if (retiro&&retiro.metodo_retiro==='PUNTO_FISICO') {
          const { data: perfil } = await supabase.from('profiles').select('country_code').eq('id',retiro.user_id).maybeSingle();
          const paisCodigo=((perfil?.country_code??'+57')).replace('+','');
          const paisKey=paisCodigo==='57'?'CO':paisCodigo==='593'?'EC':paisCodigo==='52'?'MX':paisCodigo==='51'?'PE':paisCodigo==='54'?'AR':paisCodigo==='56'?'CL':paisCodigo==='58'?'VE':paisCodigo==='1'?'US':paisCodigo==='591'?'BO':paisCodigo==='55'?'BR':paisCodigo==='34'?'ES':'CO';
          const { data: tasa } = await supabase.from('tasas_cambio').select('tasa_usd,moneda').eq('pais_codigo',paisKey).maybeSingle();
          const { data: cfg } = await supabase.from('platform_config').select('value').eq('key','CODIGO_GANANCIA_VIGENCIA_HORAS').maybeSingle();
          const horas=parseInt(cfg?.value??'72');
          const expira=new Date(Date.now()+horas*60*60*1000).toISOString();
          const codigo=`${paisKey}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
          const tasaUsd=Number(tasa?.tasa_usd??1);
          const { error: cgError } = await supabase.from('codigos_ganancia').insert({
            jugador_id:retiro.user_id, retiro_id:retiro.id, codigo,
            monto_px:Number(retiro.monto_neto??0), moneda:tasa?.moneda??'COP',
            monto_local:Number(retiro.monto_neto??0)*tasaUsd, tasa_cambio:tasaUsd,
            pais_codigo:paisKey, estado:'ACTIVO', expira_en:expira,
          });
          if (cgError) showMsg('Retiro aprobado pero error código: '+cgError.message,'err');
          else showMsg(`Retiro aprobado ✓ Código: ${codigo}`,'ok');
          setRetiroSelId(null); setNotaRetiro(''); setMotivoRechazo(''); cargarDatos(); return;
        }
      } catch(e){ console.error(e); }
    }
    const msgs:Record<string,string>={APROBADO:'Retiro aprobado',RECHAZADO:'Retiro rechazado',PAGADO:'Marcado como PAGADO',EN_REVISION:'En revisión'};
    showMsg(msgs[estado],'ok'); setRetiroSelId(null); setNotaRetiro(''); setMotivoRechazo(''); cargarDatos();
  };

  const abrirAjuste = (u:Usuario) => { setAjusteUserId(u.id); setAjusteUsername(u.username||u.email); setAjustePx(0); setAjusteVidas(0); setAjusteNota(''); setMostrarAjuste(true); };
  const aplicarAjuste = async () => {
    if (!ajusteUserId||(!ajustePx&&!ajusteVidas)) { showMsg('Ingresa PX o vidas','err'); return; }
    setGuardandoAjuste(true);
    try {
      const u=usuarios.find(x=>x.id===ajusteUserId);
      if (!u) throw new Error('Usuario no encontrado');
      const updates:any={};
      if (ajustePx!==0) updates.pitchx_balance=(u.pitchx_balance||0)+ajustePx;
      if (ajusteVidas!==0) updates.lives=Math.max(0,(u.lives||0)+ajusteVidas);
      const { error } = await supabase.from('profiles').update(updates).eq('id',ajusteUserId);
      if (error) throw error;
      await supabase.from('transacciones_credito').insert({usuario_id:ajusteUserId,tipo:'AJUSTE',creditos:ajustePx,vidas:ajusteVidas,saldo_antes:u.pitchx_balance||0,saldo_despues:(u.pitchx_balance||0)+ajustePx,vidas_antes:u.lives||0,vidas_despues:Math.max(0,(u.lives||0)+ajusteVidas),descripcion:ajusteNota||'Ajuste manual admin'});
      showMsg(`Ajuste aplicado a ${ajusteUsername}`,'ok'); setMostrarAjuste(false); cargarDatos();
    } catch(e:any){ showMsg(e.message??"Error",'err'); }
    finally { setGuardandoAjuste(false); }
  };

  const crearDistribuidor = async () => {
    if (!nuevoDist.nombre||!nuevoDist.email||!nuevoDist.promotor_id) { showMsg('Nombre, email y promotor requeridos','err'); return; }
    const { error } = await supabase.from('distribuidores').insert({...nuevoDist,activo:true});
    if (error) { showMsg('Error: '+error.message,'err'); return; }
    await supabase.from('profiles').update({role:'distribuidor'}).eq('email',nuevoDist.email.toLowerCase());
    showMsg('Distribuidor creado','ok'); setNuevoDist(distVacio); setMostrarFormDist(false); cargarDatos();
  };
  const toggleDistribuidor = async (id:string, activo:boolean) => {
    await supabase.from('distribuidores').update({activo:!activo}).eq('id',id);
    showMsg(activo?'Desactivado':'Activado','ok'); cargarDatos();
  };

  const generarPins = async () => {
    if (nuevoPin.cantidad<1||nuevoPin.cantidad>500) { showMsg('Cantidad entre 1 y 500','err'); return; }
    if (!nuevoPin.vidas&&!nuevoPin.creditos) { showMsg('Define vidas o créditos','err'); return; }
    setGenerandoPins(true);
    try {
      const { data:{user} } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');
      const lote=nuevoPin.lote_id||`LOTE-${Date.now()}`;
      const arr=Array.from({length:nuevoPin.cantidad},()=>({codigo:`KL-${Math.random().toString(36).substring(2,8).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`,vidas:nuevoPin.vidas,creditos:nuevoPin.creditos,estado:'DISPONIBLE',lote_id:lote,expira_en:nuevoPin.expira_en||null,creado_por_id:user.id}));
      const { error } = await supabase.from('codigos_pin').insert(arr);
      if (error) throw error;
      showMsg(`${nuevoPin.cantidad} PINs generados`,'ok'); setNuevoPin(pinVacio); setMostrarFormPin(false); cargarDatos();
    } catch(e:any){ showMsg(e.message??"Error",'err'); }
    finally { setGenerandoPins(false); }
  };
  const anularPin = async (id:string) => {
    if (!confirm('¿Anular este PIN?')) return;
    await supabase.from('codigos_pin').update({estado:'ANULADO'}).eq('id',id);
    showMsg('PIN anulado','ok'); cargarDatos();
  };
  const guardarEdicion = async () => {
  if (!editandoEvento||!formEdicion) return;
  const { error } = await supabase.from('tournaments').update({
    name: formEdicion.name,
    slug: formEdicion.slug.toLowerCase().replace(/\s+/g,'-'),
    status: formEdicion.status,
    costo_px: formEdicion.costo_px,
    vidas_base: formEdicion.vidas_base,
    vidas_bonus: formEdicion.vidas_bonus,
    premio_px: formEdicion.premio_px,
    descripcion: formEdicion.descripcion||null,
    featured: formEdicion.featured,
    sort_order: formEdicion.sort_order,
    fecha_inicio: formEdicion.fecha_inicio||null,
    fecha_cierre: formEdicion.fecha_cierre||null,
    bonus_activo: formEdicion.bonus_activo,
    bonus_px: formEdicion.bonus_px,
    bonus_descripcion: formEdicion.bonus_descripcion||null,
    bonus_expira_en: formEdicion.bonus_expira_en||null,
    bonus_tipo: formEdicion.bonus_tipo,
    ...(formEdicion.es_vip ? {
      vip_costo_entrada: formEdicion.vip_costo_entrada,
      vip_limite_jugadores: formEdicion.vip_limite_jugadores,
      vip_acceso: formEdicion.vip_acceso,
      vip_cuotas_activas: formEdicion.vip_cuotas_activas,
      vip_descripcion: formEdicion.vip_descripcion||null,
      vip_premio_garantizado: formEdicion.vip_premio_garantizado,
      vip_max_ganadores: formEdicion.vip_max_ganadores,
    } : {}),
  }).eq('id', editandoEvento);
  if (error) { showMsg('Error: '+error.message,'err'); return; }
  showMsg('Evento actualizado ✓','ok');
  setEditandoEvento(null); setFormEdicion(null); cargarDatos();
};

const guardarEdicionPartido = async () => {
  if (!editandoPartido||!formEdicionPartido) return;
  const { error } = await supabase.from('matches').update({
    home_team: formEdicionPartido.home_team,
    away_team: formEdicionPartido.away_team,
    home_flag: formEdicionPartido.home_flag.toLowerCase()||'un',
    away_flag: formEdicionPartido.away_flag.toLowerCase()||'un',
    match_date: formEdicionPartido.match_date,
    stadium: formEdicionPartido.stadium||'',
    city: formEdicionPartido.city||'',
    phase: formEdicionPartido.phase,
    match_number: formEdicionPartido.match_number,
    cuota_1: formEdicionPartido.cuota_1?parseFloat(formEdicionPartido.cuota_1):null,
    cuota_x: formEdicionPartido.cuota_x?parseFloat(formEdicionPartido.cuota_x):null,
    cuota_2: formEdicionPartido.cuota_2?parseFloat(formEdicionPartido.cuota_2):null,
    costo_operacion: formEdicionPartido.costo_px||0,
status: formEdicionPartido.status,
  }).eq('id', editandoPartido);
  if (error) { showMsg('Error: '+error.message,'err'); return; }
  showMsg('Partido actualizado ✓','ok');
  setEditandoPartido(null); setFormEdicionPartido(null); cargarDatos();
};

  const guardarTasa = async () => {
    if (!nuevaTasa.pais_codigo||!nuevaTasa.moneda||!nuevaTasa.tasa_usd) { showMsg('Completa todos los campos','err'); return; }
    const payload={pais_codigo:nuevaTasa.pais_codigo.toUpperCase(),moneda:nuevaTasa.moneda.toUpperCase(),simbolo:nuevaTasa.simbolo,tasa_usd:parseFloat(nuevaTasa.tasa_usd as string),updated_at:new Date().toISOString()};
    const existe=tasas.find(t=>t.pais_codigo===nuevaTasa.pais_codigo.toUpperCase());
    const { error } = existe ? await supabase.from('tasas_cambio').update(payload).eq('pais_codigo',existe.pais_codigo) : await supabase.from('tasas_cambio').insert(payload);
    if (error) { showMsg('Error: '+error.message,'err'); return; }
    showMsg('Tasa guardada','ok'); setNuevaTasa({pais_codigo:'',moneda:'',simbolo:'',tasa_usd:0}); setMostrarFormTasa(false); setEditTasa(null); cargarDatos();
  };

  const signOut = async () => { await supabase.auth.signOut(); router.push('/'); };

  const NAV_EVENTOS = [
    {id:'torneos',icon:<Trophy size={14}/>,label:'Torneos'},
    {id:'partidos',icon:<Activity size={14}/>,label:'Partidos'},
    {id:'combinadas',icon:<Target size={14}/>,label:'Combinadas'},
    {id:'vip',icon:<Star size={14}/>,label:'VIP'},
  ];
  const NAV_GESTION = [
    {id:'retiros',icon:<Wallet size={14}/>,label:'Retiros',badge:retiros.filter(r=>r.estado==='PENDIENTE').length},
    {id:'pedidos',icon:<Package size={14}/>,label:'Pedidos',badge:pedidos.filter(p=>p.estado==='PENDIENTE').length},
    {id:'codigos',icon:<QrCode size={14}/>,label:'Códigos ganancia',badge:0},
    {id:'usuarios',icon:<Users size={14}/>,label:'Usuarios'},
    {id:'inscripciones',icon:<Users size={14}/>,label:'Inscripciones'},
    {id:'distribuidores',icon:<Shield size={14}/>,label:'Distribuidores'},
    {id:'pins',icon:<Key size={14}/>,label:'Códigos PIN'},
    {id:'tasas',icon:<Globe size={14}/>,label:'Tasas cambio'},
    {id:'promotores',icon:<Shield size={14}/>,label:'Promotores'},
    {id:'red_comercial',icon:<TrendingUp size={14}/>,label:'Red Comercial'},
    {id:'config',icon:<Settings size={14}/>,label:'Config'},
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .ad-root{display:flex;min-height:100vh;background:#0a0d14;font-family:'Roboto',sans-serif;color:#fff;}
        .ad-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:49;}
        @media(max-width:900px){.ad-ov.open{display:block;}}
        .sb{width:220px;background:#0b0e1a;border-right:1px solid rgba(141,198,63,.1);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:50;transition:transform .3s;overflow-y:auto;}
        @media(max-width:900px){.sb{transform:translateX(-100%);}.sb.open{transform:translateX(0);}}
        .sb-logo{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:8px;flex-shrink:0;}
        .sb-logo img{height:24px;width:auto;}
        .sb-logo-fb{font-family:'Oswald',sans-serif;font-size:15px;font-weight:700;color:#8dc63f;letter-spacing:2px;}
        .sb-badge{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#ef4444;font-size:8px;font-weight:700;padding:2px 6px;border-radius:3px;font-family:'Oswald',sans-serif;letter-spacing:1px;}
        .sb-nav{flex:1;padding:8px 0;overflow-y:auto;}
        .sb-grp{font-size:9px;color:rgba(255,255,255,.18);letter-spacing:2px;text-transform:uppercase;padding:10px 16px 4px;}
        .sb-item{display:flex;align-items:center;gap:9px;width:100%;padding:9px 16px;background:transparent;border:none;border-left:2px solid transparent;color:rgba(255,255,255,.35);font-family:'Roboto',sans-serif;font-size:12px;cursor:pointer;transition:all .15s;text-align:left;}
        .sb-item:hover{color:rgba(255,255,255,.7);background:rgba(255,255,255,.03);}
        .sb-item.on{color:#8dc63f;background:linear-gradient(90deg,rgba(141,198,63,.08),transparent);border-left-color:#8dc63f;}
        .sb-pill{margin-left:auto;font-size:9px;padding:2px 7px;border-radius:3px;font-weight:700;background:rgba(239,68,68,.15);color:#ef4444;}
        .sb-foot{padding:12px 16px;border-top:1px solid rgba(255,255,255,.05);flex-shrink:0;}
        .sb-out{display:flex;align-items:center;gap:8px;width:100%;padding:8px 0;background:transparent;border:none;color:rgba(239,68,68,.45);font-size:11px;cursor:pointer;transition:color .2s;}
        .sb-out:hover{color:#ef4444;}
        .mn{flex:1;margin-left:220px;display:flex;flex-direction:column;min-height:100vh;}
        @media(max-width:900px){.mn{margin-left:0;}}
        .tb{padding:12px 20px;background:#0b0e1a;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40;}
        .tb-l{display:flex;align-items:center;gap:10px;}
        .tb-ham{display:none;background:transparent;border:none;color:rgba(255,255,255,.5);cursor:pointer;padding:4px;}
        @media(max-width:900px){.tb-ham{display:flex;}}
        .tb-title{font-family:'Oswald',sans-serif;font-size:13px;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:2px;text-transform:uppercase;}
        .tb-admin{font-size:10px;color:rgba(141,198,63,.6);font-family:'Oswald',sans-serif;letter-spacing:1px;padding:4px 10px;border:1px solid rgba(141,198,63,.2);border-radius:4px;}
        .bd{flex:1;padding:18px 20px;overflow-y:auto;}
        @media(max-width:600px){.bd{padding:12px;}}
        .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;}
        @media(max-width:700px){.stats{grid-template-columns:repeat(2,1fr);}}
        .stat{background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:12px;display:flex;align-items:center;gap:10px;}
        .stat-ico{width:34px;height:34px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .ico-g{background:rgba(141,198,63,.1);color:#8dc63f;}.ico-b{background:rgba(56,189,248,.1);color:#38bdf8;}
        .ico-a{background:rgba(245,158,11,.1);color:#f59e0b;}.ico-r{background:rgba(239,68,68,.1);color:#ef4444;}
        .ico-p{background:rgba(168,85,247,.1);color:#a855f7;}
        .stat-v{font-family:'Oswald',sans-serif;font-size:20px;font-weight:700;color:#fff;line-height:1;}
        .stat-l{font-size:9px;color:rgba(255,255,255,.28);letter-spacing:1px;text-transform:uppercase;margin-top:2px;}
        .sec-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;}
        .sec-t{font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:2px;text-transform:uppercase;display:flex;align-items:center;gap:8px;}
        .sec-t::before{content:'';width:3px;height:13px;background:#8dc63f;border-radius:2px;flex-shrink:0;}
        .panel{background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:16px;margin-bottom:12px;}
        .panel-title{font-family:'Oswald',sans-serif;font-size:13px;font-weight:600;color:#fff;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px;}
        .lbl{font-size:10px;color:rgba(255,255,255,.3);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;}
        .inp{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:6px;padding:9px 12px;color:#fff;font-size:12px;font-family:'Roboto',sans-serif;outline:none;transition:border-color .2s;margin-bottom:10px;}
        .inp:focus{border-color:#8dc63f;}
        .inp::placeholder{color:rgba(255,255,255,.18);font-size:11px;}
        select.inp option{background:#111827;}
        textarea.inp{resize:vertical;min-height:120px;font-family:'Roboto',monospace;font-size:11px;}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        @media(max-width:600px){.form-grid{grid-template-columns:1fr;}}
        .form-grid .full{grid-column:span 2;}
        @media(max-width:600px){.form-grid .full{grid-column:span 1;}}
        .toggle{width:36px;height:20px;border-radius:10px;border:none;cursor:pointer;transition:background .2s;position:relative;flex-shrink:0;}
        .toggle.on{background:#8dc63f;}.toggle.off{background:rgba(255,255,255,.1);}
        .toggle::after{content:'';position:absolute;width:14px;height:14px;border-radius:50%;background:#fff;top:3px;transition:left .2s;}
        .toggle.on::after{left:19px;}.toggle.off::after{left:3px;}
        .btn{padding:9px 16px;border:none;border-radius:6px;font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;letter-spacing:.5px;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;}
        .btn-g{background:#8dc63f;color:#0a0d14;}.btn-g:hover{background:#7ab52f;}
        .btn-r{background:rgba(239,68,68,.12);color:#ef4444;border:1px solid rgba(239,68,68,.25);}.btn-r:hover{background:#ef4444;color:#fff;}
        .btn-b{background:rgba(56,189,248,.1);color:#38bdf8;border:1px solid rgba(56,189,248,.2);}.btn-b:hover{background:#38bdf8;color:#0a0d14;}
        .btn-a{background:rgba(245,158,11,.1);color:#f59e0b;border:1px solid rgba(245,158,11,.2);}.btn-a:hover{background:#f59e0b;color:#0a0d14;}
        .btn:disabled{opacity:.5;cursor:not-allowed;}
        .tbl{width:100%;border-collapse:collapse;font-size:12px;}
        .tbl th{padding:8px 10px;text-align:left;font-family:'Oswald',sans-serif;font-size:9px;font-weight:600;color:rgba(255,255,255,.3);letter-spacing:1.5px;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,.06);white-space:nowrap;}
        .tbl td{padding:9px 10px;border-bottom:1px solid rgba(255,255,255,.04);color:rgba(255,255,255,.7);vertical-align:middle;}
        .tbl tr:hover td{background:rgba(255,255,255,.02);}
        .tbl tr:last-child td{border-bottom:none;}
        .badge{font-size:9px;font-weight:700;padding:3px 7px;border-radius:3px;letter-spacing:.5px;white-space:nowrap;font-family:'Oswald',sans-serif;}
        .b-ok{background:rgba(141,198,63,.12);color:#8dc63f;}.b-warn{background:rgba(245,158,11,.12);color:#f59e0b;}
        .b-err{background:rgba(239,68,68,.12);color:#ef4444;}.b-info{background:rgba(56,189,248,.12);color:#38bdf8;}
        .b-purple{background:rgba(168,85,247,.12);color:#a855f7;}
        .b-paid{background:rgba(34,197,94,.12);color:#22c55e;}
        .toast{position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 16px;border-radius:8px;font-family:'Oswald',sans-serif;font-weight:700;font-size:12px;display:flex;align-items:center;gap:8px;box-shadow:0 8px 32px rgba(0,0,0,.5);animation:slideIn .3s ease;}
        .toast-ok{background:#8dc63f;color:#0a0d14;}.toast-err{background:#ef4444;color:#fff;}
        .spin{animation:spin .8s linear infinite;}
        .empty{text-align:center;padding:36px 20px;color:rgba(255,255,255,.2);}
        .empty-t{font-family:'Oswald',sans-serif;font-size:14px;color:rgba(255,255,255,.3);margin-top:10px;}
        .retiro-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-left:3px solid #f59e0b;border-radius:8px;padding:14px;margin-bottom:8px;display:flex;flex-wrap:wrap;align-items:center;gap:10px;}
        .bonus-box{background:rgba(141,198,63,.04);border:1px solid rgba(141,198,63,.15);border-radius:8px;padding:14px;margin-top:10px;}
        .bonus-title{font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;color:#8dc63f;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
        .sc-inp{width:38px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:4px;padding:4px 6px;color:#fff;font-size:12px;text-align:center;outline:none;}
        .sc-inp:focus{border-color:#8dc63f;}
        .p-sel{border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:10px 12px;margin-bottom:6px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:10px;}
        .p-sel:hover{border-color:rgba(56,189,248,.3);background:rgba(56,189,248,.04);}
        .p-sel.sel{border-color:rgba(56,189,248,.5);background:rgba(56,189,248,.08);}
        .search-box{position:relative;margin-bottom:14px;}
        .search-box .inp{padding-left:34px;}
        .pin-code{font-family:monospace;font-size:12px;color:#8dc63f;background:rgba(141,198,63,.08);padding:3px 7px;border-radius:4px;letter-spacing:1px;}
        .filtro-tabs{display:flex;gap:4px;margin-bottom:14px;flex-wrap:wrap;}
        .filtro-tab{padding:5px 11px;border:1px solid rgba(255,255,255,.08);border-radius:6px;background:transparent;color:rgba(255,255,255,.35);font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;cursor:pointer;letter-spacing:.5px;transition:all .15s;}
        .filtro-tab.on{background:rgba(141,198,63,.1);border-color:rgba(141,198,63,.3);color:#8dc63f;}
      `}</style>

      {msg&&<div className={`toast toast-${msg.type}`}>{msg.type==='ok'?<CheckCircle size={14}/>:<AlertTriangle size={14}/>}{msg.text}</div>}
      <div className={`ad-ov ${sideOpen?'open':''}`} onClick={()=>setSideOpen(false)}/>

      <div className="ad-root">
        <aside className={`sb ${sideOpen?'open':''}`}>
          <div className="sb-logo">
            {!logoErr?<img src="/img/logo12.png" alt="KL" onError={()=>setLogoErr(true)}/>:<span className="sb-logo-fb">KL</span>}
            <span className="sb-badge">ADMIN</span>
          </div>
          <nav className="sb-nav">
            <div className="sb-grp">Panel</div>
            <button className={`sb-item ${tab==='dashboard'?'on':''}`} onClick={()=>{setTab('dashboard');setSideOpen(false);}}><LayoutDashboard size={14}/> Dashboard</button>
            <div className="sb-grp">Eventos</div>
            {NAV_EVENTOS.map(n=>(
              <button key={n.id} className={`sb-item ${tab===n.id?'on':''}`} onClick={()=>{setTab(n.id as Tab);setSideOpen(false);setMostrarFormEvento(false);setMostrarFormPartido(false);setMostrarFormCombinada(false);}}>
                {n.icon} {n.label}
              </button>
            ))}
            <div className="sb-grp">Gestión</div>
            {NAV_GESTION.map(n=>(
              <button key={n.id} className={`sb-item ${tab===n.id?'on':''}`} onClick={()=>{setTab(n.id as Tab);setSideOpen(false);}}>
                {n.icon} {n.label}
                {!!n.badge&&n.badge>0&&<span className="sb-pill">{n.badge}</span>}
              </button>
            ))}
          </nav>
          <div className="sb-foot"><button className="sb-out" onClick={signOut}><LogOut size={13}/> Cerrar sesión</button></div>
        </aside>

        <div className="mn">
          <div className="tb">
            <div className="tb-l">
              <button className="tb-ham" onClick={()=>setSideOpen(true)}><Menu size={20}/></button>
              <span className="tb-title">
                {tab==='dashboard'&&'Dashboard'}{tab==='torneos'&&'Torneos'}{tab==='partidos'&&'Partidos'}
                {tab==='combinadas'&&'Combinadas'}{tab==='vip'&&'Eventos VIP'}{tab==='retiros'&&'Retiros'}
                {tab==='usuarios'&&'Usuarios'}{tab==='inscripciones'&&'Inscripciones'}{tab==='distribuidores'&&'Distribuidores'}
                {tab==='pins'&&'Códigos PIN'}{tab==='tasas'&&'Tasas de Cambio'}{tab==='promotores'&&'Promotores'}
                {tab==='red_comercial'&&'Red Comercial'}{tab==='config'&&'Configuración'}
                {tab==='pedidos'&&'Pedidos de Promotores'}{tab==='codigos'&&'Códigos de Ganancia'}
              </span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span className="tb-admin">SUPER ADMIN</span>
              <button onClick={cargarDatos} style={{background:'none',border:'none',color:'rgba(255,255,255,.3)',cursor:'pointer',padding:4}}><RefreshCw size={13} className={loading?'spin':''}/></button>
            </div>
          </div>

          <div className="bd">

            {/* DASHBOARD */}
            {tab==='dashboard'&&(
              <>
                <div className="stats">
                  {[
                    {ico:<Users size={15}/>,cls:'ico-g',v:stats?.total_usuarios??usuarios.length,l:'Usuarios'},
                    {ico:<Activity size={15}/>,cls:'ico-b',v:stats?.usuarios_activos??'—',l:'Activos hoy'},
                    {ico:<Trophy size={15}/>,cls:'ico-a',v:torneos.length,l:'Eventos totales'},
                    {ico:<TrendingUp size={15}/>,cls:'ico-g',v:torneos.filter(t=>t.status==='ACTIVO').length,l:'Activos'},
                    {ico:<DollarSign size={15}/>,cls:'ico-p',v:stats?.pozo_global?.toLocaleString()??'—',l:'Pozo global'},
                    {ico:<Wallet size={15}/>,cls:'ico-r',v:retiros.length,l:'Retiros pendientes'},
                  ].map((s,i)=>(
                    <div key={i} className="stat"><div className={`stat-ico ${s.cls}`}>{s.ico}</div><div><div className="stat-v">{s.v}</div><div className="stat-l">{s.l}</div></div></div>
                  ))}
                </div>
                <div className="sec-h"><div className="sec-t">Acciones rápidas</div></div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:20}}>
                  {[{label:'Crear torneo',icon:<Trophy size={13}/>,action:()=>setTab('torneos'),color:'#8dc63f'},{label:'Agregar partido',icon:<Activity size={13}/>,action:()=>setTab('partidos'),color:'#38bdf8'},{label:'Crear combinada',icon:<Target size={13}/>,action:()=>setTab('combinadas'),color:'#f59e0b'},{label:'Ver retiros',icon:<Wallet size={13}/>,action:()=>setTab('retiros'),color:'#ef4444'}].map((a,i)=>(
                    <button key={i} onClick={a.action} style={{background:'#111827',border:`1px solid ${a.color}22`,borderRadius:8,padding:'12px',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:30,height:30,borderRadius:6,background:`${a.color}18`,display:'flex',alignItems:'center',justifyContent:'center',color:a.color,flexShrink:0}}>{a.icon}</div>
                      <span style={{fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:600,color:'#fff'}}>{a.label}</span>
                    </button>
                  ))}
                </div>
                {retiros.length>0&&(
                  <>
                    <div className="sec-h"><div className="sec-t">Retiros urgentes</div><button className="btn btn-b" onClick={()=>setTab('retiros')}><Eye size={11}/> Ver todos</button></div>
                    {retiros.slice(0,3).map(r=>(
                      <div key={r.id} className="retiro-card">
                        <div style={{flex:1,minWidth:0}}><div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:600,color:'#fff'}}>{r.nombre_beneficiario}</div><div style={{fontSize:11,color:'rgba(255,255,255,.35)',marginTop:2}}>{r.metodo_pago} · {r.numero_cuenta}</div></div>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:700,color:'#f59e0b'}}>{r.monto_local?.toLocaleString()} {r.moneda}</div>
                        <div style={{display:'flex',gap:6}}>
                          <button className="btn btn-g" onClick={()=>gestionarRetiro(r.id,'APROBADO')}><Check size={11}/> Aprobar</button>
                          <button className="btn btn-r" onClick={()=>gestionarRetiro(r.id,'RECHAZADO')}><X size={11}/> Rechazar</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

            {/* TORNEOS */}
            {tab==='torneos'&&(
              <>
                <div className="sec-h">
                  <div className="sec-t">Torneos ({torneosNorm.length})</div>
                  <div style={{display:'flex',gap:8}}>
                    <button className="btn btn-b" onClick={()=>{setMostrarMasivo(!mostrarMasivo);setMostrarFormEvento(false);}}><Upload size={12}/> Inyectar Fixture</button>
                    <button className="btn btn-g" onClick={()=>{setNuevoTorneo({...torneoVacio,tipo_evento:'TORNEO'});setMostrarFormEvento(true);setMostrarMasivo(false);}}><Plus size={12}/> Nuevo torneo</button>
                  </div>
                </div>
                {mostrarMasivo&&(
                  <div className="panel" style={{marginBottom:16}}>
                    <div className="panel-title"><Upload size={13} style={{color:'#38bdf8'}}/> Inyectar Fixture (JSON)</div>
                    <div className="form-grid" style={{marginBottom:12}}>
                      <div className="full">
                        <div className="lbl">Torneo Destino *</div>
                        <select className="inp" style={{marginBottom:0}} value={masivoTorneoId} onChange={e=>setMasivoTorneoId(e.target.value)}>
                          <option value="">— Selecciona un torneo —</option>
                          {torneosNorm.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <textarea className="inp" placeholder='[{"home_team":"Colombia","away_team":"Ecuador","match_date":"2026-06-12T22:00:00Z","phase":"Grupos"}]' value={jsonMasivo} onChange={e=>setJsonMasivo(e.target.value)}/>
                    <div style={{display:'flex',gap:8}}>
                      <button className="btn" style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)"}} onClick={()=>{setMostrarMasivo(false);setJsonMasivo('');}}>Cancelar</button>
                      <button className="btn btn-g" style={{flex:1}} onClick={cargarMasivo} disabled={cargandoMasivo}>{cargandoMasivo?<><Loader2 size={12} style={{animation:'spin 1s linear infinite'}}/> Inyectando...</>:<><Upload size={12}/> Inyectar</>}</button>
                    </div>
                  </div>
                )}
                {mostrarFormEvento&&<FormEvento tipoFijo="TORNEO" nuevoTorneo={nuevoTorneo} setNuevoTorneo={setNuevoTorneo} torneoVacio={torneoVacio} crearEvento={crearEvento} setMostrarFormEvento={setMostrarFormEvento}/>}
                <ListaEventos lista={torneosNorm} tipo="de torneo" expandedEvento={expandedEvento} setExpandedEvento={setExpandedEvento} partidos={partidos} actualizarEvento={actualizarEvento} eliminarEvento={eliminarEvento} eliminarPartido={eliminarPartido} editandoEvento={editandoEvento} setEditandoEvento={setEditandoEvento} formEdicion={formEdicion} setFormEdicion={setFormEdicion} guardarEdicion={guardarEdicion} scores={scores} setScores={setScores} statsJson={statsJson} setStatsJson={setStatsJson} mostrarStats={mostrarStats} setMostrarStats={setMostrarStats} procesandoStats={procesandoStats} resolverPartido={resolverPartido} evaluarConStats={evaluarConStats}/>
              </>
            )}

            {/* PARTIDOS */}
            {tab==='partidos'&&(
              <>
                <div className="sec-h">
                  <div className="sec-t">Partidos Individuales ({partidosIndividuales.length})</div>
                  <button className="btn btn-g" onClick={()=>setMostrarFormPartido(true)}><Plus size={12}/> Agregar partido único</button>
                </div>
                {mostrarFormPartido&&<FormPartido nuevoPartido={nuevoPartido} setNuevoPartido={setNuevoPartido} partidoVacio={partidoVacio} crearPartido={crearPartido} setMostrarFormPartido={setMostrarFormPartido}/>}
                {partidosIndividuales.length===0?(
                  <div className="empty"><Activity size={28} style={{margin:'0 auto',opacity:.3,display:'block'}}/><div className="empty-t">Sin partidos individuales</div></div>
                ):partidosIndividuales.map(m=>(
                  <div key={m.id} style={{background:"#111827",border:`1px solid ${expandedPartido===m.id?"rgba(56,189,248,.25)":"rgba(255,255,255,.07)"}`,borderRadius:10,marginBottom:8,overflow:"hidden",transition:"border-color .2s"}}>
                    <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setExpandedPartido(expandedPartido===m.id?null:m.id)}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          <span style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:"#fff"}}>{m.home_team} vs {m.away_team}</span>
                          <span className={`badge ${m.status==='FINALIZADO'?'b-info':m.status==='EN_VIVO'?'b-err':'b-warn'}`}>{m.status}</span>
                          {m.costo_px>0&&<span className="badge b-ok">{m.costo_px} PX</span>}
                        </div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,.3)",marginTop:2}}>{new Date(m.match_date).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})} · {m.city} · {m.phase}</div>
                      </div>
                      <ChevronDown size={14} style={{color:"rgba(255,255,255,.3)",transform:expandedPartido===m.id?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s",flexShrink:0}}/>
                    </div>
                    {expandedPartido===m.id&&(
                      <div style={{borderTop:"1px solid rgba(255,255,255,.05)",padding:"14px 16px"}}>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
                          {[{l:'Cuota 1',v:m.cuota_1??'—',c:'#8dc63f'},{l:'Cuota X',v:m.cuota_x??'—',c:'#38bdf8'},{l:'Cuota 2',v:m.cuota_2??'—',c:'#ef4444'},{l:'Partido #',v:m.match_number??'—',c:'#fff'}].map(s=>(
                            <div key={s.l} style={{background:"rgba(255,255,255,.03)",borderRadius:6,padding:"6px 8px"}}>
                              <div style={{fontSize:9,color:"rgba(255,255,255,.25)",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>{s.l}</div>
                              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:s.c}}>{s.v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          <div style={{display:"flex",alignItems:"center",gap:4}}>
                            <input type="number" min={0} max={20} placeholder="0" className="sc-inp" value={scores[m.id]?.h??''} onChange={e=>setScores(s=>({...s,[m.id]:{...s[m.id]??{h:'',a:''},h:e.target.value}}))}/>
                            <span style={{color:"rgba(255,255,255,.3)",fontWeight:700}}>-</span>
                            <input type="number" min={0} max={20} placeholder="0" className="sc-inp" value={scores[m.id]?.a??''} onChange={e=>setScores(s=>({...s,[m.id]:{...s[m.id]??{h:'',a:''},a:e.target.value}}))}/>
                          </div>
                          {(['LOCAL','EMPATE','VISITANTE'] as const).map(r=>(
                            <button key={r} className="btn" style={{padding:"5px 10px",fontSize:10,background:r==='LOCAL'?'rgba(141,198,63,.12)':r==='EMPATE'?'rgba(56,189,248,.12)':'rgba(239,68,68,.12)',color:r==='LOCAL'?'#8dc63f':r==='EMPATE'?'#38bdf8':'#ef4444',border:`1px solid ${r==='LOCAL'?'rgba(141,198,63,.3)':r==='EMPATE'?'rgba(56,189,248,.3)':'rgba(239,68,68,.3)'}`}} onClick={()=>resolverPartido(m.id,r)}>
                              {r==='LOCAL'?m.home_team:r==='EMPATE'?'Empate':m.away_team}
                            </button>
                          ))}
                          <button className="btn" style={{padding:"5px 10px",fontSize:10,background:"rgba(168,85,247,.12)",color:"#a855f7",border:"1px solid rgba(168,85,247,.3)"}} onClick={()=>setMostrarStats(mostrarStats===m.id?null:m.id)}>
  📊 Stats
</button>
                         <button className="btn btn-b" style={{padding:"5px 10px",fontSize:10}} onClick={()=>{setEditandoPartido(editandoPartido===m.id?null:m.id);setFormEdicionPartido({...m});}}>
  <Edit2 size={10}/> Editar
</button>
<button className="btn btn-r" style={{padding:"5px 10px",fontSize:10,marginLeft:"auto"}} onClick={()=>eliminarPartido(m.id)}><Trash2 size={10}/> Eliminar</button>
{mostrarStats===m.id&&(
                          <div style={{marginTop:10,padding:"12px 14px",background:"rgba(168,85,247,.04)",border:"1px solid rgba(168,85,247,.15)",borderRadius:8}}>
                            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:700,color:"#a855f7",letterSpacing:1,marginBottom:8}}>INYECTAR ESTADÍSTICAS DEL PARTIDO</div>
                            <div style={{fontSize:10,color:"rgba(255,255,255,.3)",marginBottom:8,lineHeight:1.6}}>
                              Pega el JSON con las estadísticas reales. El sistema evaluará automáticamente todas las predicciones.
                            </div>
                            <textarea
                              rows={6}
                              placeholder={`{\n  "resultado": "LOCAL",\n  "total_goles": 2,\n  "goles_local": 2,\n  "goles_visitante": 0,\n  "tarjeta_roja": false,\n  "total_corners": 7,\n  "hubo_var": true,\n  "posesion_local": 58\n}`}
                              value={statsJson[m.id]||''}
                              onChange={e=>setStatsJson(prev=>({...prev,[m.id]:e.target.value}))}
                              style={{width:"100%",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:6,padding:"10px 12px",color:"#fff",fontSize:11,fontFamily:"monospace",resize:"vertical",outline:"none"}}
                            />
                            <div style={{display:"flex",gap:8,marginTop:8}}>
                              <button className="btn" style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)"}} onClick={()=>setMostrarStats(null)}>Cancelar</button>
                              <button className="btn" style={{flex:1,background:"rgba(168,85,247,.15)",color:"#a855f7",border:"1px solid rgba(168,85,247,.3)"}} onClick={()=>evaluarConStats(m.id)} disabled={procesandoStats}>
                                {procesandoStats?'Evaluando...':'✅ Evaluar predicciones'}
                              </button>
                            </div>
                          </div>
                        )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* COMBINADAS */}
            {tab==='combinadas'&&(
              <>
                <div className="sec-h">
                  <div className="sec-t">Combinadas ({torneosCombi.length})</div>
                  <button className="btn btn-b" onClick={()=>setMostrarFormCombinada(!mostrarFormCombinada)}><Plus size={12}/> Nueva combinada</button>
                </div>
                {mostrarFormCombinada&&(
                  <div className="panel" style={{marginBottom:16}}>
                    <div className="panel-title"><Target size={13} style={{color:'#38bdf8'}}/> Crear combinada</div>
                    <div className="form-grid">
                      <div><div className="lbl">Nombre *</div><input className="inp" placeholder='Combinada del Día' value={nuevaCombinada.nombre} onChange={e=>setNuevaCombinada(p=>({...p,nombre:e.target.value}))}/></div>
                      <div><div className="lbl">Tipo</div><select className="inp" value={nuevaCombinada.tipo} onChange={e=>setNuevaCombinada(p=>({...p,tipo:e.target.value}))}><option value="DOBLE">DOBLE — 2 partidos</option><option value="TRIPLE">TRIPLE — 3 partidos</option><option value="BASICA">BÁSICA — 4 partidos</option><option value="ELITE">ELITE — 5+</option></select></div>
                      <div><div className="lbl">Estado</div><select className="inp" value={nuevaCombinada.status} onChange={e=>setNuevaCombinada(p=>({...p,status:e.target.value}))}><option value="ACTIVO">Activo</option><option value="PROXIMO">Próximamente</option><option value="PAUSADO">Pausado</option></select></div>
                      <div><div className="lbl">Fecha *</div><input type="date" className="inp" value={nuevaCombinada.fecha_dia} onChange={e=>setNuevaCombinada(p=>({...p,fecha_dia:e.target.value}))}/></div>
                      <div><div className="lbl">Costo (PX)</div><input type="number" className="inp" min={1} value={nuevaCombinada.costo_px} onChange={e=>setNuevaCombinada(p=>({...p,costo_px:parseInt(e.target.value)||1}))}/></div>
                      <div><div className="lbl">Premio (PX)</div><input type="number" className="inp" min={0} value={nuevaCombinada.premio_px} onChange={e=>setNuevaCombinada(p=>({...p,premio_px:parseInt(e.target.value)||0}))}/></div>
                      <div className="full"><div className="lbl">Descripción</div><input className="inp" placeholder='Acierta los 3 y gana 5,000 PX' value={nuevaCombinada.descripcion} onChange={e=>setNuevaCombinada(p=>({...p,descripcion:e.target.value}))}/></div>
                    </div>
                    <div style={{marginTop:16,borderTop:'1px solid rgba(255,255,255,.05)',paddingTop:16}}>
                      <div className="lbl" style={{marginBottom:10,color:'#8dc63f'}}>Partidos ({nuevaCombinada.partidos_ids.length} seleccionados)</div>
                      <div style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap'}}>
                        <div style={{flex:1,minWidth:150}}><div className="lbl" style={{fontSize:9}}>Filtrar por fecha</div><input type="date" className="inp" style={{marginBottom:0}} value={filtroCombiFecha} onChange={e=>setFiltroCombiFecha(e.target.value)}/></div>
                        <div style={{flex:1,minWidth:150}}><div className="lbl" style={{fontSize:9}}>Filtrar por torneo</div><select className="inp" style={{marginBottom:0}} value={filtroCombiTorneo} onChange={e=>setFiltroCombiTorneo(e.target.value)}><option value="">— Todos —</option>{torneos.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}<option value="INDIVIDUAL">Individuales</option></select></div>
                      </div>
                      <div style={{maxHeight:300,overflowY:'auto',border:'1px solid rgba(255,255,255,.07)',borderRadius:8,padding:8,background:'rgba(0,0,0,.3)'}}>
                        {partidos.filter(p=>{
                          if(p.status!=='PROXIMAMENTE') return false;
                          if(filtroCombiFecha&&!p.match_date.startsWith(filtroCombiFecha)) return false;
                          if(filtroCombiTorneo==='INDIVIDUAL'&&p.tournament_id!==null) return false;
                          if(filtroCombiTorneo&&filtroCombiTorneo!=='INDIVIDUAL'&&p.tournament_id!==filtroCombiTorneo) return false;
                          return true;
                        }).length===0?(
                          <div style={{textAlign:'center',padding:30,color:'rgba(255,255,255,.2)',fontSize:12}}>Sin partidos próximos</div>
                        ):partidos.filter(p=>{
                          if(p.status!=='PROXIMAMENTE') return false;
                          if(filtroCombiFecha&&!p.match_date.startsWith(filtroCombiFecha)) return false;
                          if(filtroCombiTorneo==='INDIVIDUAL'&&p.tournament_id!==null) return false;
                          if(filtroCombiTorneo&&filtroCombiTorneo!=='INDIVIDUAL'&&p.tournament_id!==filtroCombiTorneo) return false;
                          return true;
                        }).map(p=>{
                          const sel=nuevaCombinada.partidos_ids.includes(p.id);
                          return (
                            <div key={p.id} className={`p-sel ${sel?'sel':''}`} onClick={()=>togglePartidoCombinada(p.id)}>
                              <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${sel?'#38bdf8':'rgba(255,255,255,.2)'}`,background:sel?'#38bdf8':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{sel&&<Check size={11} style={{color:'#0a0d14'}}/>}</div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:700,color:'#fff'}}>{p.home_team} vs {p.away_team}</div>
                                <div style={{fontSize:10,color:'rgba(255,255,255,.3)',marginTop:1}}>{new Date(p.match_date).toLocaleDateString('es-CO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})} · {p.phase}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:8,marginTop:14}}>
                      <button className="btn" style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)"}} onClick={()=>{setMostrarFormCombinada(false);setNuevaCombinada(combinadaVacia);}}>Cancelar</button>
                      <button className="btn btn-g" style={{flex:1}} onClick={crearCombinada}><Plus size={13}/> Crear combinada</button>
                    </div>
                  </div>
                )}
                <ListaEventos lista={torneosCombi} tipo="combinada" expandedEvento={expandedEvento} setExpandedEvento={setExpandedEvento} partidos={partidos} actualizarEvento={actualizarEvento} eliminarEvento={eliminarEvento} eliminarPartido={eliminarPartido} editandoEvento={editandoEvento} setEditandoEvento={setEditandoEvento} formEdicion={formEdicion} setFormEdicion={setFormEdicion} guardarEdicion={guardarEdicion} scores={scores} setScores={setScores} statsJson={statsJson} setStatsJson={setStatsJson} mostrarStats={mostrarStats} setMostrarStats={setMostrarStats} procesandoStats={procesandoStats} resolverPartido={resolverPartido} evaluarConStats={evaluarConStats}/>
              </>
            )}

            {/* VIP */}
            {tab==='vip'&&(
              <>
                <div className="sec-h">
                  <div className="sec-t">Eventos VIP ({torneosVip.length})</div>
                  <button className="btn" style={{background:"rgba(168,85,247,.12)",color:"#a855f7",border:"1px solid rgba(168,85,247,.25)"}} onClick={()=>{setNuevoTorneo({...torneoVacio,es_vip:true});setMostrarFormEvento(true);}}>
                    <Plus size={12}/> Nuevo VIP ⭐
                  </button>
                </div>
                {mostrarFormEvento&&<FormEvento tipoFijo="VIP" nuevoTorneo={nuevoTorneo} setNuevoTorneo={setNuevoTorneo} torneoVacio={torneoVacio} crearEvento={crearEvento} setMostrarFormEvento={setMostrarFormEvento}/>}
                {torneosVip.length===0?(
                  <div className="empty"><Star size={28} style={{margin:"0 auto",opacity:.3,display:"block"}}/><div className="empty-t">Sin eventos VIP creados</div></div>
                ):torneosVip.map(t=>(
                  <div key={t.id} style={{background:"#111827",border:`1px solid ${expandedEvento===t.id?"rgba(168,85,247,.4)":"rgba(168,85,247,.15)"}`,borderRadius:10,marginBottom:8,overflow:"hidden",transition:"border-color .2s"}}>
                    <div style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:"rgba(168,85,247,.04)"}} onClick={()=>setExpandedEvento(expandedEvento===t.id?null:t.id)}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          <span style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:700,color:"#fff"}}>{t.name}</span>
                          <span className={`badge ${t.status==='ACTIVO'?'b-ok':t.status==='FINALIZADO'?'b-info':t.status==='PAUSADO'?'b-err':'b-warn'}`}>{t.status}</span>
                          <span className="badge b-purple">⭐ VIP</span>
                          {(t as any).vip_cuotas_activas&&<span className="badge b-info">CUOTAS ON</span>}
                          {(t as any).vip_limite_jugadores>0&&<span className="badge b-warn">Cupo: {(t as any).vip_limite_jugadores}</span>}
                        </div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,.3)",marginTop:3}}>
                          {t.slug} · Entrada: {(t as any).vip_costo_entrada??t.costo_px} PX · Premio: {(t.premio_px||0).toLocaleString()} PX · Acceso: {(t as any).vip_acceso??'TODOS'}
                        </div>
                      </div>
                      <ChevronDown size={14} style={{color:"rgba(168,85,247,.5)",transform:expandedEvento===t.id?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s",flexShrink:0}}/>
                    </div>
                    {expandedEvento===t.id&&(
                      <div style={{borderTop:"1px solid rgba(168,85,247,.15)",padding:"14px 16px"}}>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:14}}>
                          {[{l:"Entrada",v:`${(t as any).vip_costo_entrada??t.costo_px} PX`,c:"#a855f7"},{l:"Premio",v:`${(t.premio_px||0).toLocaleString()} PX`,c:"#8dc63f"},{l:"Acceso",v:(t as any).vip_acceso??'TODOS',c:"#f59e0b"},{l:"Ganadores",v:`Top ${(t as any).vip_max_ganadores??1}`,c:"#38bdf8"},{l:"Cuotas",v:(t as any).vip_cuotas_activas?'Activas':'Inactivas',c:(t as any).vip_cuotas_activas?'#8dc63f':'rgba(255,255,255,.3)'}].map(s=>(
                            <div key={s.l} style={{background:"rgba(168,85,247,.06)",borderRadius:6,padding:"8px 10px",border:"1px solid rgba(168,85,247,.1)"}}>
                              <div style={{fontSize:9,color:"rgba(255,255,255,.25)",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{s.l}</div>
                              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:s.c}}>{s.v}</div>
                            </div>
                          ))}
                        </div>
                        {(t as any).vip_descripcion&&<div style={{fontSize:12,color:"rgba(168,85,247,.7)",marginBottom:12,padding:"8px 10px",background:"rgba(168,85,247,.06)",borderRadius:6,border:"1px solid rgba(168,85,247,.15)"}}>⭐ {(t as any).vip_descripcion}</div>}
                        {editandoEvento===t.id&&formEdicion&&(
  <div style={{background:"rgba(56,189,248,.04)",border:"1px solid rgba(56,189,248,.2)",borderRadius:8,padding:14,marginBottom:14}}>
    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:11,color:"#38bdf8",letterSpacing:1,marginBottom:12,display:"flex",alignItems:"center",gap:6}}><Edit2 size={11}/> EDITANDO EVENTO VIP</div>
    <div className="form-grid">
      <div><div className="lbl">Nombre *</div><input className="inp" value={formEdicion.name||''} onChange={e=>setFormEdicion((p:any)=>({...p,name:e.target.value}))}/></div>
      <div><div className="lbl">Slug *</div><input className="inp" value={formEdicion.slug||''} onChange={e=>setFormEdicion((p:any)=>({...p,slug:e.target.value}))}/></div>
      <div><div className="lbl">Estado</div><select className="inp" value={formEdicion.status||''} onChange={e=>setFormEdicion((p:any)=>({...p,status:e.target.value}))}><option value="ACTIVO">Activo</option><option value="PROXIMO">Próximamente</option><option value="PAUSADO">Pausado</option><option value="FINALIZADO">Finalizado</option></select></div>
      <div><div className="lbl">Premio PX</div><input type="number" className="inp" value={formEdicion.premio_px||0} onChange={e=>setFormEdicion((p:any)=>({...p,premio_px:parseInt(e.target.value)||0}))}/></div>
      <div><div className="lbl">Costo entrada VIP (PX)</div><input type="number" className="inp" value={formEdicion.vip_costo_entrada||0} onChange={e=>setFormEdicion((p:any)=>({...p,vip_costo_entrada:parseInt(e.target.value)||0}))}/></div>
      <div><div className="lbl">Límite jugadores</div><input type="number" className="inp" value={formEdicion.vip_limite_jugadores||0} onChange={e=>setFormEdicion((p:any)=>({...p,vip_limite_jugadores:parseInt(e.target.value)||0}))}/></div>
      <div><div className="lbl">Acceso</div><select className="inp" value={formEdicion.vip_acceso||'TODOS'} onChange={e=>setFormEdicion((p:any)=>({...p,vip_acceso:e.target.value}))}><option value="TODOS">Abierto a todos</option><option value="MEMBRESIA">Solo membresía</option><option value="INVITACION">Solo invitación</option></select></div>
      <div><div className="lbl">Máx ganadores</div><input type="number" className="inp" value={formEdicion.vip_max_ganadores||1} onChange={e=>setFormEdicion((p:any)=>({...p,vip_max_ganadores:parseInt(e.target.value)||1}))}/></div>
      <div><div className="lbl">Premio garantizado (PX)</div><input type="number" className="inp" value={formEdicion.vip_premio_garantizado||0} onChange={e=>setFormEdicion((p:any)=>({...p,vip_premio_garantizado:parseInt(e.target.value)||0}))}/></div>
      <div style={{display:'flex',alignItems:'center',gap:10,paddingTop:20}}><button className={`toggle ${formEdicion.vip_cuotas_activas?'on':'off'}`} onClick={()=>setFormEdicion((p:any)=>({...p,vip_cuotas_activas:!p.vip_cuotas_activas}))}/><div><div style={{fontSize:12,color:'#fff'}}>Cuotas activas</div></div></div>
      <div className="full"><div className="lbl">Descripción VIP</div><input className="inp" value={formEdicion.vip_descripcion||''} onChange={e=>setFormEdicion((p:any)=>({...p,vip_descripcion:e.target.value}))}/></div>
      <div><div className="lbl">Fecha inicio</div><input type="datetime-local" className="inp" value={formEdicion.fecha_inicio||''} onChange={e=>setFormEdicion((p:any)=>({...p,fecha_inicio:e.target.value}))}/></div>
      <div><div className="lbl">Fecha cierre</div><input type="datetime-local" className="inp" value={formEdicion.fecha_cierre||''} onChange={e=>setFormEdicion((p:any)=>({...p,fecha_cierre:e.target.value}))}/></div>
    </div>
    <div style={{display:"flex",gap:8,marginTop:8}}>
      <button className="btn" style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)"}} onClick={()=>{setEditandoEvento(null);setFormEdicion(null);}}>Cancelar</button>
      <button className="btn btn-g" style={{flex:1}} onClick={guardarEdicion}><Check size={12}/> Guardar cambios</button>
    </div>
  </div>
)}
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
                          <button className="btn btn-a" style={{padding:"5px 10px",fontSize:10}} onClick={()=>actualizarEvento(t.id,{status:t.status==='ACTIVO'?'PAUSADO':'ACTIVO'})}>{t.status==='ACTIVO'?<><Lock size={10}/> Pausar</>:<><Unlock size={10}/> Activar</>}</button>
                          <button className="btn btn-a" style={{padding:"5px 10px",fontSize:10}} onClick={()=>actualizarEvento(t.id,{featured:!t.featured})}><Star size={10}/> {t.featured?'Quitar destacado':'Destacar'}</button>
                          <button className="btn btn-b" style={{padding:"5px 10px",fontSize:10}} onClick={()=>{setEditandoEvento(t.id);setFormEdicion({...t});}}>
  <Edit2 size={10}/> Editar
</button>
<button className="btn btn-b" style={{padding:"5px 10px",fontSize:10}} onClick={()=>{setEditandoEvento(editandoEvento===t.id?null:t.id);setFormEdicion({...t});}}>
  <Edit2 size={10}/> Editar
</button>
<button className="btn btn-r" style={{padding:"5px 10px",fontSize:10}} onClick={()=>eliminarEvento(t.id)}><Trash2 size={10}/> Eliminar</button>
                        </div>
                        <div style={{borderTop:"1px solid rgba(168,85,247,.1)",paddingTop:14}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:11,color:"#a855f7",letterSpacing:1,display:"flex",alignItems:"center",gap:6}}><Activity size={12}/> PARTIDOS VIP ({partidos.filter(p=>p.tournament_id===t.id).length})</div>
                            <button className="btn" style={{background:"rgba(168,85,247,.12)",color:"#a855f7",border:"1px solid rgba(168,85,247,.25)",padding:"5px 12px",fontSize:10}} onClick={()=>setNuevoPartido({...partidoVacio,tournament_id:t.id,es_individual:false})}><Plus size={11}/> Agregar partido</button>
                          </div>
                          {nuevoPartido.tournament_id===t.id&&(
                            <div style={{background:"rgba(168,85,247,.04)",border:"1px solid rgba(168,85,247,.2)",borderRadius:8,padding:14,marginBottom:12}}>
                              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:11,color:"#a855f7",letterSpacing:1,marginBottom:12,display:"flex",alignItems:"center",gap:6}}><Plus size={11}/> NUEVO PARTIDO VIP</div>
                              <div className="form-grid">
                                <div><div className="lbl">Equipo local *</div><input className="inp" placeholder="Colombia" value={nuevoPartido.home_team} onChange={e=>setNuevoPartido(p=>({...p,home_team:e.target.value}))}/></div>
                                <div><div className="lbl">Equipo visitante *</div><input className="inp" placeholder="Brasil" value={nuevoPartido.away_team} onChange={e=>setNuevoPartido(p=>({...p,away_team:e.target.value}))}/></div>
                                <div><div className="lbl">Flag local</div><input className="inp" placeholder="co" value={nuevoPartido.home_flag} onChange={e=>setNuevoPartido(p=>({...p,home_flag:e.target.value}))}/></div>
                                <div><div className="lbl">Flag visitante</div><input className="inp" placeholder="br" value={nuevoPartido.away_flag} onChange={e=>setNuevoPartido(p=>({...p,away_flag:e.target.value}))}/></div>
                                <div className="full"><div className="lbl">Fecha y hora *</div><input type="datetime-local" className="inp" value={nuevoPartido.match_date} onChange={e=>setNuevoPartido(p=>({...p,match_date:e.target.value}))}/></div>
                                <div><div className="lbl">Estadio</div><input className="inp" placeholder="MetLife Stadium" value={nuevoPartido.stadium} onChange={e=>setNuevoPartido(p=>({...p,stadium:e.target.value}))}/></div>
                                <div><div className="lbl">Ciudad</div><input className="inp" placeholder="Nueva York" value={nuevoPartido.city} onChange={e=>setNuevoPartido(p=>({...p,city:e.target.value}))}/></div>
                                <div><div className="lbl">Fase</div><select className="inp" value={nuevoPartido.phase} onChange={e=>setNuevoPartido(p=>({...p,phase:e.target.value}))}>{['Amistoso','Grupos','Octavos','Cuartos','Semifinal','Tercer Puesto','Final'].map(f=><option key={f} value={f}>{f}</option>)}</select></div>
                                <div><div className="lbl">Número partido</div><input type="number" className="inp" min={1} value={nuevoPartido.match_number} onChange={e=>setNuevoPartido(p=>({...p,match_number:parseInt(e.target.value)||1}))}/></div>
                                {(t as any).vip_cuotas_activas&&(<>
                                  <div><div className="lbl">Cuota Local</div><input type="number" step="0.01" className="inp" placeholder="1.85" value={nuevoPartido.cuota_1} onChange={e=>setNuevoPartido(p=>({...p,cuota_1:e.target.value}))}/></div>
                                  <div><div className="lbl">Cuota Empate</div><input type="number" step="0.01" className="inp" placeholder="3.20" value={nuevoPartido.cuota_x} onChange={e=>setNuevoPartido(p=>({...p,cuota_x:e.target.value}))}/></div>
                                  <div><div className="lbl">Cuota Visitante</div><input type="number" step="0.01" className="inp" placeholder="2.40" value={nuevoPartido.cuota_2} onChange={e=>setNuevoPartido(p=>({...p,cuota_2:e.target.value}))}/></div>
                                </>)}
                                <div><div className="lbl">Costo entrada (PX)</div><input type="number" className="inp" min={0} value={nuevoPartido.costo_px} onChange={e=>setNuevoPartido(p=>({...p,costo_px:parseInt(e.target.value)||0}))}/></div>
                                <div><div className="lbl">Premio (PX)</div><input type="number" className="inp" min={0} value={nuevoPartido.premio_px} onChange={e=>setNuevoPartido(p=>({...p,premio_px:parseInt(e.target.value)||0}))}/></div>
                              </div>
                              <div style={{display:"flex",gap:8,marginTop:4}}>
                                <button className="btn" style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)"}} onClick={()=>setNuevoPartido(partidoVacio)}>Cancelar</button>
                                <button className="btn" style={{flex:1,background:"rgba(168,85,247,.15)",color:"#a855f7",border:"1px solid rgba(168,85,247,.3)"}} onClick={async()=>{
                                  if (!nuevoPartido.home_team||!nuevoPartido.away_team||!nuevoPartido.match_date){showMsg('Completa los campos obligatorios','err');return;}
                                  const {error}=await supabase.from('matches').insert({
                                    tournament_id:t.id, home_team:nuevoPartido.home_team, away_team:nuevoPartido.away_team,
                                    home_flag:nuevoPartido.home_flag.toLowerCase()||'un', away_flag:nuevoPartido.away_flag.toLowerCase()||'un',
                                    match_date:nuevoPartido.match_date, stadium:nuevoPartido.stadium||'', city:nuevoPartido.city||'',
                                    match_number:nuevoPartido.match_number,
                                    cuota_1:nuevoPartido.cuota_1?parseFloat(nuevoPartido.cuota_1 as string):null,
                                    cuota_x:nuevoPartido.cuota_x?parseFloat(nuevoPartido.cuota_x as string):null,
                                    cuota_2:nuevoPartido.cuota_2?parseFloat(nuevoPartido.cuota_2 as string):null,
                                    phase:nuevoPartido.phase||'Final', costo_operacion:nuevoPartido.costo_px||0,
status:'PROXIMAMENTE',
                                  });
                                  if (error){showMsg('Error: '+error.message,'err');return;}
                                  showMsg('Partido VIP agregado','ok');
                                  setNuevoPartido(p=>({...partidoVacio,tournament_id:t.id,es_individual:false,match_number:p.match_number+1}));
                                  cargarDatos();
                                }}><Plus size={12}/> Publicar partido VIP</button>
                              </div>
                            </div>
                          )}
                          {partidos.filter(p=>p.tournament_id===t.id).length===0?(
                            <div style={{fontSize:11,color:"rgba(255,255,255,.2)",padding:"12px 0",textAlign:"center"}}>Sin partidos aún</div>
                          ):(
                            <div style={{display:'grid',gap:6}}>
                              {partidos.filter(p=>p.tournament_id===t.id).map(m=>(
                                <div key={m.id} style={{background:"rgba(168,85,247,.04)",border:"1px solid rgba(168,85,247,.12)",borderRadius:8,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                                      <span className={`badge ${m.status==='FINALIZADO'?'b-info':m.status==='EN_VIVO'?'b-err':'b-warn'}`} style={{fontSize:8}}>{m.status}</span>
                                      <span style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:"#fff"}}>{m.home_team} vs {m.away_team}</span>
                                      <span style={{fontSize:10,color:"rgba(168,85,247,.6)"}}>{m.phase}</span>
                                    </div>
                                    <div style={{fontSize:10,color:"rgba(255,255,255,.3)",marginTop:3}}>
                                      {new Date(m.match_date).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                                      {m.stadium&&<span style={{marginLeft:6}}>· {m.stadium}</span>}
                                      {m.city&&<span style={{marginLeft:6}}>· {m.city}</span>}
                                    </div>
                                  </div>
                                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                                    {m.costo_px>0&&<span className="badge b-purple">{m.costo_px} PX</span>}
                                    {m.premio_px>0&&<span className="badge b-ok">{m.premio_px.toLocaleString()} PX</span>}
                                    <button className="btn btn-r" style={{padding:"3px 8px",fontSize:9}} onClick={()=>eliminarPartido(m.id)}><Trash2 size={9}/></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* RETIROS */}
            {tab==='retiros'&&(
              <>
                <div className="sec-h"><div className="sec-t">Retiros ({retirosFiltrados.length})</div></div>
                <div className="filtro-tabs">
                  {['PENDIENTE','EN_REVISION','APROBADO','PAGADO','RECHAZADO','TODOS'].map(e=>(
                    <button key={e} className={`filtro-tab ${retiroFiltroEstado===e?'on':''}`} style={{padding:'5px 11px'}} onClick={()=>setRetiroFiltroEstado(e)}>
                      {e} <span style={{opacity:.6}}>({e==='TODOS'?retiros.length:retiros.filter(r=>r.estado===e).length})</span>
                    </button>
                  ))}
                </div>
                {retirosFiltrados.length===0?(
                  <div className="empty"><CheckCircle size={28} style={{margin:'0 auto',opacity:.3,display:'block'}}/><div className="empty-t">Sin retiros</div></div>
                ):retirosFiltrados.map(r=>(
                  <div key={r.id} className="retiro-card" style={{borderLeftColor:r.estado==='PAGADO'?'#22c55e':r.estado==='APROBADO'?'#8dc63f':r.estado==='RECHAZADO'?'#ef4444':'#f59e0b'}}>
                    <div style={{display:'flex',flexWrap:'wrap',alignItems:'flex-start',gap:10}}>
                      <div style={{flex:1,minWidth:200}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
                          <span style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:600,color:'#fff'}}>{r.nombre_beneficiario}</span>
                          <span className={`badge ${r.estado==='PAGADO'?'b-paid':r.estado==='APROBADO'?'b-ok':r.estado==='RECHAZADO'?'b-err':r.estado==='EN_REVISION'?'b-info':'b-warn'}`}>{r.estado}</span>
                          {(r as any).metodo_retiro==='PUNTO_FISICO'?<span className="badge b-purple">🏪 Punto físico</span>:<span className="badge b-info">🏦 Transferencia</span>}
                        </div>
                        <div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>{r.metodo_pago} · <b style={{color:'#fff'}}>{r.numero_cuenta}</b></div>
                        {r.banco&&<div style={{fontSize:10,color:'rgba(255,255,255,.25)',marginTop:2}}>{r.banco} · {r.tipo_cuenta}</div>}
                        <div style={{fontSize:10,color:'rgba(255,255,255,.25)',marginTop:2}}>{new Date(r.created_at).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                        {r.notas_admin&&<div style={{fontSize:10,color:'rgba(56,189,248,.7)',marginTop:4,display:'flex',alignItems:'center',gap:4}}><FileText size={10}/> {r.notas_admin}</div>}
                        {r.motivo_rechazo&&<div style={{fontSize:10,color:'rgba(239,68,68,.7)',marginTop:4}}>❌ {r.motivo_rechazo}</div>}
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:20,fontWeight:700,color:'#f59e0b'}}>{r.monto_local?.toLocaleString()} {r.moneda}</div>
                        <div style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>{r.creditos_solicitados?.toLocaleString()} créditos</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap',alignItems:'center'}}>
                      {r.estado==='PENDIENTE'&&<>
                        <button className="btn btn-g" onClick={()=>gestionarRetiroCompleto(r.id,'APROBADO')}><Check size={11}/> Aprobar</button>
                        <button className="btn btn-b" style={{background:'rgba(56,189,248,.1)',color:'#38bdf8',border:'1px solid rgba(56,189,248,.2)'}} onClick={()=>gestionarRetiroCompleto(r.id,'EN_REVISION')}>En revisión</button>
                        <button className="btn btn-r" onClick={()=>{setRetiroSelId(r.id);setMotivoRechazo('');setNotaRetiro(r.notas_admin||'');}}><X size={11}/> Rechazar</button>
                      </>}
                      {r.estado==='EN_REVISION'&&<>
                        <button className="btn btn-g" onClick={()=>gestionarRetiroCompleto(r.id,'APROBADO')}><Check size={11}/> Aprobar</button>
                        <button className="btn btn-r" onClick={()=>{setRetiroSelId(r.id);setMotivoRechazo('');setNotaRetiro(r.notas_admin||'');}}><X size={11}/> Rechazar</button>
                      </>}
                      {r.estado==='APROBADO'&&<button className="btn" style={{background:'rgba(34,197,94,.12)',color:'#22c55e',border:'1px solid rgba(34,197,94,.25)'}} onClick={()=>gestionarRetiroCompleto(r.id,'PAGADO',r.notas_admin)}><CheckCircle size={11}/> Marcar PAGADO</button>}
                      {retiroSelId!==r.id&&<button className="btn" style={{background:'rgba(56,189,248,.06)',color:'#38bdf8',border:'1px solid rgba(56,189,248,.15)',marginLeft:'auto'}} onClick={()=>{setRetiroSelId(r.id);setNotaRetiro(r.notas_admin||'');setMotivoRechazo('');}}><FileText size={11}/> Nota</button>}
                    </div>
                    {retiroSelId===r.id&&(
                      <div style={{marginTop:10,padding:'12px',background:'rgba(255,255,255,.03)',borderRadius:8,border:'1px solid rgba(255,255,255,.07)'}}>
                        {(r.estado==='PENDIENTE'||r.estado==='EN_REVISION')&&<div style={{marginBottom:8}}><div className="lbl" style={{marginBottom:4}}>Motivo rechazo</div><input className="inp" style={{marginBottom:0}} placeholder="Datos bancarios incorrectos" value={motivoRechazo} onChange={e=>setMotivoRechazo(e.target.value)}/></div>}
                        <div className="lbl" style={{marginBottom:4,marginTop:8}}>Nota admin</div>
                        <input className="inp" style={{marginBottom:8}} placeholder="Nota interna..." value={notaRetiro} onChange={e=>setNotaRetiro(e.target.value)}/>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          <button className="btn" style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)"}} onClick={()=>setRetiroSelId(null)}>Cancelar</button>
                          <button className="btn btn-b" style={{background:'rgba(56,189,248,.1)',color:'#38bdf8',border:'1px solid rgba(56,189,248,.2)'}} onClick={()=>gestionarRetiroCompleto(r.id,r.estado as any,notaRetiro)}><FileText size={11}/> Guardar nota</button>
                          {(r.estado==='PENDIENTE'||r.estado==='EN_REVISION')&&<button className="btn btn-r" style={{flex:1}} onClick={()=>gestionarRetiroCompleto(r.id,'RECHAZADO',notaRetiro,motivoRechazo)}><X size={11}/> Confirmar rechazo</button>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* USUARIOS */}
            {tab==='usuarios'&&(
              <>
                <div className="sec-h"><div className="sec-t">Usuarios</div></div>
                <div className="search-box">
                  {isSearchingUsers?<Loader2 size={13} className="spin" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#8dc63f'}}/>:<Search size={13} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,.3)',pointerEvents:'none'}}/>}
                  <input className="inp" style={{paddingLeft:32}} placeholder="Buscar por username o email..." value={buscarUsuario} onChange={e=>setBuscarUsuario(e.target.value)}/>
                </div>
                <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,overflow:"hidden"}}>
                  <div style={{overflowX:"auto"}}>
                    <table className="tbl">
                      <thead><tr><th>Usuario</th><th>País</th><th>Vidas</th><th>PX</th><th>Estado</th><th>Rol</th><th>Registro</th><th>Acciones</th></tr></thead>
                      <tbody>
                        {usuarios.length===0?<tr><td colSpan={8} style={{textAlign:'center',padding:20,color:'rgba(255,255,255,.25)'}}>Sin usuarios</td></tr>
                        :usuarios.map(u=>(
                          <tr key={u.id}>
                            <td><div style={{fontFamily:"'Oswald',sans-serif",fontWeight:600,color:'#fff',fontSize:12}}>{u.username||'—'}</div><div style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>{u.email}</div></td>
                            <td style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>{u.country||'—'}</td>
                            <td style={{fontFamily:"'Oswald',sans-serif",color:'#8dc63f',fontWeight:700}}>{u.lives??0}</td>
                            <td style={{fontFamily:"'Oswald',sans-serif",color:'#38bdf8',fontWeight:700}}>{u.pitchx_balance?.toLocaleString()??0}</td>
                            <td><span className={`badge ${u.status==='VIVO'||u.status==='active'?'b-ok':u.status==='BLOQUEADO'?'b-err':'b-warn'}`}>{u.status||'—'}</span></td>
                            <td><span className={`badge ${u.role==='admin'?'b-err':u.role==='promotor'?'b-purple':u.role==='distribuidor'?'b-info':'b-ok'}`}>{u.role||'user'}</span></td>
                            <td style={{fontSize:10,color:'rgba(255,255,255,.3)',whiteSpace:'nowrap'}}>{new Date(u.created_at).toLocaleDateString('es-CO')}</td>
                            <td><div style={{display:'flex',gap:4}}>
                              <button className="btn btn-a" style={{padding:'4px 8px',fontSize:9}} onClick={()=>abrirAjuste(u)}><Zap size={10}/> Ajustar</button>
                              <button className={`btn ${u.status==='BLOQUEADO'?'btn-g':'btn-r'}`} style={{padding:'4px 8px',fontSize:9}} onClick={()=>bloquearUsuario(u.id,u.status!=='BLOQUEADO')}>{u.status==='BLOQUEADO'?<><Unlock size={10}/> Activar</>:<><Ban size={10}/> Bloquear</>}</button>
                            </div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {mostrarAjuste&&(
                  <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',backdropFilter:'blur(4px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>{if(e.target===e.currentTarget)setMostrarAjuste(false);}}>
                    <div style={{width:'100%',maxWidth:420,background:'#0f1420',border:'1px solid rgba(245,158,11,.2)',borderRadius:14,overflow:'hidden'}}>
                      <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,.07)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <span style={{fontFamily:"'Oswald',sans-serif",fontSize:15,fontWeight:700,color:'#fff'}}>Ajuste — <span style={{color:'#f59e0b'}}>{ajusteUsername}</span></span>
                        <button style={{background:'none',border:'none',color:'rgba(255,255,255,.3)',cursor:'pointer'}} onClick={()=>setMostrarAjuste(false)}><X size={16}/></button>
                      </div>
                      <div style={{padding:20}}>
                        <div className="form-grid">
                          <div><div className="lbl">Ajuste PX</div><input type="number" className="inp" style={{marginBottom:0}} value={ajustePx} onChange={e=>setAjustePx(parseInt(e.target.value)||0)}/></div>
                          <div><div className="lbl">Ajuste vidas</div><input type="number" className="inp" style={{marginBottom:0}} value={ajusteVidas} onChange={e=>setAjusteVidas(parseInt(e.target.value)||0)}/></div>
                        </div>
                        <div style={{marginTop:12}}><div className="lbl" style={{marginBottom:4}}>Motivo</div><input className="inp" style={{marginBottom:0}} placeholder="Bono especial..." value={ajusteNota} onChange={e=>setAjusteNota(e.target.value)}/></div>
                      </div>
                      <div style={{padding:'0 20px 20px',display:'flex',gap:8}}>
                        <button className="btn" style={{flex:1,background:'rgba(255,255,255,.05)',color:'rgba(255,255,255,.4)'}} onClick={()=>setMostrarAjuste(false)}>Cancelar</button>
                        <button className="btn btn-g" style={{flex:2}} onClick={aplicarAjuste} disabled={guardandoAjuste||(!ajustePx&&!ajusteVidas)}>{guardandoAjuste?<><Loader2 size={12} style={{animation:'spin 1s linear infinite'}}/> Aplicando...</>:<><Check size={12}/> Aplicar ajuste</>}</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* INSCRIPCIONES */}
            {tab==='inscripciones'&&(
              <>
                <div className="sec-h"><div className="sec-t">Inscripciones por evento</div></div>
                <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,padding:'12px 16px',marginBottom:16}}>
                  <div className="lbl" style={{marginBottom:6}}>Selecciona un evento</div>
                  <select className="inp" style={{marginBottom:0}} value={torneoInscFiltro} onChange={e=>{setTorneoInscFiltro(e.target.value);if(e.target.value)cargarInscripciones(e.target.value);}}>
                    <option value="">— Selecciona evento —</option>
                    {torneos.map(t=><option key={t.id} value={t.id}>{t.name} ({t.tipo_evento})</option>)}
                  </select>
                </div>
                {torneoInscFiltro&&(<>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
                    {[{l:'Total',v:inscripciones.length,c:'#fff'},{l:'Activos',v:inscripciones.filter(i=>i.status==='ACTIVO').length,c:'#8dc63f'},{l:'En coma',v:inscripciones.filter(i=>i.status==='EN_COMA').length,c:'#f59e0b'},{l:'Ganadores',v:inscripciones.filter(i=>i.status==='GANADOR').length,c:'#a855f7'}].map(s=>(
                      <div key={s.l} style={{background:"#111827",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,padding:14}}>
                        <div style={{fontSize:9,color:"rgba(255,255,255,.25)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>{s.l}</div>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  {inscripciones.length===0?<div className="empty"><Users size={28} style={{margin:'0 auto',opacity:.3,display:'block'}}/><div className="empty-t">Sin inscripciones</div></div>:(
                    <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,overflow:"hidden"}}>
                      <div style={{overflowX:"auto"}}>
                        <table className="tbl">
                          <thead><tr><th>Jugador</th><th>Vidas</th><th>Estado</th><th>Nivel</th><th>Fecha ingreso</th></tr></thead>
                          <tbody>{inscripciones.map(i=>(
                            <tr key={i.id}>
                              <td><div style={{fontFamily:"'Oswald',sans-serif",fontWeight:600,color:'#fff',fontSize:12}}>{i.profiles?.username||'—'}</div><div style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>{i.profiles?.email||i.user_id.substring(0,8)+'...'}</div></td>
                              <td style={{fontFamily:"'Oswald',sans-serif",color:'#8dc63f',fontWeight:700}}>{i.vidas} ❤️ <span style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>/{i.vidas_iniciales}</span></td>
                              <td><span className={`badge ${i.status==='ACTIVO'?'b-ok':i.status==='GANADOR'?'b-purple':i.status==='EN_COMA'?'b-warn':'b-err'}`}>{i.status}</span></td>
                              <td style={{fontFamily:"'Oswald',sans-serif",color:'#38bdf8'}}>{i.nivel_ingreso}</td>
                              <td style={{fontSize:10,color:'rgba(255,255,255,.3)',whiteSpace:'nowrap'}}>{new Date(i.fecha_ingreso).toLocaleDateString('es-CO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>)}
              </>
            )}

            {/* DISTRIBUIDORES */}
            {tab==='distribuidores'&&(
              <>
                <div className="sec-h"><div className="sec-t">Distribuidores ({distribuidores.length})</div><button className="btn btn-g" onClick={()=>setMostrarFormDist(!mostrarFormDist)}><Plus size={12}/> {mostrarFormDist?'Cancelar':'Nuevo distribuidor'}</button></div>
                {mostrarFormDist&&(
                  <div className="panel" style={{marginBottom:16}}>
                    <div className="panel-title"><UserPlus size={13} style={{color:'#8dc63f'}}/> Crear distribuidor</div>
                    <div className="form-grid">
                      <div><div className="lbl">Promotor *</div><select className="inp" value={nuevoDist.promotor_id} onChange={e=>setNuevoDist(p=>({...p,promotor_id:e.target.value}))}><option value="">— Selecciona —</option>{promotoresList.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                      <div><div className="lbl">Nombre *</div><input className="inp" value={nuevoDist.nombre} onChange={e=>setNuevoDist(p=>({...p,nombre:e.target.value}))}/></div>
                      <div><div className="lbl">Email *</div><input type="email" className="inp" value={nuevoDist.email} onChange={e=>setNuevoDist(p=>({...p,email:e.target.value}))}/></div>
                      <div><div className="lbl">Teléfono</div><input className="inp" value={nuevoDist.telefono} onChange={e=>setNuevoDist(p=>({...p,telefono:e.target.value}))}/></div>
                      <div><div className="lbl">País</div><input className="inp" value={nuevoDist.pais} onChange={e=>setNuevoDist(p=>({...p,pais:e.target.value}))}/></div>
                      <div><div className="lbl">% Comisión recarga</div><input type="number" step="0.5" min={0} max={20} className="inp" value={nuevoDist.comision_recarga_pct} onChange={e=>setNuevoDist(p=>({...p,comision_recarga_pct:parseFloat(e.target.value)||0}))}/></div>
                      <div><div className="lbl">% Comisión premio</div><input type="number" step="0.5" min={0} max={15} className="inp" value={nuevoDist.comision_premio_pct} onChange={e=>setNuevoDist(p=>({...p,comision_premio_pct:parseFloat(e.target.value)||0}))}/></div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="btn" style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)"}} onClick={()=>setMostrarFormDist(false)}>Cancelar</button>
                      <button className="btn btn-g" style={{flex:1}} onClick={crearDistribuidor}><Plus size={12}/> Crear</button>
                    </div>
                  </div>
                )}
                <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,overflow:"hidden"}}>
                  <div style={{overflowX:"auto"}}>
                    {distribuidores.length===0?<div style={{textAlign:"center",padding:40,color:"rgba(255,255,255,.2)",fontFamily:"'Oswald',sans-serif",fontSize:13}}>Sin distribuidores</div>
                    :<table className="tbl"><thead><tr><th>Nombre</th><th>Promotor</th><th>País</th><th>% Recarga</th><th>% Premio</th><th>Estado</th><th>Acción</th></tr></thead>
                      <tbody>{distribuidores.map(d=>{
                        const prom=promotoresList.find(p=>p.id===d.promotor_id);
                        return <tr key={d.id}>
                          <td><div style={{color:"#fff",fontWeight:500}}>{d.nombre}</div><div style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>{d.email}</div></td>
                          <td style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>{prom?.nombre??"—"}</td>
                          <td style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>{d.pais}</td>
                          <td style={{fontFamily:"'Oswald',sans-serif",color:'#8dc63f',fontWeight:700}}>{d.comision_recarga_pct}%</td>
                          <td style={{fontFamily:"'Oswald',sans-serif",color:'#f59e0b',fontWeight:700}}>{d.comision_premio_pct}%</td>
                          <td><span className={`badge ${d.activo?"b-ok":"b-err"}`}>{d.activo?"Activo":"Inactivo"}</span></td>
                          <td><button onClick={()=>toggleDistribuidor(d.id,d.activo)} className={`btn ${d.activo?"btn-r":"btn-g"}`} style={{padding:"4px 10px",fontSize:9}}>{d.activo?<><EyeOff size={10}/> Desactivar</>:<><Eye size={10}/> Activar</>}</button></td>
                        </tr>;
                      })}</tbody></table>}
                  </div>
                </div>
              </>
            )}

            {/* CODIGOS PIN */}
            {tab==='pins'&&(
              <>
                <div className="sec-h"><div className="sec-t">Códigos PIN ({pins.filter(p=>p.estado==='DISPONIBLE').length} disponibles)</div><button className="btn btn-g" onClick={()=>setMostrarFormPin(!mostrarFormPin)}><Plus size={12}/> {mostrarFormPin?'Cancelar':'Generar PINs'}</button></div>
                {mostrarFormPin&&(
                  <div className="panel" style={{marginBottom:16}}>
                    <div className="panel-title"><Key size={13} style={{color:'#a855f7'}}/> Generar lote de PINs</div>
                    <div className="form-grid">
                      <div><div className="lbl">Cantidad (máx 500)</div><input type="number" className="inp" min={1} max={500} value={nuevoPin.cantidad} onChange={e=>setNuevoPin(p=>({...p,cantidad:parseInt(e.target.value)||1}))}/></div>
                      <div><div className="lbl">Vidas por PIN</div><input type="number" className="inp" min={0} value={nuevoPin.vidas} onChange={e=>setNuevoPin(p=>({...p,vidas:parseInt(e.target.value)||0}))}/></div>
                      <div><div className="lbl">PX por PIN</div><input type="number" className="inp" min={0} value={nuevoPin.creditos} onChange={e=>setNuevoPin(p=>({...p,creditos:parseInt(e.target.value)||0}))}/></div>
                      <div><div className="lbl">ID de lote</div><input className="inp" placeholder="PROMO-JUNIO-2026" value={nuevoPin.lote_id} onChange={e=>setNuevoPin(p=>({...p,lote_id:e.target.value}))}/></div>
                      <div className="full"><div className="lbl">Fecha expiración</div><input type="datetime-local" className="inp" value={nuevoPin.expira_en} onChange={e=>setNuevoPin(p=>({...p,expira_en:e.target.value}))}/></div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="btn" style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)"}} onClick={()=>setMostrarFormPin(false)}>Cancelar</button>
                      <button className="btn btn-g" style={{flex:1}} onClick={generarPins} disabled={generandoPins}>{generandoPins?<><Loader2 size={12} style={{animation:'spin 1s linear infinite'}}/> Generando...</>:<><Key size={12}/> Generar {nuevoPin.cantidad} PINs</>}</button>
                    </div>
                  </div>
                )}
                <div className="filtro-tabs">
                  {['DISPONIBLE','USADO','EXPIRADO','ANULADO','TODOS'].map(e=>(
                    <button key={e} className={`filtro-tab ${pinFiltro===e?'on':''}`} style={{padding:'5px 11px'}} onClick={()=>setPinFiltro(e)}>
                      {e} <span style={{opacity:.6}}>({e==='TODOS'?pins.length:pins.filter(p=>p.estado===e).length})</span>
                    </button>
                  ))}
                </div>
                <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,overflow:"hidden"}}>
                  <div style={{overflowX:"auto"}}>
                    {pins.filter(p=>pinFiltro==='TODOS'?true:p.estado===pinFiltro).length===0?<div style={{textAlign:"center",padding:32,color:"rgba(255,255,255,.2)",fontFamily:"'Oswald',sans-serif",fontSize:13}}>Sin PINs</div>
                    :<table className="tbl"><thead><tr><th>Código</th><th>Vidas</th><th>PX</th><th>Lote</th><th>Estado</th><th>Expira</th><th>Acción</th></tr></thead>
                      <tbody>{pins.filter(p=>pinFiltro==='TODOS'?true:p.estado===pinFiltro).map(p=>(
                        <tr key={p.id}>
                          <td><span className="pin-code">{p.codigo}</span></td>
                          <td style={{fontFamily:"'Oswald',sans-serif",color:'#8dc63f',fontWeight:700}}>{p.vidas} ❤️</td>
                          <td style={{fontFamily:"'Oswald',sans-serif",color:'#38bdf8',fontWeight:700}}>{p.creditos} PX</td>
                          <td style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>{p.lote_id||'—'}</td>
                          <td><span className={`badge ${p.estado==='DISPONIBLE'?'b-ok':p.estado==='USADO'?'b-info':p.estado==='ANULADO'?'b-err':'b-warn'}`}>{p.estado}</span></td>
                          <td style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>{p.expira_en?new Date(p.expira_en).toLocaleDateString('es-CO'):'Sin expiración'}</td>
                          <td>{p.estado==='DISPONIBLE'&&<button className="btn btn-r" style={{padding:"4px 8px",fontSize:9}} onClick={()=>anularPin(p.id)}><X size={10}/> Anular</button>}</td>
                        </tr>
                      ))}</tbody></table>}
                  </div>
                </div>
              </>
            )}

            {/* TASAS */}
            {tab==='tasas'&&(
              <>
                <div className="sec-h"><div className="sec-t">Tasas de cambio ({tasas.length})</div><button className="btn btn-g" onClick={()=>{setNuevaTasa({pais_codigo:'',moneda:'',simbolo:'',tasa_usd:0});setEditTasa(null);setMostrarFormTasa(!mostrarFormTasa);}}><Plus size={12}/> {mostrarFormTasa?'Cancelar':'Agregar tasa'}</button></div>
                {mostrarFormTasa&&(
                  <div className="panel" style={{marginBottom:16}}>
                    <div className="panel-title"><Globe size={13} style={{color:'#38bdf8'}}/> {editTasa?'Editar tasa':'Nueva tasa'}</div>
                    <div className="form-grid">
                      <div><div className="lbl">País (ISO) *</div><input className="inp" placeholder="CO, MX..." value={nuevaTasa.pais_codigo} onChange={e=>setNuevaTasa(p=>({...p,pais_codigo:e.target.value.toUpperCase()}))} disabled={!!editTasa}/></div>
                      <div><div className="lbl">Moneda *</div><input className="inp" placeholder="COP, MXN..." value={nuevaTasa.moneda} onChange={e=>setNuevaTasa(p=>({...p,moneda:e.target.value.toUpperCase()}))}/></div>
                      <div><div className="lbl">Símbolo</div><input className="inp" placeholder="$, S/..." value={nuevaTasa.simbolo} onChange={e=>setNuevaTasa(p=>({...p,simbolo:e.target.value}))}/></div>
                      <div><div className="lbl">1 USD = ? *</div><input type="number" step="0.0001" className="inp" placeholder="4000" value={nuevaTasa.tasa_usd} onChange={e=>setNuevaTasa(p=>({...p,tasa_usd:e.target.value}))}/></div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="btn" style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)"}} onClick={()=>{setMostrarFormTasa(false);setEditTasa(null);}}>Cancelar</button>
                      <button className="btn btn-g" style={{flex:1}} onClick={guardarTasa}><Check size={12}/> {editTasa?'Actualizar':'Guardar'}</button>
                    </div>
                  </div>
                )}
                <div style={{background:"#111827",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,overflow:"hidden"}}>
                  <div style={{overflowX:"auto"}}>
                    {tasas.length===0?<div style={{textAlign:"center",padding:32,color:"rgba(255,255,255,.2)",fontFamily:"'Oswald',sans-serif",fontSize:13}}>Sin tasas</div>
                    :<table className="tbl"><thead><tr><th>País</th><th>Moneda</th><th>Símbolo</th><th>1 USD =</th><th>Actualizada</th><th>Acción</th></tr></thead>
                      <tbody>{tasas.map(t=>(
                        <tr key={t.id}>
                          <td style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,color:'#fff'}}>{t.pais_codigo}</td>
                          <td style={{color:'#38bdf8',fontFamily:"'Oswald',sans-serif"}}>{t.moneda}</td>
                          <td style={{color:'rgba(255,255,255,.6)'}}>{t.simbolo}</td>
                          <td style={{fontFamily:"'Oswald',sans-serif",color:'#8dc63f',fontWeight:700}}>{Number(t.tasa_usd).toLocaleString('es-CO',{maximumFractionDigits:4})} {t.moneda}</td>
                          <td style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>{new Date(t.updated_at).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})}</td>
                          <td><button className="btn btn-b" style={{padding:"4px 8px",fontSize:9}} onClick={()=>{setEditTasa(t);setNuevaTasa({pais_codigo:t.pais_codigo,moneda:t.moneda,simbolo:t.simbolo,tasa_usd:t.tasa_usd});setMostrarFormTasa(true);}}><Edit2 size={10}/> Editar</button></td>
                        </tr>
                      ))}</tbody></table>}
                  </div>
                </div>
              </>
            )}

            {tab==='codigos'&&<TabCodigosGanancia/>}
            {tab==='promotores'&&<TabPromotores/>}
            {tab==='red_comercial'&&<TabRedComercial/>}
            {tab==='config'&&<AdminConfig/>}

            {/* PEDIDOS */}
            {tab==='pedidos'&&(
              <>
                <div className="sec-h">
                  <div className="sec-t">Pedidos de promotores ({pedidos.length})</div>
                  <button onClick={cargarDatos} style={{background:'rgba(255,255,255,.05)',border:'none',borderRadius:6,color:'rgba(255,255,255,.4)',cursor:'pointer',padding:'5px 10px',fontFamily:"'Oswald',sans-serif",fontSize:10,fontWeight:700,display:'flex',alignItems:'center',gap:4}}><RefreshCw size={10}/> Actualizar</button>
                </div>
                <div className="filtro-tabs">
                  {['PENDIENTE','ENTREGADO','CANCELADO','TODOS'].map(e=>(
                    <button key={e} className={`filtro-tab ${pedidoFiltro===e?'on':''}`} onClick={()=>setPedidoFiltro(e)}>
                      {e} <span style={{opacity:.6}}>({e==='TODOS'?pedidos.length:pedidos.filter(p=>p.estado===e).length})</span>
                    </button>
                  ))}
                </div>
                {pedidos.filter(p=>pedidoFiltro==='TODOS'?true:p.estado===pedidoFiltro).length===0?(
                  <div className="empty"><Package size={28} style={{margin:'0 auto',opacity:.3,display:'block'}}/><div className="empty-t">Sin pedidos</div></div>
                ):pedidos.filter(p=>pedidoFiltro==='TODOS'?true:p.estado===pedidoFiltro).map(p=>(
                  <div key={p.id} style={{background:'rgba(255,255,255,.03)',border:`1px solid ${p.estado_pago==='DEUDA'?'rgba(239,68,68,.3)':'rgba(141,198,63,.2)'}`,borderLeft:`3px solid ${p.estado_pago==='DEUDA'?'#ef4444':'#8dc63f'}`,borderRadius:8,padding:'14px 16px',marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
                      <div>
                        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6}}>
                          <span style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:700,color:'#fff'}}>{p.tipo==='SALDO_PX'?'💰 Saldo PX':'🔑 PINs'} — {Number(p.cantidad).toLocaleString()} {p.tipo==='SALDO_PX'?'PX':'unidades'}</span>
                          <span className={`badge ${p.estado==='ENTREGADO'?'b-ok':p.estado==='CANCELADO'?'b-err':'b-warn'}`}>{p.estado}</span>
                          <span className={`badge ${p.estado_pago==='CANCELADO'?'b-ok':'b-err'}`}>{p.estado_pago==='CANCELADO'?'PAGADO':'DEUDA'}</span>
                        </div>
                        <div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>Promotor: <strong style={{color:'#fff'}}>{p.promotor_nombre}</strong></div>
                        <div style={{fontSize:10,color:'rgba(255,255,255,.25)',marginTop:3}}>{new Date(p.created_at).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:9,color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:1,marginBottom:3}}>Monto deuda</div>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:22,fontWeight:700,color:p.estado_pago==='CANCELADO'?'#8dc63f':'#ef4444'}}>{Number(p.monto_deuda).toLocaleString()} PX</div>
                      </div>
                    </div>
                    {p.estado==='PENDIENTE'&&(
                      <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
                        <button className="btn btn-g" style={{padding:'5px 12px',fontSize:10}} onClick={async()=>{
                          if (p.tipo==='SALDO_PX') {
                            const { data: prom } = await supabase.from('promotores').select('balance_px').eq('id',p.promotor_id).maybeSingle();
                            await supabase.from('promotores').update({balance_px:Number(prom?.balance_px??0)+Number(p.cantidad)}).eq('id',p.promotor_id);
                          }
                          await supabase.from('pedidos_promotor').update({estado:'ENTREGADO'}).eq('id',p.id);
                          showMsg(`Pedido entregado${p.tipo==='SALDO_PX'?' — '+Number(p.cantidad).toLocaleString()+' PX cargados':''}`, 'ok');
                          cargarDatos();
                        }}><CheckCircle size={10}/> Marcar entregado{p.tipo==='SALDO_PX'?' + cargar PX':''}</button>
                        <button className="btn" style={{padding:'5px 12px',fontSize:10,background:'rgba(34,197,94,.1)',color:'#22c55e',border:'1px solid rgba(34,197,94,.2)'}} onClick={async()=>{await supabase.from('pedidos_promotor').update({estado_pago:'CANCELADO'}).eq('id',p.id);showMsg('Deuda cancelada','ok');cargarDatos();}}><DollarSign size={10}/> Deuda pagada</button>
                        <button className="btn btn-r" style={{padding:'5px 12px',fontSize:10}} onClick={async()=>{await supabase.from('pedidos_promotor').update({estado:'CANCELADO'}).eq('id',p.id);showMsg('Pedido cancelado','ok');cargarDatos();}}><X size={10}/> Cancelar</button>
                      </div>
                    )}
                    {p.estado==='ENTREGADO'&&p.estado_pago==='DEUDA'&&(
                      <div style={{display:'flex',gap:6,marginTop:10}}>
                        <button className="btn" style={{padding:'5px 12px',fontSize:10,background:'rgba(34,197,94,.1)',color:'#22c55e',border:'1px solid rgba(34,197,94,.2)'}} onClick={async()=>{await supabase.from('pedidos_promotor').update({estado_pago:'CANCELADO'}).eq('id',p.id);showMsg('Deuda cancelada','ok');cargarDatos();}}><DollarSign size={10}/> Deuda pagada</button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
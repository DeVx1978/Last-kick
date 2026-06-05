"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Lock, Shield, Check, Copy, AlertTriangle,
  CheckCircle, Zap, X, Phone, Hash, User, FileText,
  Globe, ArrowRight, Heart, Ticket
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const PAQUETES: Record<string, { vidas: number; usd: number; nombre: string }> = {
  p1:   { vidas: 1,   usd: 1,   nombre: 'Impulso Básico'    },
  p2:   { vidas: 3,   usd: 2,   nombre: 'Carga Táctica'     },
  p3:   { vidas: 5,   usd: 3,   nombre: 'Suministro Básico' },
  p4:   { vidas: 7,   usd: 4,   nombre: 'Escudo Activo'     },
  p5:   { vidas: 8,   usd: 5,   nombre: 'Arsenal Medio'     },
  p12:  { vidas: 15,  usd: 12,  nombre: 'Margen Táctico'    },
  p20:  { vidas: 30,  usd: 20,  nombre: 'Blindaje Élite'    },
  p30:  { vidas: 50,  usd: 30,  nombre: 'Arsenal Supremo'   },
  p50:  { vidas: 100, usd: 50,  nombre: 'Modo Dios'         },
  p100: { vidas: 230, usd: 100, nombre: 'Comando Total'     },
};

const METODOS_DATOS: Record<string, {
  nombre: string; color: string; icono: string;
  tipo: 'transferencia' | 'crypto' | 'pin';
  titular?: string; cuenta?: string; banco?: string;
  red?: string; wallet?: string;
  instruccion: string;
}> = {
  nequi:        { nombre:'Nequi',             color:'#7C3AED', icono:'N',   tipo:'transferencia', titular:'KICK LAST CORP',    cuenta:'300 123 4567',              banco:'Nequi Colombia',       instruccion:'Envía exactamente el valor indicado a este número Nequi y guarda el comprobante.' },
  daviplata:    { nombre:'Daviplata',          color:'#DC2626', icono:'D',   tipo:'transferencia', titular:'KICK LAST CORP',    cuenta:'310 987 6543',              banco:'Daviplata',            instruccion:'Envía al número Daviplata con el valor exacto. Toma captura del comprobante.' },
  bancolombia:  { nombre:'Bancolombia',        color:'#F59E0B', icono:'B',   tipo:'transferencia', titular:'KICK LAST CORP',    cuenta:'456-123456-78 CC',          banco:'Bancolombia',          instruccion:'Transfiere a esta cuenta corriente. Incluye tu número de jugador en el concepto.' },
  efecty:       { nombre:'Efecty',             color:'#EA580C', icono:'E',   tipo:'transferencia', titular:'JUAN ESTEBAN LÓPEZ',cuenta:'COD-98765',                 banco:'Efecty Colombia',      instruccion:'Ve al punto Efecty más cercano y realiza el pago con el código de convenio.' },
  pichincha:    { nombre:'Banco Pichincha',    color:'#1D4ED8', icono:'P',   tipo:'transferencia', titular:'KICK LAST EC',      cuenta:'2207654321',                banco:'Banco Pichincha EC',   instruccion:'Transfiere desde tu banca en línea Pichincha. Incluye tu código de jugador.' },
  pacifico:     { nombre:'Banco del Pacífico', color:'#0284C7', icono:'Ψ',   tipo:'transferencia', titular:'KICK LAST EC',      cuenta:'5501234567',                banco:'Banco del Pacífico',   instruccion:'Realiza la transferencia desde tu app Banco del Pacífico.' },
  payphone:     { nombre:'Payphone',           color:'#0891B2', icono:'φ',   tipo:'transferencia', titular:'KICK LAST',         cuenta:'+593 98 765 4321',          banco:'Payphone Ecuador',     instruccion:'Transfiere desde tu app Payphone al número de celular indicado.' },
  spei:         { nombre:'SPEI',               color:'#059669', icono:'S',   tipo:'transferencia', titular:'KICK LAST MX',      cuenta:'CLABE: 012345678901234567', banco:'BBVA México',          instruccion:'Realiza la transferencia SPEI con la CLABE indicada. Máximo 2 horas de acreditación.' },
  oxxo:         { nombre:'OXXO Pay',           color:'#D97706', icono:'O',   tipo:'transferencia', titular:'KICK LAST',         cuenta:'Referencia: 1234 5678 9012',banco:'OXXO Pay',             instruccion:'Presenta esta referencia en cualquier tienda OXXO para realizar el pago en efectivo.' },
  mercadopago:  { nombre:'MercadoPago',        color:'#00B1EA', icono:'M',   tipo:'transferencia', titular:'KICK LAST AR',      cuenta:'kicklast@mp.com',           banco:'MercadoPago',          instruccion:'Envía el pago a esta dirección de MercadoPago. Incluye tu alias en el mensaje.' },
  transferencia:{ nombre:'Transferencia',      color:'#4B5563', icono:'TR',  tipo:'transferencia', titular:'KICK LAST',         cuenta:'Ver datos al contactar',    banco:'Banco local',          instruccion:'Contacta al soporte para recibir los datos de transferencia de tu país.' },
  yape:         { nombre:'Yape',               color:'#7C3AED', icono:'Y',   tipo:'transferencia', titular:'KICK LAST PE',      cuenta:'987 654 321',               banco:'Yape / BCP',           instruccion:'Envía a este número Yape el valor exacto. Guarda el código de operación.' },
  plin:         { nombre:'Plin',               color:'#0EA5E9', icono:'PL',  tipo:'transferencia', titular:'KICK LAST PE',      cuenta:'956 123 456',               banco:'Plin',                 instruccion:'Envía a este número Plin. Incluye tu alias como concepto.' },
  bcp:          { nombre:'BCP',                color:'#1E40AF', icono:'BCP', tipo:'transferencia', titular:'KICK LAST PE',      cuenta:'191-12345678-0-12',         banco:'Banco de Crédito BCP', instruccion:'Transfiere a esta cuenta BCP. Envía el número de operación al soporte.' },
  pago_movil:   { nombre:'Pago Móvil',         color:'#7C3AED', icono:'PM',  tipo:'transferencia', titular:'KICK LAST VE',      cuenta:'04241234567 · V-12345678',  banco:'Banesco',              instruccion:'Envía pago móvil con teléfono y cédula indicados. Guarda el comprobante.' },
  zelle:        { nombre:'Zelle',              color:'#6B21A8', icono:'Z',   tipo:'transferencia', titular:'KICK LAST',         cuenta:'pagos@kicklast.com',         banco:'Zelle USA',            instruccion:'Envía por Zelle al correo indicado. El nombre del destinatario debe coincidir.' },
  webpay:       { nombre:'WebPay Plus',        color:'#1D4ED8', icono:'W',   tipo:'transferencia', titular:'KICK LAST CL',      cuenta:'Enlace de pago personalizado',banco:'Transbank Chile',    instruccion:'Se generará un enlace de WebPay al confirmar tu pedido. Válido por 30 minutos.' },
  bizum:        { nombre:'Bizum',              color:'#0F766E', icono:'Bz',  tipo:'transferencia', titular:'KICK LAST ES',      cuenta:'+34 600 123 456',           banco:'Bizum España',         instruccion:'Envía por Bizum al número indicado. Usa tu nombre de jugador como concepto.' },
  usdt:         { nombre:'USDT TRC-20',        color:'#26A17B', icono:'₮',   tipo:'crypto',         red:'TRC-20 (TRON)',         wallet:'TLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', instruccion:'⚠️ Envía USDT ÚNICAMENTE por la red TRC-20. Envíos por redes incorrectas no son recuperables.' },
  usdt_ec:      { nombre:'USDT TRC-20',        color:'#26A17B', icono:'₮',   tipo:'crypto',         red:'TRC-20 (TRON)',         wallet:'TLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', instruccion:'⚠️ Envía USDT ÚNICAMENTE por la red TRC-20. Envíos por redes incorrectas no son recuperables.' },
  pin:          { nombre:'Código PIN',         color:'#8dc63f', icono:'⚡',  tipo:'pin',             instruccion:'Ingresa tu código PIN para acreditar vidas de forma inmediata y automática.' },
};

const PAISES_INFO: Record<string, { nombre: string; bandera: string; moneda: string; simbolo: string; tasa: number }> = {
  CO: { nombre:'Colombia',  bandera:'🇨🇴', moneda:'COP', simbolo:'$',  tasa:4100 },
  EC: { nombre:'Ecuador',   bandera:'🇪🇨', moneda:'USD', simbolo:'$',  tasa:1    },
  MX: { nombre:'México',    bandera:'🇲🇽', moneda:'MXN', simbolo:'$',  tasa:17.2 },
  AR: { nombre:'Argentina', bandera:'🇦🇷', moneda:'ARS', simbolo:'$',  tasa:1150 },
  PE: { nombre:'Perú',      bandera:'🇵🇪', moneda:'PEN', simbolo:'S/', tasa:3.8  },
  VE: { nombre:'Venezuela', bandera:'🇻🇪', moneda:'USD', simbolo:'$',  tasa:1    },
  CL: { nombre:'Chile',     bandera:'🇨🇱', moneda:'CLP', simbolo:'$',  tasa:970  },
  US: { nombre:'USA',       bandera:'🇺🇸', moneda:'USD', simbolo:'$',  tasa:1    },
  ES: { nombre:'España',    bandera:'🇪🇸', moneda:'EUR', simbolo:'€',  tasa:0.93 },
  XX: { nombre:'Otro',      bandera:'🌐',  moneda:'USD', simbolo:'$',  tasa:1    },
};

export default function CheckoutPage() {
  const router = useRouter();
  const [pkgId,     setPkgId]     = useState('p5');
  const [paisCode,  setPaisCode]  = useState('CO');
  const [montoLocal,setMontoLocal]= useState('');
  const [orderId,   setOrderId]   = useState('');
  const [userId,    setUserId]    = useState<string|null>(null);
  const [perfil,    setPerfil]    = useState<any>(null);
  const [metodoSel, setMetodoSel] = useState<string|null>(null);
  const [paso,      setPaso]      = useState<1|2|3>(1);
  const [copied,    setCopied]    = useState(false);
  const [status,    setStatus]    = useState<'idle'|'enviando'|'ok'|'error'>('idle');
  const [logoErr,   setLogoErr]   = useState(false);
  const [fNombre,   setFNombre]   = useState('');
  const [fAlias,    setFAlias]    = useState('');
  const [fCodigo,   setFCodigo]   = useState('');
  const [fRef,      setFRef]      = useState('');
  const [pinCode,   setPinCode]   = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPkgId(params.get('id') || 'p5');
    setPaisCode(params.get('pais') || 'CO');
    setMontoLocal(params.get('val') || '');
    setOrderId(`LK-${Math.floor(Math.random()*900000)+100000}`);
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      const { data: p } = await supabase.from('profiles').select('full_name,username,player_code,lives,pitchx_balance').eq('id', user.id).maybeSingle();
      if (p) { setPerfil(p); setFNombre(p.full_name||''); setFAlias(p.username||''); setFCodigo(p.player_code||''); }
    };
    init();
  }, []);

  const pkg    = PAQUETES[pkgId] || PAQUETES['p5'];
  const pais   = PAISES_INFO[paisCode] || PAISES_INFO['CO'];
  const metodo = metodoSel ? METODOS_DATOS[metodoSel] : null;

  const formatMonto = () => {
    if (!montoLocal) return `${pais.simbolo}${(pkg.usd * pais.tasa).toFixed(pais.tasa === 1 ? 2 : 0)}`;
    const n = parseFloat(montoLocal);
    return pais.tasa === 1 ? `${pais.simbolo}${n.toFixed(2)}` : `${pais.simbolo}${Math.round(n).toLocaleString('es-CO')}`;
  };

  const copiar = (txt: string) => { navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const enviarComprobante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fRef.trim() || fRef.length < 4) return;
    setStatus('enviando');
    await new Promise(r => setTimeout(r, 1200));
    try {
      await supabase.from('withdrawal_requests').insert({ user_id: userId, estado: 'PENDIENTE', metodo_pago: metodoSel || 'MANUAL', numero_cuenta: fRef, creditos_solicitados: pkg.usd });
      await supabase.from('notifications').insert({ user_id: userId, type: 'RECARGA_PENDIENTE', title: 'Recarga en revisión', message: `Tu pago de ${formatMonto()} por ${pkg.vidas} vidas está siendo verificado.`, read: false });
    } catch {}
    setStatus('ok');
  };

  const canjearPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode.length < 6) return;
    setStatus('enviando');
    await new Promise(r => setTimeout(r, 800));
    try {
      const { data: pin } = await supabase.from('pin_codes').select('*').eq('code', pinCode.trim().toUpperCase()).eq('used', false).maybeSingle();
      if (!pin) { setStatus('error'); setTimeout(() => setStatus('idle'), 3000); return; }
      await supabase.from('pin_codes').update({ used: true, used_by: userId, used_at: new Date().toISOString() }).eq('id', pin.id);
      if (perfil) await supabase.from('profiles').update({ lives: (perfil.lives||0)+(pin.lives_amount||0), pitchx_balance: (perfil.pitchx_balance||0)+(pin.px_amount||0) }).eq('id', userId);
    } catch {}
    setStatus('ok');
  };

  /* PANTALLAS DE ESTADO */
  if (status === 'ok') return (
    <div style={{minHeight:'100vh',background:'#0a0d14',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Roboto',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Roboto:wght@300;400;500&display=swap');*{box-sizing:border-box;}`}</style>
      <motion.div initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}}
        style={{background:'#111827',border:'1px solid rgba(141,198,63,.2)',borderRadius:8,padding:48,maxWidth:440,width:'90%',textAlign:'center'}}>
        <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:200,delay:.2}}
          style={{width:72,height:72,borderRadius:'50%',background:'rgba(141,198,63,.08)',border:'2px solid rgba(141,198,63,.3)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
          <CheckCircle size={36} style={{color:'#8dc63f'}}/>
        </motion.div>
        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:22,fontWeight:700,color:'#fff',marginBottom:10}}>
          {metodo?.tipo==='pin'?'¡PIN Canjeado!':'¡Pago Recibido!'}
        </div>
        <div style={{fontSize:13,color:'rgba(255,255,255,.45)',lineHeight:1.65,marginBottom:28}}>
          {metodo?.tipo==='pin'?'Tus vidas han sido acreditadas de forma inmediata.':'Tu comprobante está en revisión. Te notificaremos cuando se acrediten tus vidas (máx. 2-4 horas).'}
        </div>
        <button onClick={()=>router.push('/radar')}
          style={{background:'#8dc63f',border:'none',borderRadius:4,padding:'13px 32px',fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:'#0a0d14',cursor:'pointer',letterSpacing:1,textTransform:'uppercase'}}>
          VOLVER AL RADAR
        </button>
      </motion.div>
    </div>
  );

  if (status === 'error') return (
    <div style={{minHeight:'100vh',background:'#0a0d14',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap');*{box-sizing:border-box;}`}</style>
      <motion.div initial={{opacity:0}} animate={{opacity:1}}
        style={{background:'#111827',border:'1px solid rgba(239,68,68,.25)',borderRadius:8,padding:40,maxWidth:380,textAlign:'center'}}>
        <AlertTriangle size={44} style={{color:'#ef4444',margin:'0 auto 14px',display:'block'}}/>
        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:17,color:'#fff',marginBottom:10}}>PIN Inválido</div>
        <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:22}}>El código PIN es inválido o ya fue utilizado.</div>
        <button onClick={()=>setStatus('idle')} style={{background:'#8dc63f',border:'none',borderRadius:4,padding:'10px 24px',fontFamily:"'Oswald',sans-serif",fontSize:12,color:'#0a0d14',cursor:'pointer',fontWeight:700}}>
          INTENTAR DE NUEVO
        </button>
      </motion.div>
    </div>
  );

  const metodosPorPais: Record<string,string[]> = {
    CO:['nequi','daviplata','bancolombia','efecty','pin'],
    EC:['pichincha','pacifico','payphone','usdt','pin'],
    MX:['spei','oxxo','usdt','pin'],
    AR:['mercadopago','transferencia','usdt','pin'],
    PE:['yape','plin','bcp','usdt','pin'],
    VE:['pago_movil','zelle','usdt','pin'],
    CL:['webpay','transferencia','usdt','pin'],
    US:['usdt','pin'],
    ES:['bizum','transferencia','usdt','pin'],
    XX:['usdt','pin'],
  };

  return (
    <div style={{minHeight:'100vh',background:'#0a0d14',fontFamily:"'Roboto',sans-serif",color:'#fff'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0d14}::-webkit-scrollbar-thumb{background:rgba(141,198,63,.3);border-radius:2px}

        .co-grid{display:grid;grid-template-columns:1fr 320px;gap:20px;max-width:1020px;margin:0 auto;padding:24px 20px 60px}
        @media(max-width:820px){.co-grid{grid-template-columns:1fr}}

        /* Pasos */
        .pasos{display:flex;align-items:center;gap:0;margin-bottom:28px;}
        .paso-n{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;font-family:'Oswald',sans-serif;}
        .paso-lbl{font-family:'Oswald',sans-serif;font-size:10px;letter-spacing:1px;margin-left:6px;white-space:nowrap;}
        .paso-line{flex:1;height:1px;background:rgba(255,255,255,.07);margin:0 8px;}

        /* Método btn */
        .metodo-btn{width:100%;background:#111827;border:1px solid rgba(255,255,255,.07);border-radius:4px;padding:13px 15px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all .15s;text-align:left;margin-bottom:6px;}
        .metodo-btn:hover{background:#141e2a;border-color:rgba(255,255,255,.14);}
        .metodo-btn.active{border-color:#8dc63f;border-left:3px solid #8dc63f;background:rgba(141,198,63,.04);}

        /* Input */
        .inp{width:100%;background:#111827;border:1px solid rgba(255,255,255,.08);border-radius:4px;padding:11px 13px;color:#fff;font-size:12px;font-family:'Roboto',sans-serif;outline:none;transition:border-color .15s;margin-bottom:10px;}
        .inp:focus{border-color:#8dc63f;}
        .inp::placeholder{color:rgba(255,255,255,.2);}

        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        @media(max-width:500px){.form-row{grid-template-columns:1fr;}}

        /* Datos de pago */
        .dato-row{padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05);}
        .dato-row:last-child{border-bottom:none;}
        .dato-lbl{font-size:8px;font-family:'Oswald',sans-serif;color:rgba(255,255,255,.25);letter-spacing:2px;text-transform:uppercase;margin-bottom:3px;}
        .dato-val{font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;color:#fff;}
        .dato-val.highlight{font-size:18px;color:#fff;}
        .copy-btn{background:none;border:1px solid rgba(255,255,255,.1);border-radius:3px;padding:4px 10px;color:rgba(255,255,255,.35);font-size:9px;font-family:'Oswald',sans-serif;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .12s;flex-shrink:0;}
        .copy-btn:hover{border-color:rgba(141,198,63,.3);color:#8dc63f;}
        .copy-btn.green{border-color:rgba(141,198,63,.3);color:#8dc63f;}
      `}</style>

      {/* TOPBAR */}
      <div style={{background:'#0b0e1a',borderBottom:'1px solid rgba(255,255,255,.06)',padding:'11px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button onClick={()=>router.back()} style={{background:'transparent',border:'1px solid rgba(255,255,255,.08)',borderRadius:3,color:'rgba(255,255,255,.45)',cursor:'pointer',display:'flex',alignItems:'center',gap:5,padding:'6px 10px',fontSize:10,fontFamily:"'Oswald',sans-serif",letterSpacing:1,transition:'all .15s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#8dc63f';e.currentTarget.style.color='#8dc63f';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.08)';e.currentTarget.style.color='rgba(255,255,255,.45)';}}>
            <ChevronLeft size={13}/> VOLVER
          </button>
          <div style={{width:1,height:14,background:'rgba(255,255,255,.08)'}}/>
          {!logoErr
            ?<img src="/img/kicklast02.png" alt="Kick Last" style={{height:24}} onError={()=>setLogoErr(true)}/>
            :<span style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:700,color:'#8dc63f',letterSpacing:2}}>KICK LAST</span>
          }
          <span style={{fontFamily:"'Oswald',sans-serif",fontSize:10,color:'rgba(255,255,255,.25)',letterSpacing:1}}>· CHECKOUT</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:'#8dc63f',fontFamily:"'Oswald',sans-serif",letterSpacing:1}}>
          <Lock size={10}/> PAGO SEGURO · {orderId}
        </div>
      </div>

      {/* BANNER */}
      <div style={{position:'relative',height:180,overflow:'hidden'}}>
        <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1400&q=85&fit=crop" alt=""
          style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,rgba(10,13,20,.97) 25%,rgba(10,13,20,.6) 60%,rgba(10,13,20,.15) 100%)'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:60,background:'linear-gradient(transparent,#0a0d14)'}}/>
        <div style={{position:'relative',zIndex:2,padding:'0 30px',height:'100%',display:'flex',alignItems:'center',gap:24}}>
          {/* Info paquete en el banner */}
          <div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,color:'#8dc63f',letterSpacing:2,marginBottom:6,textTransform:'uppercase'}}>Confirmación de compra</div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:28,fontWeight:700,color:'#fff',lineHeight:1.0,textTransform:'uppercase',marginBottom:6}}>
              {pkg.vidas} <span style={{color:'#8dc63f'}}>VIDAS</span>
            </div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.4)'}}>{pkg.nombre} · {pais.bandera} {pais.nombre}</div>
          </div>
          {/* Separador */}
          <div style={{width:1,height:60,background:'rgba(255,255,255,.1)',flexShrink:0}}/>
          {/* Monto */}
          <div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,color:'rgba(255,255,255,.3)',letterSpacing:2,marginBottom:4,textTransform:'uppercase'}}>Total a pagar</div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:32,fontWeight:700,color:'#fff',lineHeight:1}}>{formatMonto()}</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,.3)',marginTop:3}}>{pais.moneda}</div>
          </div>
          {/* Orden */}
          <div style={{marginLeft:'auto',textAlign:'right'}}>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,color:'rgba(255,255,255,.25)',letterSpacing:2,marginBottom:4,textTransform:'uppercase'}}>N° de orden</div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:700,color:'rgba(141,198,63,.8)',letterSpacing:1}}>{orderId}</div>
          </div>
        </div>
      </div>

      {/* OVERLAY ENVIANDO */}
      <AnimatePresence>
        {status==='enviando'&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:'fixed',inset:0,background:'rgba(10,13,20,.95)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:18}}>
            <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}}
              style={{width:44,height:44,borderRadius:'50%',border:'3px solid rgba(141,198,63,.15)',borderTop:'3px solid #8dc63f'}}/>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,letterSpacing:2,color:'rgba(255,255,255,.35)'}}>PROCESANDO...</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="co-grid">

        {/* ═══ COLUMNA IZQUIERDA ═══ */}
        <div>

          {/* PASOS */}
          <div className="pasos">
            {([{n:1,label:'MÉTODO'},{n:2,label:metodo?.tipo==='pin'?'CANJEAR':'INSTRUCCIONES'},{n:3,label:'COMPROBANTE'}] as const).map((p,i)=>(
              <React.Fragment key={p.n}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div className="paso-n" style={{background:paso>=p.n?'#8dc63f':'rgba(255,255,255,.06)',color:paso>=p.n?'#0a0d14':'rgba(255,255,255,.3)'}}>
                    {paso>p.n?<Check size={12} strokeWidth={3}/>:p.n}
                  </div>
                  <span className="paso-lbl" style={{color:paso===p.n?'#8dc63f':'rgba(255,255,255,.3)'}}>{p.label}</span>
                </div>
                {i<2&&<div className="paso-line" style={{background:paso>p.n?'rgba(141,198,63,.3)':'rgba(255,255,255,.07)'}}/>}
              </React.Fragment>
            ))}
          </div>

          {/* PASO 1 — MÉTODO */}
          {paso===1&&(
            <motion.div initial={{opacity:0,x:12}} animate={{opacity:1,x:0}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:600,color:'#fff',marginBottom:4}}>Selecciona tu método de pago</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:18}}>{pais.bandera} Métodos disponibles para {pais.nombre}</div>
              {Object.keys(METODOS_DATOS).filter(mid=>(metodosPorPais[paisCode]||metodosPorPais['XX']).includes(mid)).map(mid=>{
                const m=METODOS_DATOS[mid];
                return(
                  <button key={mid} className={`metodo-btn ${metodoSel===mid?'active':''}`} onClick={()=>setMetodoSel(mid)}>
                    <div style={{width:40,height:40,borderRadius:'50%',background:`${m.color}15`,border:`1.5px solid ${m.color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:mid==='pin'?16:13,fontWeight:900,color:m.color,fontFamily:"'Oswald',sans-serif",flexShrink:0}}>
                      {m.icono}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:600,color:'#fff'}}>{m.nombre}</div>
                      <div style={{fontSize:10,color:'rgba(255,255,255,.3)',marginTop:1}}>{mid==='usdt'||mid==='usdt_ec'?'⚠️ Solo red TRC-20':m.tipo==='pin'?'⚡ Acreditación inmediata':'Transferencia manual'}</div>
                    </div>
                    {metodoSel===mid&&(
                      <motion.div initial={{scale:0}} animate={{scale:1}}
                        style={{width:20,height:20,borderRadius:'50%',background:'#8dc63f',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <Check size={11} color="#0a0d14" strokeWidth={3}/>
                      </motion.div>
                    )}
                  </button>
                );
              })}
              <button onClick={()=>{if(metodoSel)setPaso(2);}} disabled={!metodoSel}
                style={{marginTop:16,width:'100%',padding:'13px',borderRadius:4,border:'none',background:metodoSel?'#8dc63f':'rgba(255,255,255,.05)',color:metodoSel?'#0a0d14':'rgba(255,255,255,.2)',fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,letterSpacing:1,cursor:metodoSel?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:7,transition:'all .15s',textTransform:'uppercase'}}>
                <ArrowRight size={14}/> CONTINUAR
              </button>
            </motion.div>
          )}

          {/* PASO 2 — INSTRUCCIONES O PIN */}
          {paso===2&&metodo&&(
            <motion.div initial={{opacity:0,x:12}} animate={{opacity:1,x:0}}>
              {metodo.tipo==='pin'?(
                <div>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:600,color:'#fff',marginBottom:4}}>Canjear Código PIN</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:18}}>Ingresa el código que recibiste de un distribuidor autorizado.</div>
                  <div style={{background:'rgba(141,198,63,.04)',border:'1px solid rgba(141,198,63,.15)',borderRadius:4,padding:'12px 14px',marginBottom:18,display:'flex',gap:9}}>
                    <Zap size={14} style={{color:'#8dc63f',flexShrink:0,marginTop:2}}/>
                    <div style={{fontSize:12,color:'rgba(255,255,255,.5)',lineHeight:1.6}}>Las vidas y PitchX se acreditarán de forma <strong style={{color:'#8dc63f'}}>inmediata y automática</strong> al validar el código.</div>
                  </div>
                  <form onSubmit={canjearPin} style={{display:'flex',flexDirection:'column',gap:10}}>
                    <div>
                      <div style={{fontSize:9,fontFamily:"'Oswald',sans-serif",color:'rgba(255,255,255,.3)',letterSpacing:2,marginBottom:6}}>CÓDIGO DE ACCESO</div>
                      <input className="inp" type="text" placeholder="LASTKICK-XXXX-XXXX"
                        value={pinCode} onChange={e=>setPinCode(e.target.value.toUpperCase())}
                        style={{fontFamily:"'Oswald',sans-serif",fontSize:16,letterSpacing:3,textAlign:'center',marginBottom:0}} required/>
                    </div>
                    <button type="submit" style={{padding:'13px',background:'#8dc63f',border:'none',borderRadius:4,fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:'#0a0d14',cursor:'pointer',letterSpacing:1,display:'flex',alignItems:'center',justifyContent:'center',gap:7,textTransform:'uppercase'}}>
                      <Zap size={14}/> VALIDAR Y CANJEAR
                    </button>
                  </form>
                </div>
              ):(
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:11,marginBottom:18}}>
                    <div style={{width:42,height:42,borderRadius:'50%',background:`${metodo.color}15`,border:`1.5px solid ${metodo.color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:metodo.color,fontFamily:"'Oswald',sans-serif",flexShrink:0}}>{metodo.icono}</div>
                    <div>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:600,color:'#fff'}}>Paga con {metodo.nombre}</div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,.35)',marginTop:1}}>Realiza el pago y luego sube tu comprobante</div>
                    </div>
                  </div>
                  {/* Datos de pago */}
                  <div style={{background:'#111827',border:'1px solid rgba(255,255,255,.07)',borderRadius:4,padding:'16px 18px',marginBottom:14}}>
                    <div style={{fontSize:8,fontFamily:"'Oswald',sans-serif",color:'rgba(255,255,255,.25)',letterSpacing:2,marginBottom:12,textTransform:'uppercase'}}>Datos de pago</div>
                    {metodo.tipo==='transferencia'&&(
                      <>
                        {[{label:'TITULAR',valor:metodo.titular,copy:false,highlight:false},{label:'CUENTA / NÚMERO',valor:metodo.cuenta,copy:true,highlight:true},{label:'BANCO',valor:metodo.banco,copy:false,highlight:false}].map((row,i)=>row.valor&&(
                          <div key={i} className="dato-row">
                            <div className="dato-lbl">{row.label}</div>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <div className={`dato-val ${row.highlight?'highlight':''}`}>{row.valor}</div>
                              {row.copy&&<button className={`copy-btn ${copied?'green':''}`} onClick={()=>copiar(row.valor!)}><Copy size={10}/>{copied?'COPIADO':'COPIAR'}</button>}
                            </div>
                          </div>
                        ))}
                        <div className="dato-row" style={{borderTop:'1px solid rgba(255,255,255,.07)',paddingTop:12,marginTop:4}}>
                          <div className="dato-lbl">MONTO EXACTO A PAGAR</div>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:22,fontWeight:700,color:'#8dc63f',flex:1}}>{formatMonto()} <span style={{fontSize:11,color:'rgba(255,255,255,.35)'}}>{pais.moneda}</span></div>
                            <button className={`copy-btn green`} onClick={()=>copiar(formatMonto().replace(/[^\d,.]/g,''))}><Copy size={10}/> COPIAR</button>
                          </div>
                        </div>
                      </>
                    )}
                    {metodo.tipo==='crypto'&&(
                      <>
                        <div style={{background:'rgba(239,68,68,.05)',border:'1px solid rgba(239,68,68,.18)',borderRadius:3,padding:'9px 12px',display:'flex',gap:7,marginBottom:12}}>
                          <AlertTriangle size={13} style={{color:'#ef4444',flexShrink:0}}/>
                          <div style={{fontSize:11,color:'rgba(239,68,68,.8)',lineHeight:1.5}}>Red: <strong>{metodo.red}</strong>. Envíos por redes incorrectas NO son recuperables.</div>
                        </div>
                        <div className="dato-row">
                          <div className="dato-lbl">WALLET DESTINO (TRC-20)</div>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div style={{fontFamily:'monospace',fontSize:11,color:'#fff',flex:1,wordBreak:'break-all'}}>{metodo.wallet}</div>
                            <button className="copy-btn green" onClick={()=>copiar(metodo.wallet!)}><Copy size={10}/>{copied?'OK':'COPIAR'}</button>
                          </div>
                        </div>
                        <div className="dato-row">
                          <div className="dato-lbl">MONTO</div>
                          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:20,fontWeight:700,color:'#26A17B'}}>{pkg.usd} USDT</div>
                        </div>
                      </>
                    )}
                  </div>
                  {/* Instrucción */}
                  <div style={{background:'rgba(245,158,11,.04)',border:'1px solid rgba(245,158,11,.15)',borderRadius:4,padding:'11px 13px',display:'flex',gap:7,marginBottom:18}}>
                    <Shield size={13} style={{color:'#f59e0b',flexShrink:0,marginTop:1}}/>
                    <div style={{fontSize:11,color:'rgba(245,158,11,.75)',lineHeight:1.6}}>{metodo.instruccion}</div>
                  </div>
                  <button onClick={()=>setPaso(3)} style={{width:'100%',padding:'13px',background:'#8dc63f',border:'none',borderRadius:4,fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:'#0a0d14',cursor:'pointer',letterSpacing:1,display:'flex',alignItems:'center',justifyContent:'center',gap:7,textTransform:'uppercase'}}>
                    <ArrowRight size={14}/> YA REALICÉ EL PAGO
                  </button>
                </div>
              )}
              <button onClick={()=>{setPaso(1);setMetodoSel(null);}} style={{marginTop:12,background:'none',border:'none',color:'rgba(255,255,255,.22)',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontFamily:"'Oswald',sans-serif",letterSpacing:.5}}>
                <ChevronLeft size={13}/> Cambiar método
              </button>
            </motion.div>
          )}

          {/* PASO 3 — COMPROBANTE */}
          {paso===3&&metodo&&(
            <motion.div initial={{opacity:0,x:12}} animate={{opacity:1,x:0}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:600,color:'#fff',marginBottom:4}}>Enviar comprobante</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:18}}>Completa tus datos y el número de referencia del pago.</div>
              <form onSubmit={enviarComprobante} style={{display:'flex',flexDirection:'column',gap:0}}>
                <div className="form-row" style={{marginBottom:0}}>
                  <div>
                    <div style={{fontSize:9,fontFamily:"'Oswald',sans-serif",color:'rgba(255,255,255,.3)',letterSpacing:2,marginBottom:5,display:'flex',alignItems:'center',gap:4}}><User size={9}/> NOMBRE COMPLETO</div>
                    <input className="inp" type="text" value={fNombre} onChange={e=>setFNombre(e.target.value)} placeholder="Tu nombre completo" required/>
                  </div>
                  <div>
                    <div style={{fontSize:9,fontFamily:"'Oswald',sans-serif",color:'rgba(255,255,255,.3)',letterSpacing:2,marginBottom:5,display:'flex',alignItems:'center',gap:4}}><Hash size={9}/> ALIAS / USUARIO</div>
                    <input className="inp" type="text" value={fAlias} onChange={e=>setFAlias(e.target.value)} placeholder="@tu_alias" required/>
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <div style={{fontSize:9,fontFamily:"'Oswald',sans-serif",color:'rgba(255,255,255,.3)',letterSpacing:2,marginBottom:5,display:'flex',alignItems:'center',gap:4}}><Ticket size={9}/> CÓDIGO DE JUGADOR</div>
                    <input className="inp" type="text" value={fCodigo} onChange={e=>setFCodigo(e.target.value)} placeholder="LK-XXXXXX" required/>
                  </div>
                  <div>
                    <div style={{fontSize:9,fontFamily:"'Oswald',sans-serif",color:'rgba(255,255,255,.3)',letterSpacing:2,marginBottom:5,display:'flex',alignItems:'center',gap:4}}><FileText size={9}/> N° REFERENCIA</div>
                    <input className="inp" type="text" value={fRef} onChange={e=>setFRef(e.target.value)} placeholder="Código de la transacción" required/>
                  </div>
                </div>
                <div style={{background:'rgba(141,198,63,.03)',border:'1px solid rgba(141,198,63,.1)',borderRadius:4,padding:'11px 13px',display:'flex',gap:7,marginBottom:14}}>
                  <Shield size={12} style={{color:'#8dc63f',flexShrink:0}}/>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.35)',lineHeight:1.5}}>Tu pedido <strong style={{color:'#fff'}}>{orderId}</strong> será verificado en máximo 2-4 horas. Recibirás una notificación cuando se acrediten tus vidas.</div>
                </div>
                <button type="submit" style={{padding:'13px',background:'#8dc63f',border:'none',borderRadius:4,fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:'#0a0d14',cursor:'pointer',letterSpacing:1,display:'flex',alignItems:'center',justifyContent:'center',gap:7,textTransform:'uppercase',boxShadow:'0 4px 16px rgba(141,198,63,.2)'}}>
                  <Check size={14} strokeWidth={3}/> ENVIAR COMPROBANTE
                </button>
              </form>
              <button onClick={()=>setPaso(2)} style={{marginTop:12,background:'none',border:'none',color:'rgba(255,255,255,.22)',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontFamily:"'Oswald',sans-serif",letterSpacing:.5}}>
                <ChevronLeft size={13}/> Volver
              </button>
            </motion.div>
          )}
        </div>

        {/* ═══ COLUMNA DERECHA — RESUMEN ═══ */}
        <div>
          <div style={{background:'#111827',border:'1px solid rgba(255,255,255,.07)',borderRadius:4,overflow:'hidden',position:'sticky',top:68}}>
            <div style={{background:'rgba(141,198,63,.05)',borderBottom:'1px solid rgba(141,198,63,.1)',padding:'14px 18px'}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,letterSpacing:2,color:'#8dc63f',marginBottom:2,textTransform:'uppercase'}}>Detalle del pedido</div>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:11,color:'rgba(255,255,255,.35)',letterSpacing:1}}>{orderId}</div>
            </div>
            <div style={{padding:'18px'}}>
              {/* Paquete */}
              <div style={{display:'flex',alignItems:'center',gap:11,marginBottom:14,padding:'12px 13px',background:'rgba(255,255,255,.02)',borderRadius:4,border:'1px solid rgba(255,255,255,.06)'}}>
                <div style={{width:44,height:44,borderRadius:4,background:'rgba(141,198,63,.08)',border:'1px solid rgba(141,198,63,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Heart size={18} style={{color:'#8dc63f'}}/>
                </div>
                <div>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontSize:19,fontWeight:700,color:'#fff'}}>{pkg.vidas} <span style={{fontSize:10,color:'rgba(255,255,255,.35)'}}>VIDAS</span></div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,.3)',marginTop:1}}>{pkg.nombre}</div>
                </div>
              </div>
              {/* Líneas */}
              <div style={{borderTop:'1px solid rgba(255,255,255,.06)',paddingTop:12,marginBottom:12}}>
                {[{l:'País',v:`${pais.bandera} ${pais.nombre}`},{l:'Moneda',v:pais.moneda},{l:'Método',v:metodo?metodo.nombre:'—'},{l:'USD',v:`$${pkg.usd}`}].map((row,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',marginBottom:7,fontSize:11}}>
                    <span style={{color:'rgba(255,255,255,.35)'}}>{row.l}</span>
                    <span style={{color:'#fff',fontFamily:"'Oswald',sans-serif"}}>{row.v}</span>
                  </div>
                ))}
              </div>
              {/* Total */}
              <div style={{background:'#0a0d14',border:'1px solid rgba(141,198,63,.18)',borderRadius:4,padding:'12px 14px',textAlign:'center',marginBottom:14}}>
                <div style={{fontSize:9,fontFamily:"'Oswald',sans-serif",letterSpacing:2,color:'rgba(255,255,255,.25)',marginBottom:5,textTransform:'uppercase'}}>Total</div>
                <div style={{fontFamily:"'Oswald',sans-serif",fontSize:28,fontWeight:700,color:'#fff',lineHeight:1}}>{formatMonto()}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,.3)',marginTop:3}}>{pais.moneda}</div>
              </div>
              {/* Barra de progreso pasos */}
              <div style={{display:'flex',gap:4,marginBottom:14}}>
                {[1,2,3].map(n=>(
                  <div key={n} style={{flex:1,height:3,borderRadius:2,background:paso>=n?'#8dc63f':'rgba(255,255,255,.06)',transition:'background .3s'}}/>
                ))}
              </div>
              {/* Seguridad */}
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {[{icon:<Lock size={10}/>,label:'Transacción cifrada y segura'},{icon:<Shield size={10}/>,label:'Datos protegidos, nunca compartidos'},{icon:<Globe size={10}/>,label:'Soporte 24/7 por WhatsApp'}].map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:7,fontSize:10,color:'rgba(255,255,255,.22)'}}>
                    <span style={{color:'#8dc63f'}}>{item.icon}</span>{item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
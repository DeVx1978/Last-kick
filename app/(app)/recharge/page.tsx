"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Lock, Shield, Globe, ArrowRight,
  Check, X, ChevronDown, Zap, Edit3
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/* ══════════════════════════════════════
   TIPOS
══════════════════════════════════════ */
interface Pais {
  code: string; nombre: string; bandera: string;
  moneda: string; simbolo: string; tasa: number;
  countryCode: string;
}

interface Paquete {
  id: string; px: number; usd: number; tag: string; destacado: boolean;
}

/* ══════════════════════════════════════
   DATOS — tasas se sobreescriben desde Supabase
══════════════════════════════════════ */
const PAISES_BASE: Pais[] = [
  { code: 'CO', nombre: 'Colombia',  bandera: '🇨🇴', moneda: 'COP', simbolo: '$',  tasa: 4200,  countryCode: '+57'  },
  { code: 'EC', nombre: 'Ecuador',   bandera: '🇪🇨', moneda: 'USD', simbolo: '$',  tasa: 1,     countryCode: '+593' },
  { code: 'MX', nombre: 'México',    bandera: '🇲🇽', moneda: 'MXN', simbolo: '$',  tasa: 17.5,  countryCode: '+52'  },
  { code: 'AR', nombre: 'Argentina', bandera: '🇦🇷', moneda: 'ARS', simbolo: '$',  tasa: 900,   countryCode: '+54'  },
  { code: 'PE', nombre: 'Perú',      bandera: '🇵🇪', moneda: 'PEN', simbolo: 'S/', tasa: 3.75,  countryCode: '+51'  },
  { code: 'VE', nombre: 'Venezuela', bandera: '🇻🇪', moneda: 'USD', simbolo: '$',  tasa: 1,     countryCode: '+58'  },
  { code: 'CL', nombre: 'Chile',     bandera: '🇨🇱', moneda: 'CLP', simbolo: '$',  tasa: 950,   countryCode: '+56'  },
  { code: 'BO', nombre: 'Bolivia',   bandera: '🇧🇴', moneda: 'BOB', simbolo: 'Bs', tasa: 6.91,  countryCode: '+591' },
  { code: 'BR', nombre: 'Brasil',    bandera: '🇧🇷', moneda: 'BRL', simbolo: 'R$', tasa: 5.10,  countryCode: '+55'  },
  { code: 'ES', nombre: 'España',    bandera: '🇪🇸', moneda: 'EUR', simbolo: '€',  tasa: 0.92,  countryCode: '+34'  },
  { code: 'US', nombre: 'USA',       bandera: '🇺🇸', moneda: 'USD', simbolo: '$',  tasa: 1,     countryCode: '+1'   },
  { code: 'XX', nombre: 'Otro país', bandera: '🌐',  moneda: 'USD', simbolo: '$',  tasa: 1,     countryCode: ''     },
];

// Métodos por país — SIN pin
const METODOS_PAIS: Record<string, string[]> = {
  CO: ['nequi','daviplata','bancolombia','efecty','transferencia'],
  EC: ['pichincha','guayaquil','deuna','transferencia'],
  MX: ['oxxo','spei','mercadopago'],
  AR: ['mercadopago','transferencia','uala'],
  PE: ['yape','plin','transferencia'],
  VE: ['pagomovil','zelle','transferencia'],
  CL: ['mach','transferencia','mercadopago'],
  BO: ['tigo_money','transferencia'],
  BR: ['pix','transferencia'],
  ES: ['bizum','transferencia'],
  US: ['zelle','paypal','venmo'],
  XX: ['transferencia'],
};

const METODOS_INFO: Record<string, { nombre: string; color: string; icono: string; desc: string }> = {
  nequi:         { nombre: 'Nequi',           color: '#7C3AED', icono: 'N',   desc: 'Transferencia inmediata' },
  daviplata:     { nombre: 'Daviplata',        color: '#DC2626', icono: 'D',   desc: 'Billetera digital' },
  bancolombia:   { nombre: 'Bancolombia',      color: '#F59E0B', icono: 'B',   desc: 'PSE / Transferencia' },
  efecty:        { nombre: 'Efecty',           color: '#EA580C', icono: 'E',   desc: 'Pago en efectivo' },
  transferencia: { nombre: 'Transferencia',    color: '#4B5563', icono: 'T',   desc: 'Cuenta bancaria' },
  pichincha:     { nombre: 'Pichincha',        color: '#1D4ED8', icono: 'P',   desc: 'Transferencia bancaria' },
  guayaquil:     { nombre: 'Bco. Guayaquil',   color: '#0284C7', icono: 'G',   desc: 'Banca en línea' },
  deuna:         { nombre: 'De Una',           color: '#0891B2', icono: 'DU',  desc: 'Billetera digital' },
  spei:          { nombre: 'SPEI',             color: '#059669', icono: 'S',   desc: 'Transferencia bancaria' },
  oxxo:          { nombre: 'OXXO',             color: '#D97706', icono: 'O',   desc: 'Pago en tienda' },
  mercadopago:   { nombre: 'Mercado Pago',     color: '#00B1EA', icono: 'M',   desc: 'Billetera digital' },
  uala:          { nombre: 'Ualá',             color: '#7C3AED', icono: 'U',   desc: 'Billetera digital' },
  yape:          { nombre: 'Yape',             color: '#7C3AED', icono: 'Y',   desc: 'Billetera BCP' },
  plin:          { nombre: 'Plin',             color: '#0EA5E9', icono: 'PL',  desc: 'Billetera digital' },
  pagomovil:     { nombre: 'Pago Móvil',       color: '#7C3AED', icono: 'PM',  desc: 'Transferencia móvil' },
  zelle:         { nombre: 'Zelle',            color: '#6B21A8', icono: 'Z',   desc: 'Transferencia USA' },
  mach:          { nombre: 'MACH',             color: '#1D4ED8', icono: 'MC',  desc: 'Billetera BCI' },
  tigo_money:    { nombre: 'Tigo Money',       color: '#059669', icono: 'TM',  desc: 'Billetera digital' },
  pix:           { nombre: 'PIX',              color: '#00BDAE', icono: 'PIX', desc: 'Transferencia instantánea' },
  bizum:         { nombre: 'Bizum',            color: '#0F766E', icono: 'Bz',  desc: 'Pago móvil' },
  paypal:        { nombre: 'PayPal',           color: '#003087', icono: 'PP',  desc: 'Cuenta PayPal' },
  venmo:         { nombre: 'Venmo',            color: '#3D95CE', icono: 'V',   desc: 'Billetera Venmo' },
};

// Paquetes base en PX (1 PX = 1 USD)
const PAQUETES: Paquete[] = [
  { id: 'p5',   px: 5,   usd: 5,   tag: '',        destacado: false },
  { id: 'p10',  px: 10,  usd: 10,  tag: '',        destacado: false },
  { id: 'p25',  px: 25,  usd: 25,  tag: 'POPULAR', destacado: true  },
  { id: 'p50',  px: 50,  usd: 50,  tag: '',        destacado: false },
  { id: 'p100', px: 100, usd: 100, tag: 'ÉLITE',   destacado: false },
];

/* ══════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════ */
export default function RecargarPage() {
  const router = useRouter();
  const [perfil,       setPerfil]       = useState<any>(null);
  const [paises,       setPaises]       = useState<Pais[]>(PAISES_BASE);
  const [paisSel,      setPaisSel]      = useState<Pais>(PAISES_BASE[0]);
  const [paqueteSel,   setPaqueteSel]   = useState<Paquete | null>(null);
  const [showPaises,   setShowPaises]   = useState(false);
  const [logoErr,      setLogoErr]      = useState(false);
  const [montoCustom,  setMontoCustom]  = useState('');
  const [modoCustom,   setModoCustom]   = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // Cargar perfil
      const { data: p } = await supabase.from('profiles')
        .select('username, full_name, lives, pitchx_balance, country_code, status')
        .eq('id', user.id).maybeSingle();

      // Cargar tasas desde Supabase
      const { data: tasas } = await supabase.from('tasas_cambio').select('pais_codigo, tasa_usd, moneda, simbolo');
      if (tasas) {
        const mapa: Record<string, any> = {};
        tasas.forEach((t: any) => { mapa[t.pais_codigo] = t; });
        setPaises(PAISES_BASE.map(p => mapa[p.code]
          ? { ...p, tasa: Number(mapa[p.code].tasa_usd), moneda: mapa[p.code].moneda, simbolo: mapa[p.code].simbolo }
          : p
        ));
      }

      if (p) {
        setPerfil(p);
        const code = (p.country_code || '+57').replace('+', '');
        const mapa: Record<string, string> = {
          '57':'CO','593':'EC','52':'MX','54':'AR','51':'PE',
          '58':'VE','56':'CL','591':'BO','55':'BR','34':'ES','1':'US'
        };
        const paisCode = mapa[code] ?? 'CO';
        const paisEncontrado = (tasas
          ? PAISES_BASE.map(pp => {
              const t = tasas.find((t: any) => t.pais_codigo === pp.code);
              return t ? { ...pp, tasa: Number(t.tasa_usd), moneda: t.moneda, simbolo: t.simbolo } : pp;
            })
          : PAISES_BASE
        ).find(pp => pp.code === paisCode);
        if (paisEncontrado) setPaisSel(paisEncontrado);
      }
    };
    init();
  }, []);

  // Precio en moneda local
  const precioLocal = (usd: number) => {
    const val = usd * paisSel.tasa;
    if (['USD', 'EUR'].includes(paisSel.moneda)) return `${paisSel.simbolo}${val.toFixed(2)}`;
    return `${paisSel.simbolo}${Math.round(val).toLocaleString('es-CO')}`;
  };

  // Precio local desde PX custom
  const precioDesdeCustomPx = (px: number) => {
    const val = px * paisSel.tasa;
    if (["USD", "EUR"].includes(paisSel.moneda)) return paisSel.simbolo + val.toFixed(2);
    return paisSel.simbolo + Math.round(val).toLocaleString("es-CO");
  };

  const irCheckout = () => {
    let px: number, usd: number, id: string;
    if (modoCustom && montoCustom) {
      px = parseInt(montoCustom) || 0;
      usd = px; // 1 PX = 1 USD
      id = `custom_${px}`;
    } else if (paqueteSel) {
      px = paqueteSel.px;
      usd = paqueteSel.usd;
      id = paqueteSel.id;
    } else return;

    if (px < 1) return;
    const val = (usd * paisSel.tasa).toFixed(2);
    router.push(`/checkout?id=${id}&val=${val}&cur=${paisSel.moneda}&lives=${px}&pais=${paisSel.code}`);
  };

  const metodosPais = METODOS_PAIS[paisSel.code] ?? METODOS_PAIS['XX'];

  const pxActivo = modoCustom
    ? (parseInt(montoCustom || '0') || 0)
    : paqueteSel?.px ?? 0;

  const montoActivoLocal = pxActivo * paisSel.tasa;

  const haySeleccion = modoCustom ? pxActivo >= 1 : !!paqueteSel;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0d14', fontFamily: "'Roboto', sans-serif", color: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0d14}::-webkit-scrollbar-thumb{background:rgba(141,198,63,.3);border-radius:2px}
        .main-grid{display:grid;grid-template-columns:1fr 340px;gap:20px;max-width:1060px;margin:0 auto;padding:24px 20px 60px}
        @media(max-width:900px){.main-grid{grid-template-columns:1fr}}
        .pkg-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
        @media(max-width:700px){.pkg-grid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:440px){.pkg-grid{grid-template-columns:repeat(2,1fr);gap:8px}}
        .metodos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        @media(max-width:600px){.metodos-grid{grid-template-columns:repeat(2,1fr)}}
        .pkg-card{background:#111827;border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:14px 8px;text-align:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;user-select:none}
        .pkg-card:hover{border-color:rgba(141,198,63,.3);transform:translateY(-2px)}
        .pkg-card.sel{border-color:#8dc63f;box-shadow:0 0 0 1px #8dc63f,0 8px 24px rgba(141,198,63,.15)}
        .pkg-card.popular{border-color:rgba(141,198,63,.25)}
        .metodo-card{background:#111827;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:10px;transition:border-color .15s}
        .pais-opt{display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;transition:background .15s;border-bottom:1px solid rgba(255,255,255,.04)}
        .pais-opt:hover{background:rgba(141,198,63,.05)}
        .pais-opt:last-child{border-bottom:none}
        .lbl{font-size:10px;font-family:'Oswald',sans-serif;color:rgba(255,255,255,.3);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:8px}
        .lbl::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.06)}
        .custom-inp{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(141,198,63,.3);border-radius:8px;padding:14px 16px;color:#fff;font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;outline:none;text-align:center;letter-spacing:1px}
        .custom-inp::placeholder{color:rgba(255,255,255,.2);font-size:16px}
        .custom-inp:focus{border-color:#8dc63f;box-shadow:0 0 0 3px rgba(141,198,63,.1)}.custom-inp::-webkit-outer-spin-button,.custom-inp::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}.custom-inp[type=number]{-moz-appearance:textfield}
      `}</style>

      {/* TOPBAR */}
      <div style={{ background: '#0b0e1a', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: 'rgba(255,255,255,.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, transition: 'all .15s' }}
            onMouseEnter={e=>(e.currentTarget.style.borderColor='#8dc63f')}
            onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,.08)')}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,.1)' }} />
          {!logoErr
            ? <img src="/img/kicklast02.png" alt="Kick Last" style={{ height: 26 }} onError={() => setLogoErr(true)} />
            : <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: 15, fontWeight: 700, color: '#8dc63f', letterSpacing: 2 }}>KICK LAST</span>
          }
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', fontFamily: "'Oswald',sans-serif", letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Lock size={10} style={{ color: '#8dc63f' }} /> PAGO SEGURO
          </div>
          {perfil && (
            <div style={{ background: 'rgba(141,198,63,.08)', border: '1px solid rgba(141,198,63,.2)', borderRadius: 6, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={11} style={{ color: '#8dc63f' }} />
              <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: 13, fontWeight: 700, color: '#8dc63f' }}>{(perfil.pitchx_balance || 0).toLocaleString()}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', fontFamily: "'Oswald',sans-serif", letterSpacing: 1 }}>PX</span>
            </div>
          )}
        </div>
      </div>

      <div className="main-grid">

        {/* ══ COLUMNA IZQUIERDA ══ */}
        <div>

          {/* SELECTOR PAÍS */}
          <div style={{ marginBottom: 24 }}>
            <div className="lbl">Tu país de pago</div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowPaises(v => !v)} style={{
                width: '100%', background: '#111827',
                border: `1px solid ${showPaises ? '#8dc63f' : 'rgba(255,255,255,.1)'}`,
                borderRadius: 8, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'border-color .2s'
              }}>
                <span style={{ fontSize: 22 }}>{paisSel.bandera}</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 14, fontWeight: 600, color: '#fff' }}>{paisSel.nombre}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>
                    {paisSel.moneda} · 1 PX = {paisSel.simbolo}{paisSel.tasa >= 100 ? Math.round(paisSel.tasa).toLocaleString('es-CO') : paisSel.tasa.toFixed(2)}
                  </div>
                </div>
                <ChevronDown size={15} style={{ color: 'rgba(255,255,255,.3)', transform: showPaises ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
              </button>
              <AnimatePresence>
                {showPaises && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#111827', border: '1px solid rgba(141,198,63,.3)', borderRadius: 8, zIndex: 100, overflow: 'hidden', maxHeight: 300, overflowY: 'auto', boxShadow: '0 16px 40px rgba(0,0,0,.6)' }}>
                    {paises.map(p => (
                      <div key={p.code} className="pais-opt" onClick={() => { setPaisSel(p); setShowPaises(false); setPaqueteSel(null); setMontoCustom(''); setModoCustom(false); }}>
                        <span style={{ fontSize: 18 }}>{p.bandera}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 12, color: '#fff' }}>{p.nombre}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>{p.moneda} · 1 PX = {p.simbolo}{p.tasa >= 100 ? Math.round(p.tasa).toLocaleString('es-CO') : p.tasa.toFixed(2)}</div>
                        </div>
                        {paisSel.code === p.code && <Check size={13} style={{ color: '#8dc63f' }} />}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* PAQUETES */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="lbl" style={{ marginBottom: 0, flex: 1 }}>Elige cuántos PX recargar</div>
              <button onClick={() => { setModoCustom(v => !v); setPaqueteSel(null); setMontoCustom(''); }}
                style={{ background: modoCustom ? 'rgba(141,198,63,.12)' : 'rgba(255,255,255,.05)', border: `1px solid ${modoCustom ? 'rgba(141,198,63,.3)' : 'rgba(255,255,255,.1)'}`, borderRadius: 6, padding: '5px 10px', color: modoCustom ? '#8dc63f' : 'rgba(255,255,255,.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontFamily: "'Oswald',sans-serif", letterSpacing: .5, whiteSpace: 'nowrap' }}>
                <Edit3 size={11} /> VALOR LIBRE
              </button>
            </div>

            <AnimatePresence mode="wait">
              {modoCustom ? (
                <motion.div key="custom" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div style={{ background: '#111827', border: '1px solid rgba(141,198,63,.2)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 10, textAlign: 'center' }}>
                      ¿Cuántos <strong style={{ color: '#8dc63f' }}>PX</strong> quieres recargar?
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button type="button" onClick={() => setMontoCustom(v => String(Math.max(1, (parseInt(v)||0) - 1)))}
                        style={{ width: 38, height: 58, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontSize: 20, fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="number"
                        className="custom-inp"
                        placeholder="Ej: 15"
                        value={montoCustom}
                        onChange={e => setMontoCustom(e.target.value)}
                        min={1}
                        style={{ textAlign: 'center' }}
                      />

                      </div>
                      <button type="button" onClick={() => setMontoCustom(v => String((parseInt(v)||0) + 1))}
                        style={{ width: 38, height: 58, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontSize: 20, fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 16, fontWeight: 700, color: '#8dc63f', flexShrink: 0 }}>PX</div>
                    </div>
                    {montoCustom && parseInt(montoCustom) >= 1 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: '10px 14px', background: 'rgba(141,198,63,.06)', borderRadius: 7, border: '1px solid rgba(141,198,63,.15)' }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>Pagarás</span>
                        <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: 20, fontWeight: 700, color: '#8dc63f' }}>
                          {precioDesdeCustomPx(parseInt(montoCustom))}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="paquetes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="pkg-grid">
                    {PAQUETES.map((pkg, i) => (
                      <motion.div key={pkg.id}
                        className={`pkg-card ${paqueteSel?.id === pkg.id ? 'sel' : ''} ${pkg.destacado ? 'popular' : ''}`}
                        onClick={() => setPaqueteSel(pkg)}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileTap={{ scale: 0.96 }}>

                        {pkg.tag && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: pkg.destacado ? '#8dc63f' : 'rgba(245,158,11,.8)', padding: '3px 0', fontSize: 8, fontFamily: "'Oswald',sans-serif", fontWeight: 700, letterSpacing: 1, color: '#0a0d14', textAlign: 'center' }}>
                            {pkg.tag}
                          </div>
                        )}

                        <div style={{ marginTop: pkg.tag ? 16 : 4 }}>
                          <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 2 }}>
                            {pkg.px}
                          </div>
                          <div style={{ fontSize: 9, color: '#8dc63f', fontFamily: "'Oswald',sans-serif", letterSpacing: 1.5, marginBottom: 10 }}>
                            PX
                          </div>
                          <div style={{ height: 1, background: 'rgba(255,255,255,.06)', marginBottom: 8 }} />
                          <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 13, fontWeight: 700, color: paqueteSel?.id === pkg.id ? '#8dc63f' : 'rgba(255,255,255,.8)' }}>
                            {precioLocal(pkg.usd)}
                          </div>

                        </div>

                        {paqueteSel?.id === pkg.id && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                            style={{ position: 'absolute', top: 6, right: 6, width: 17, height: 17, borderRadius: '50%', background: '#8dc63f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={10} color="#0a0d14" strokeWidth={3} />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Nota tasa */}
                  <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>💱</span>
                    <span>1 PX = {paisSel.simbolo}{paisSel.tasa >= 100 ? Math.round(paisSel.tasa).toLocaleString('es-CO') : paisSel.tasa.toFixed(2)} {paisSel.moneda}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* MÉTODOS DE PAGO */}
          <div>
            <div className="lbl">Métodos disponibles en {paisSel.nombre}</div>
            <div className="metodos-grid">
              {metodosPais.map((mid, i) => {
                const m = METODOS_INFO[mid];
                if (!m) return null;
                return (
                  <motion.div key={mid} className="metodo-card"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${m.color}18`, border: `1px solid ${m.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: m.color, fontFamily: "'Oswald',sans-serif", flexShrink: 0 }}>
                      {m.icono}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.nombre}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 1 }}>{m.desc}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Nota PIN */}
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(141,198,63,.04)', border: '1px solid rgba(141,198,63,.12)', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(255,255,255,.35)' }}>
              <Zap size={13} style={{ color: '#8dc63f', flexShrink: 0 }} />
              <span>¿Tienes un código PIN? Canjéalo desde <button onClick={() => router.push('/radar')} style={{ background: 'none', border: 'none', color: '#8dc63f', cursor: 'pointer', fontWeight: 600, fontSize: 11, padding: 0 }}>tu panel → Recargar</button></span>
            </div>
          </div>
        </div>

        {/* ══ COLUMNA DERECHA — RESUMEN ══ */}
        <div>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, overflow: 'hidden', position: 'sticky', top: 72 }}>

            {/* Header */}
            <div style={{ background: 'rgba(141,198,63,.06)', borderBottom: '1px solid rgba(141,198,63,.1)', padding: '16px 20px' }}>
              <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 10, letterSpacing: 2, color: '#8dc63f', marginBottom: 3 }}>RESUMEN DE COMPRA</div>
              <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 18, fontWeight: 700, color: '#fff' }}>Kick Last · PitchX</div>
            </div>

            <div style={{ padding: 20 }}>

              {/* Jugador */}
              {perfil && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: 12, background: 'rgba(255,255,255,.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(141,198,63,.1)', border: '1.5px solid rgba(141,198,63,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Oswald',sans-serif", fontSize: 15, fontWeight: 700, color: '#8dc63f', flexShrink: 0 }}>
                    {(perfil.username || perfil.full_name || 'R').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perfil.username || perfil.full_name || 'RECLUTA'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>
                      <span style={{ color: perfil.status === 'VIVO' ? '#8dc63f' : '#f59e0b' }}>● {perfil.status || 'VIVO'}</span>
                      <span style={{ marginLeft: 8 }}>{(perfil.pitchx_balance || 0).toLocaleString()} PX</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Selección activa */}
              <AnimatePresence mode="wait">
                {haySeleccion ? (
                  <motion.div key="sel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ background: 'rgba(141,198,63,.05)', border: '1px solid rgba(141,198,63,.2)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: 1 }}>RECARGA</div>
                      <button onClick={() => { setPaqueteSel(null); setMontoCustom(''); setModoCustom(false); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', cursor: 'pointer', padding: 2 }}>
                        <X size={13} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{pxActivo}</div>
                      <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 14, color: '#8dc63f' }}>PX</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginTop: 4 }}>
                      = {paisSel.simbolo}{montoActivoLocal >= 1000 ? Math.round(montoActivoLocal).toLocaleString('es-CO') : montoActivoLocal.toFixed(2)} {paisSel.moneda}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.08)', borderRadius: 8, padding: 20, marginBottom: 16, textAlign: 'center' }}>
                    <Zap size={22} style={{ margin: '0 auto 8px', color: 'rgba(255,255,255,.15)', display: 'block' }} />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', fontFamily: "'Oswald',sans-serif", letterSpacing: 1 }}>SELECCIONA UN PAQUETE</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Desglose */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 12, marginBottom: 16 }}>
                {[
                  { l: 'País',    v: `${paisSel.bandera} ${paisSel.nombre}` },
                  { l: 'Moneda',  v: paisSel.moneda },
                  { l: 'Tasa',    v: `1 PX = ${paisSel.simbolo}${paisSel.tasa >= 100 ? Math.round(paisSel.tasa).toLocaleString('es-CO') : paisSel.tasa.toFixed(2)}` },
                  ...(haySeleccion ? [{ l: 'PX a recibir', v: `${pxActivo} PX` }] : []),
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                    <span style={{ color: 'rgba(255,255,255,.4)' }}>{r.l}</span>
                    <span style={{ color: '#fff', fontFamily: "'Oswald',sans-serif" }}>{r.v}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div style={{ background: '#0a0d14', border: `1px solid ${haySeleccion ? 'rgba(141,198,63,.25)' : 'rgba(255,255,255,.06)'}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, textAlign: 'center', transition: 'border-color .3s' }}>
                <div style={{ fontSize: 10, fontFamily: "'Oswald',sans-serif", letterSpacing: 2, color: 'rgba(255,255,255,.3)', marginBottom: 5 }}>TOTAL A PAGAR</div>
                <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 30, fontWeight: 700, color: haySeleccion ? '#fff' : 'rgba(255,255,255,.2)', lineHeight: 1 }}>
                  {haySeleccion
                    ? `${paisSel.simbolo}${montoActivoLocal >= 1000 ? Math.round(montoActivoLocal).toLocaleString('es-CO') : montoActivoLocal.toFixed(2)}`
                    : '—'
                  }
                </div>
                {haySeleccion && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 4 }}>{paisSel.moneda}</div>}
              </div>

              {/* CTA */}
              <motion.button
                onClick={irCheckout}
                disabled={!haySeleccion}
                whileHover={haySeleccion ? { scale: 1.02 } : {}}
                whileTap={haySeleccion ? { scale: 0.98 } : {}}
                style={{
                  width: '100%', padding: 14, borderRadius: 8, border: 'none',
                  background: haySeleccion ? '#8dc63f' : 'rgba(255,255,255,.06)',
                  color: haySeleccion ? '#0a0d14' : 'rgba(255,255,255,.2)',
                  fontFamily: "'Oswald',sans-serif", fontSize: 13, fontWeight: 700,
                  letterSpacing: 1, cursor: haySeleccion ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: haySeleccion ? '0 4px 20px rgba(141,198,63,.25)' : 'none',
                  transition: 'all .2s',
                }}>
                {haySeleccion ? <><ArrowRight size={15} /> CONTINUAR AL PAGO</> : 'SELECCIONA UN PAQUETE'}
              </motion.button>

              {/* Sellos */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 12 }}>
                {[
                  { icon: <Lock size={10} />, label: 'SEGURO' },
                  { icon: <Shield size={10} />, label: 'CIFRADO' },
                  { icon: <Globe size={10} />, label: 'PRIVADO' },
                ].map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'rgba(255,255,255,.2)', fontFamily: "'Oswald',sans-serif", letterSpacing: 1 }}>
                    {b.icon}{b.label}
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
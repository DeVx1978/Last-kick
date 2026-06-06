"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Lock, Shield, Globe, ArrowRight, Check, X, ChevronDown, Zap, Edit3,
  Target, Wallet, User, History, Users, Activity, LogOut, Key, CreditCard, Smartphone
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Pais { code:string; nombre:string; bandera:string; moneda:string; simbolo:string; tasa:number; countryCode:string; }
interface Paquete { id:string; px:number; usd:number; tag:string; destacado:boolean; }

const PAISES_BASE:Pais[] = [
  {code:'CO',nombre:'Colombia', bandera:'🇨🇴',moneda:'COP',simbolo:'$', tasa:4200, countryCode:'+57'},
  {code:'EC',nombre:'Ecuador',  bandera:'🇪🇨',moneda:'USD',simbolo:'$', tasa:1,    countryCode:'+593'},
  {code:'MX',nombre:'México',   bandera:'🇲🇽',moneda:'MXN',simbolo:'$', tasa:17.5, countryCode:'+52'},
  {code:'AR',nombre:'Argentina',bandera:'🇦🇷',moneda:'ARS',simbolo:'$', tasa:900,  countryCode:'+54'},
  {code:'PE',nombre:'Perú',     bandera:'🇵🇪',moneda:'PEN',simbolo:'S/',tasa:3.75, countryCode:'+51'},
  {code:'VE',nombre:'Venezuela',bandera:'🇻🇪',moneda:'USD',simbolo:'$', tasa:1,    countryCode:'+58'},
  {code:'CL',nombre:'Chile',    bandera:'🇨🇱',moneda:'CLP',simbolo:'$', tasa:950,  countryCode:'+56'},
  {code:'BO',nombre:'Bolivia',  bandera:'🇧🇴',moneda:'BOB',simbolo:'Bs',tasa:6.91, countryCode:'+591'},
  {code:'BR',nombre:'Brasil',   bandera:'🇧🇷',moneda:'BRL',simbolo:'R$',tasa:5.10, countryCode:'+55'},
  {code:'ES',nombre:'España',   bandera:'🇪🇸',moneda:'EUR',simbolo:'€', tasa:0.92, countryCode:'+34'},
  {code:'US',nombre:'USA',      bandera:'🇺🇸',moneda:'USD',simbolo:'$', tasa:1,    countryCode:'+1'},
  {code:'XX',nombre:'Otro país',bandera:'🌐', moneda:'USD',simbolo:'$', tasa:1,    countryCode:''},
];

const PAQUETES:Paquete[] = [
  {id:'p5',  px:5,  usd:5,  tag:'',       destacado:false},
  {id:'p10', px:10, usd:10, tag:'',       destacado:false},
  {id:'p25', px:25, usd:25, tag:'POPULAR',destacado:true },
  {id:'p50', px:50, usd:50, tag:'',       destacado:false},
  {id:'p100',px:100,usd:100,tag:'ÉLITE',  destacado:false},
];

const METODOS_PAGO = [
  { nombre:'Visa',        logo:'VISA',   color:'#1a1f71', bg:'#fff' },
  { nombre:'Mastercard',  logo:'MC',     color:'#eb001b', bg:'#fff' },
  { nombre:'Nequi',       logo:'NEQ',    color:'#6d0191', bg:'#fff' },
  { nombre:'Bancolombia', logo:'BCO',    color:'#ffd100', bg:'#fff' },
  { nombre:'Daviplata',   logo:'DAV',    color:'#e4002b', bg:'#fff' },
  { nombre:'USDT',        logo:'₮',      color:'#26a17b', bg:'#fff' },
  { nombre:'PayPal',      logo:'PP',     color:'#003087', bg:'#fff' },
  { nombre:'Efecty',      logo:'EFT',    color:'#f7941d', bg:'#fff' },
];

export default function RecargarPage() {
  const router = useRouter();
  const [perfil,     setPerfil]     = useState<any>(null);
  const [paises,     setPaises]     = useState<Pais[]>(PAISES_BASE);
  const [paisSel,    setPaisSel]    = useState<Pais>(PAISES_BASE[0]);
  const [paqueteSel, setPaqueteSel] = useState<Paquete|null>(null);
  const [showPaises, setShowPaises] = useState(false);
  const [logoErr,    setLogoErr]    = useState(false);
  const [montoCustom,setMontoCustom]= useState('');
  const [modoCustom, setModoCustom] = useState(false);

  useEffect(()=>{
    const init=async()=>{
      const{data:{user}}=await supabase.auth.getUser();
      if(!user){router.push('/login');return;}
      const{data:p}=await supabase.from('profiles').select('username,full_name,lives,pitchx_balance,country_code,status').eq('id',user.id).maybeSingle();
      const{data:tasas}=await supabase.from('tasas_cambio').select('pais_codigo,tasa_usd,moneda,simbolo');
      if(tasas){
        const mapa:Record<string,any>={};
        tasas.forEach((t:any)=>{mapa[t.pais_codigo]=t;});
        setPaises(PAISES_BASE.map(pp=>mapa[pp.code]?{...pp,tasa:Number(mapa[pp.code].tasa_usd),moneda:mapa[pp.code].moneda,simbolo:mapa[pp.code].simbolo}:pp));
      }
      if(p){
        setPerfil(p);
        const code=(p.country_code||'+57').replace('+','');
        const m:Record<string,string>={'57':'CO','593':'EC','52':'MX','54':'AR','51':'PE','58':'VE','56':'CL','591':'BO','55':'BR','34':'ES','1':'US'};
        const pc=m[code]??'CO';
        const lista=tasas?PAISES_BASE.map(pp=>{const t=tasas.find((t:any)=>t.pais_codigo===pp.code);return t?{...pp,tasa:Number(t.tasa_usd),moneda:t.moneda,simbolo:t.simbolo}:pp;}):PAISES_BASE;
        const pf=lista.find(pp=>pp.code===pc);
        if(pf)setPaisSel(pf);
      }
    };
    init();
  },[]);

  const precioLocal=(usd:number)=>{const v=usd*paisSel.tasa;return['USD','EUR'].includes(paisSel.moneda)?`${paisSel.simbolo}${v.toFixed(2)}`:`${paisSel.simbolo}${Math.round(v).toLocaleString('es-CO')}`;};
  const precioCustom=(px:number)=>{const v=px*paisSel.tasa;return['USD','EUR'].includes(paisSel.moneda)?`${paisSel.simbolo}${v.toFixed(2)}`:`${paisSel.simbolo}${Math.round(v).toLocaleString('es-CO')}`;};
  
  const irCheckout=()=>{
    let px:number,usd:number,id:string;
    if(modoCustom&&montoCustom){px=parseInt(montoCustom)||0;usd=px;id=`custom_${px}`;}
    else if(paqueteSel){px=paqueteSel.px;usd=paqueteSel.usd;id=paqueteSel.id;}
    else return;
    if(px<1)return;
    router.push(`/checkout?id=${id}&val=${(usd*paisSel.tasa).toFixed(2)}&cur=${paisSel.moneda}&lives=${px}&pais=${paisSel.code}`);
  };

  const pxActivo=modoCustom?(parseInt(montoCustom||'0')||0):paqueteSel?.px??0;
  const montoActivoLocal=pxActivo*paisSel.tasa;
  const haySeleccion=modoCustom?pxActivo>=1:!!paqueteSel;

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#0a0d14',fontFamily:"'Roboto',sans-serif",color:'#fff'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#0a0d14}
        ::-webkit-scrollbar-thumb{background:rgba(141,198,63,.3);border-radius:2px}

        .rc-layout {
          display: grid;
          grid-template-columns: 240px 1fr;
          min-height: 100vh;
        }
        @media(max-width:900px){ .rc-layout { grid-template-columns: 1fr; } .rc-sidebar { display:none !important; } }

        .rc-main-grid {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 0;
          flex: 1;
        }
        @media(max-width:1100px){ .rc-main-grid { grid-template-columns: 1fr; } }

        /* Paquetes grid */
        .pkg-grid {
          display: grid;
          grid-template-columns: repeat(5,1fr);
          gap: 10px;
        }
        @media(max-width:700px){ .pkg-grid { grid-template-columns: repeat(3,1fr); } }

        /* Card paquete */
        .pkg {
          background: #111827;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 6px;
          padding: 20px 8px 16px;
          text-align: center;
          cursor: pointer;
          transition: all .18s;
          position: relative;
          overflow: hidden;
          user-select: none;
        }
        .pkg:hover { border-color: rgba(141,198,63,.4); background: #141e2a; transform: translateY(-2px); }
        .pkg.sel { border-color: #8dc63f; border-top: 3px solid #8dc63f; background: #0f1f10; box-shadow: 0 0 0 1px rgba(141,198,63,.15); }
        .pkg.popular { border-color: rgba(141,198,63,.25); }

        /* Dropdown opciones país */
        .popt { display:flex; align-items:center; gap:10px; padding:10px 16px; cursor:pointer; transition:background .12s; border-bottom:1px solid rgba(255,255,255,.04); }
        .popt:hover { background: rgba(141,198,63,.05); }
        .popt:last-child { border-bottom: none; }

        /* Sidebar menu */
        .s-menu { display:flex; align-items:center; gap:10px; padding:10px 20px; color:rgba(255,255,255,.4); font-size:12px; font-weight:500; cursor:pointer; transition:all .15s; border-left:2px solid transparent; }
        .s-menu:hover { color:#fff; background:rgba(255,255,255,.02); }
        .s-menu.active { color:#8dc63f; background:rgba(141,198,63,.06); border-left-color:#8dc63f; font-weight:700; }

        /* Input custom */
        .cinp { width:100%; background:rgba(255,255,255,.04) !important; border:1px solid rgba(255,255,255,.1); border-radius:6px; padding:14px; color:#fff !important; font-family:'Oswald',sans-serif; font-size:28px; font-weight:700; outline:none; text-align:center; letter-spacing:2px; transition:all .2s; }
        .cinp:focus { border-color:#8dc63f; }
        .cinp::placeholder { color:rgba(255,255,255,.2); font-size:14px; letter-spacing:0; font-weight:400; }
        .cinp::-webkit-outer-spin-button,.cinp::-webkit-inner-spin-button { -webkit-appearance:none; }
        .cinp[type=number] { -moz-appearance:textfield; }

        /* Método pago badge */
        .mpago { display:flex; align-items:center; justify-content:center; width:52px; height:32px; border-radius:4px; background:#fff; font-size:8px; font-weight:800; letter-spacing:.5px; cursor:default; flex-shrink:0; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>

      {/* ═══ SIDEBAR ═══ */}
      <aside className="rc-sidebar" style={{background:'#0b0e1a',borderRight:'1px solid rgba(255,255,255,.05)',display:'flex',flexDirection:'column',height:'100vh',position:'sticky',top:0,zIndex:100}}>
        <div style={{padding:'20px 20px 14px',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
          {!logoErr
            ?<img src="/img/kicklast02.png" alt="Kick Last" style={{height:22}} onError={()=>setLogoErr(true)}/>
            :<span style={{fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:700,color:'#8dc63f',letterSpacing:2}}>KICK LAST</span>
          }
        </div>

        {perfil&&(
          <div style={{padding:'14px 16px',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:34,height:34,borderRadius:'50%',background:'rgba(141,198,63,.1)',border:'1.5px solid rgba(141,198,63,.3)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:700,color:'#8dc63f',flexShrink:0}}>
                {(perfil.username||perfil.full_name||'R').charAt(0).toUpperCase()}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:600,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{perfil.username||perfil.full_name||'RECLUTA'}</div>
                <div style={{fontSize:9,color:'rgba(255,255,255,.35)',marginTop:2}}>{(perfil.pitchx_balance||0).toLocaleString()} PX · {perfil.lives||0} vidas</div>
              </div>
            </div>
          </div>
        )}

        <nav style={{flex:1,padding:'8px 0',overflowY:'auto'}}>
          <div style={{fontSize:8,color:'rgba(255,255,255,.2)',fontFamily:"'Oswald',sans-serif",letterSpacing:2,padding:'10px 20px 4px',textTransform:'uppercase'}}>Panel</div>
          <div className="s-menu" onClick={()=>router.push('/radar')}><Target size={14}/> Radar</div>
          <div className="s-menu" onClick={()=>router.push('/radar')}><Wallet size={14}/> Mis ganancias</div>
          <div className="s-menu" onClick={()=>router.push('/radar')}><User size={14}/> Mi perfil</div>
          <div className="s-menu" onClick={()=>router.push('/radar')}><History size={14}/> Historial</div>
          <div style={{fontSize:8,color:'rgba(255,255,255,.2)',fontFamily:"'Oswald',sans-serif",letterSpacing:2,padding:'10px 20px 4px',textTransform:'uppercase'}}>Economía</div>
          <div className="s-menu active"><Zap size={14}/> Recargar</div>
          <div className="s-menu" onClick={()=>router.push('/radar')}><Users size={14}/> Mis referidos</div>
          <div className="s-menu" onClick={()=>router.push('/radar')}><Activity size={14}/> Mis predicciones</div>
        </nav>

        <div style={{padding:'14px 20px',borderTop:'1px solid rgba(255,255,255,.05)'}}>
          <button onClick={async()=>{await supabase.auth.signOut();router.push('/');}}
            style={{display:'flex',alignItems:'center',gap:8,background:'none',border:'none',color:'rgba(239,68,68,.4)',fontSize:11,cursor:'pointer',width:'100%',transition:'color .15s'}}
            onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
            onMouseLeave={e=>e.currentTarget.style.color='rgba(239,68,68,.4)'}>
            <LogOut size={13}/> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ═══ ÁREA PRINCIPAL ═══ */}
      <main style={{flex:1,display:'flex',flexDirection:'column',height:'100vh',overflowY:'auto'}}>

        {/* TOPBAR */}
        <div style={{height:52,borderBottom:'1px solid rgba(255,255,255,.05)',background:'#0b0e1a',padding:'0 28px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:40,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button onClick={()=>router.back()} style={{background:'transparent',border:'1px solid rgba(255,255,255,.08)',borderRadius:4,color:'rgba(255,255,255,.4)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',width:28,height:28,transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#8dc63f';e.currentTarget.style.color='#8dc63f';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.08)';e.currentTarget.style.color='rgba(255,255,255,.4)';}}>
              <ChevronLeft size={14}/>
            </button>
            <span style={{fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:600,color:'rgba(255,255,255,.35)',letterSpacing:2}}>RECARGA · PITCHX</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5,fontSize:9,color:'rgba(255,255,255,.4)'}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'#8dc63f',display:'inline-block',animation:'blink 2s infinite'}}/>
            Sistema activo · Mundial 2026
          </div>
        </div>

        {/* HERO */}
        <div style={{position:'relative',height:260,overflow:'hidden',flexShrink:0}}>
          <img src="/img/kick9.jpg" alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
          <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,rgba(10,13,20,.95) 0%,rgba(10,13,20,.6) 60%,rgba(10,13,20,.2) 100%)'}}/>
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:80,background:'linear-gradient(transparent,#0a0d14)'}}/>
          <div style={{position:'relative',zIndex:2,height:'100%',padding:'0 40px',display:'flex',flexDirection:'column',justifyContent:'flex-end',paddingBottom:32}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:6,marginBottom:12,padding:'4px 10px',background:'rgba(141,198,63,.12)',border:'1px solid rgba(141,198,63,.3)',borderRadius:2,width:'fit-content'}}>
              <Zap size={10} style={{color:'#8dc63f'}}/>
              <span style={{fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,color:'#8dc63f',letterSpacing:2,textTransform:'uppercase'}}>Recarga tu cuenta</span>
            </div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:36,fontWeight:700,color:'#fff',lineHeight:1.05,textTransform:'uppercase',marginBottom:8}}>
              COMPRA TUS <span style={{color:'#8dc63f'}}>CRÉDITOS PX</span>
            </div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.5)',maxWidth:420,lineHeight:1.6}}>
              Elige tu paquete, selecciona tu país y continúa al pago seguro
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="rc-main-grid">

          {/* ── COL IZQUIERDA: RESUMEN STICKY ── */}
          <div style={{borderRight:'1px solid rgba(255,255,255,.05)',background:'#0b0e1a'}}>
            <div style={{position:'sticky',top:52,padding:'24px 20px',display:'flex',flexDirection:'column',gap:16}}>

              {/* Header resumen */}
              <div>
                <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,color:'rgba(255,255,255,.3)',letterSpacing:2,textTransform:'uppercase',marginBottom:12}}>Resumen de compra</div>

                {/* Usuario */}
                {perfil&&(
                  <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',background:'#111827',border:'1px solid rgba(255,255,255,.06)',borderRadius:6,marginBottom:14}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(141,198,63,.1)',border:'1.5px solid rgba(141,198,63,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Oswald',sans-serif",fontSize:15,fontWeight:700,color:'#8dc63f',flexShrink:0}}>
                      {(perfil.username||perfil.full_name||'R').charAt(0).toUpperCase()}
                    </div>
                    <div style={{minWidth:0}}>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:600,color:'#fff'}}>{perfil.username||perfil.full_name||'RECLUTA'}</div>
                      <div style={{fontSize:10,color:'rgba(255,255,255,.3)',marginTop:2}}>{(perfil.pitchx_balance||0).toLocaleString()} PX disponibles</div>
                    </div>
                  </div>
                )}

                {/* Selección activa */}
                <AnimatePresence mode="wait">
                  {haySeleccion?(
                    <motion.div key="sel" initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
                      style={{background:'rgba(141,198,63,.06)',border:'1px solid rgba(141,198,63,.2)',borderRadius:6,padding:'16px',marginBottom:14}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                        <span style={{fontFamily:"'Oswald',sans-serif",fontSize:8,color:'rgba(255,255,255,.3)',letterSpacing:1.5,textTransform:'uppercase'}}>Recarga seleccionada</span>
                        <button onClick={()=>{setPaqueteSel(null);setMontoCustom('');setModoCustom(false);}} style={{background:'none',border:'none',color:'rgba(255,255,255,.3)',cursor:'pointer'}}><X size={12}/></button>
                      </div>
                      <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:6}}>
                        <span style={{fontFamily:"'Oswald',sans-serif",fontSize:48,fontWeight:700,color:'#fff',lineHeight:1}}>{pxActivo}</span>
                        <span style={{fontFamily:"'Oswald',sans-serif",fontSize:18,color:'#8dc63f'}}>PX</span>
                      </div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>
                        = {paisSel.simbolo}{montoActivoLocal>=1000?Math.round(montoActivoLocal).toLocaleString('es-CO'):montoActivoLocal.toFixed(2)} {paisSel.moneda}
                      </div>
                    </motion.div>
                  ):(
                    <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}}
                      style={{background:'rgba(255,255,255,.02)',border:'1px dashed rgba(255,255,255,.07)',borderRadius:6,padding:'20px',marginBottom:14,textAlign:'center'}}>
                      <Zap size={20} style={{margin:'0 auto 6px',color:'rgba(255,255,255,.1)',display:'block'}}/>
                      <div style={{fontSize:10,color:'rgba(255,255,255,.2)',fontFamily:"'Oswald',sans-serif",letterSpacing:1}}>SELECCIONA UN PAQUETE</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Desglose */}
                <div style={{background:'#111827',border:'1px solid rgba(255,255,255,.06)',borderRadius:6,padding:'14px',marginBottom:14}}>
                  {[
                    {l:'País',  v:`${paisSel.bandera} ${paisSel.nombre}`},
                    {l:'Moneda',v:paisSel.moneda},
                    {l:'Tasa',  v:`1 PX = ${paisSel.simbolo}${paisSel.tasa>=100?Math.round(paisSel.tasa).toLocaleString('es-CO'):paisSel.tasa.toFixed(2)}`},
                    ...(haySeleccion?[{l:'PX a recibir',v:`${pxActivo} PX`}]:[]),
                  ].map((r,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',marginBottom:i<3?8:0,fontSize:11,paddingBottom:i<3?8:0,borderBottom:i<3?'1px solid rgba(255,255,255,.04)':'none'}}>
                      <span style={{color:'rgba(255,255,255,.35)'}}>{r.l}</span>
                      <span style={{color:'#fff',fontFamily:"'Oswald',sans-serif",fontSize:12}}>{r.v}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div style={{background:haySeleccion?'rgba(141,198,63,.06)':'rgba(255,255,255,.02)',border:`1px solid ${haySeleccion?'rgba(141,198,63,.25)':'rgba(255,255,255,.06)'}`,borderRadius:6,padding:'14px',marginBottom:14,textAlign:'center',transition:'all .3s'}}>
                  <div style={{fontSize:8,fontFamily:"'Oswald',sans-serif",letterSpacing:2,color:'rgba(255,255,255,.3)',marginBottom:6,textTransform:'uppercase'}}>Total a pagar</div>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontSize:32,fontWeight:700,color:haySeleccion?'#fff':'rgba(255,255,255,.15)',lineHeight:1}}>
                    {haySeleccion?`${paisSel.simbolo}${montoActivoLocal>=1000?Math.round(montoActivoLocal).toLocaleString('es-CO'):montoActivoLocal.toFixed(2)}`:'—'}
                  </div>
                  {haySeleccion&&<div style={{fontSize:9,color:'rgba(255,255,255,.3)',marginTop:4}}>{paisSel.moneda}</div>}
                </div>

                {/* CTA */}
                <motion.button onClick={irCheckout} disabled={!haySeleccion}
                  whileHover={haySeleccion?{scale:1.01}:{}}
                  whileTap={haySeleccion?{scale:0.99}:{}}
                  style={{width:'100%',padding:'13px',border:'none',background:haySeleccion?'#8dc63f':'rgba(255,255,255,.05)',color:haySeleccion?'#0a0d14':'rgba(255,255,255,.2)',fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:700,letterSpacing:1.5,cursor:haySeleccion?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all .2s',textTransform:'uppercase',borderRadius:4,boxShadow:haySeleccion?'0 4px 20px rgba(141,198,63,.25)':'none'}}>
                  {haySeleccion?<><ArrowRight size={15}/> CONTINUAR AL PAGO</>:'SELECCIONA UN PAQUETE'}
                </motion.button>

                {/* Seguridad */}
                <div style={{display:'flex',justifyContent:'center',gap:20,marginTop:12}}>
                  {[{icon:<Lock size={9}/>,label:'SSL'},{icon:<Shield size={9}/>,label:'SEGURO'},{icon:<Globe size={9}/>,label:'GLOBAL'}].map((b,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:4,fontSize:8,color:'rgba(255,255,255,.18)',fontFamily:"'Oswald',sans-serif",letterSpacing:1}}>{b.icon}{b.label}</div>
                  ))}
                </div>
              </div>

              {/* PIN Banner */}
              <div onClick={()=>router.push('/radar')}
                style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'rgba(141,198,63,.05)',border:'1px solid rgba(141,198,63,.15)',borderRadius:6,cursor:'pointer',transition:'all .2s'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='rgba(141,198,63,.35)';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='rgba(141,198,63,.15)';}}>
                <div style={{width:34,height:34,borderRadius:6,background:'rgba(141,198,63,.1)',border:'1px solid rgba(141,198,63,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Key size={15} style={{color:'#8dc63f'}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontSize:10,fontWeight:700,color:'#fff',letterSpacing:.5,marginBottom:2}}>¿TIENES UN CÓDIGO PIN?</div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,.35)'}}>Canjéalo en tu panel de recargas</div>
                </div>
                <ArrowRight size={13} style={{color:'rgba(141,198,63,.4)',flexShrink:0}}/>
              </div>
            </div>
          </div>

          {/* ── COL DERECHA: PAÍS + PAQUETES + MÉTODOS ── */}
          <div style={{padding:'28px 32px',overflowY:'auto'}}>

            {/* SELECTOR PAÍS */}
            <div style={{marginBottom:28}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,color:'rgba(255,255,255,.3)',letterSpacing:2,textTransform:'uppercase',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:3,height:10,background:'#8dc63f',borderRadius:1,display:'inline-block'}}/>
                Tu país de juego
              </div>

              <div style={{position:'relative'}}>
                <button onClick={()=>setShowPaises(v=>!v)}
                  style={{width:'100%',background:'#111827',border:`1px solid ${showPaises?'#8dc63f':'rgba(255,255,255,.08)'}`,borderRadius:6,padding:'16px 20px',display:'flex',alignItems:'center',gap:16,cursor:'pointer',transition:'border-color .2s'}}>
                  <span style={{fontSize:28}}>{paisSel.bandera}</span>
                  <div style={{flex:1,textAlign:'left'}}>
                    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:600,color:'#fff',marginBottom:3}}>{paisSel.nombre}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,.4)',display:'flex',alignItems:'center',gap:8}}>
                      <span style={{background:'rgba(141,198,63,.12)',border:'1px solid rgba(141,198,63,.2)',borderRadius:3,padding:'1px 7px',color:'#8dc63f',fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:10}}>{paisSel.moneda}</span>
                      <span>1 PX = {paisSel.simbolo}{paisSel.tasa>=100?Math.round(paisSel.tasa).toLocaleString('es-CO'):paisSel.tasa.toFixed(2)}</span>
                    </div>
                  </div>
                  <ChevronDown size={16} style={{color:'rgba(255,255,255,.3)',transform:showPaises?'rotate(180deg)':'none',transition:'transform .2s',flexShrink:0}}/>
                </button>

                <AnimatePresence>
                  {showPaises&&(
                    <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}}
                      style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:'#111827',border:'1px solid rgba(141,198,63,.2)',borderRadius:6,zIndex:100,overflow:'hidden',maxHeight:280,overflowY:'auto',boxShadow:'0 12px 40px rgba(0,0,0,.8)'}}>
                      {paises.map(p=>(
                        <div key={p.code} className="popt" onClick={()=>{setPaisSel(p);setShowPaises(false);setPaqueteSel(null);setMontoCustom('');setModoCustom(false);}}>
                          <span style={{fontSize:18}}>{p.bandera}</span>
                          <div style={{flex:1}}>
                            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,color:'#fff'}}>{p.nombre}</div>
                            <div style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>{p.moneda} · 1 PX = {p.simbolo}{p.tasa>=100?Math.round(p.tasa).toLocaleString('es-CO'):p.tasa.toFixed(2)}</div>
                          </div>
                          {paisSel.code===p.code&&<Check size={13} style={{color:'#8dc63f'}}/>}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* PAQUETES */}
            <div style={{marginBottom:28}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,color:'rgba(255,255,255,.3)',letterSpacing:2,textTransform:'uppercase',display:'flex',alignItems:'center',gap:8}}>
                  <span style={{width:3,height:10,background:'#8dc63f',borderRadius:1,display:'inline-block'}}/>
                  Elige cuántos PX recargar
                </div>
                <button onClick={()=>{setModoCustom(v=>!v);setPaqueteSel(null);setMontoCustom('');}}
                  style={{background:modoCustom?'#8dc63f':'transparent',border:'1px solid rgba(141,198,63,.4)',borderRadius:4,padding:'6px 14px',color:modoCustom?'#0a0d14':'#8dc63f',cursor:'pointer',display:'flex',alignItems:'center',gap:5,fontSize:9,fontFamily:"'Oswald',sans-serif",fontWeight:700,letterSpacing:1,textTransform:'uppercase',transition:'all .2s'}}>
                  <Edit3 size={11}/> {modoCustom?'VER PAQUETES':'VALOR LIBRE'}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {modoCustom?(
                  <motion.div key="custom" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
                    <div style={{background:'#111827',border:'1px solid rgba(141,198,63,.2)',borderRadius:6,padding:'28px 24px'}}>
                      <div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginBottom:20,textAlign:'center'}}>
                        ¿Cuántos <strong style={{color:'#8dc63f'}}>PX</strong> quieres recargar?
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:14,justifyContent:'center',marginBottom:16}}>
                        <button type="button" onClick={()=>setMontoCustom(v=>String(Math.max(1,(parseInt(v)||0)-1)))}
                          style={{width:48,height:56,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:6,color:'rgba(255,255,255,.6)',cursor:'pointer',fontSize:22,fontWeight:700,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.08)'}
                          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.04)'}>−</button>
                        <div style={{width:160}}>
                          <input type="number" className="cinp" placeholder="Ej: 15" value={montoCustom} onChange={e=>setMontoCustom(e.target.value)} min={1}/>
                        </div>
                        <button type="button" onClick={()=>setMontoCustom(v=>String((parseInt(v)||0)+1))}
                          style={{width:48,height:56,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:6,color:'rgba(255,255,255,.6)',cursor:'pointer',fontSize:22,fontWeight:700,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.08)'}
                          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.04)'}>+</button>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:700,color:'#8dc63f',flexShrink:0}}>PX</div>
                      </div>
                      {montoCustom&&parseInt(montoCustom)>=1&&(
                        <motion.div initial={{opacity:0}} animate={{opacity:1}}
                          style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',background:'rgba(141,198,63,.06)',borderRadius:6,border:'1px solid rgba(141,198,63,.15)'}}>
                          <span style={{fontSize:11,color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:1}}>Pagarás</span>
                          <span style={{fontFamily:"'Oswald',sans-serif",fontSize:22,fontWeight:700,color:'#8dc63f'}}>{precioCustom(parseInt(montoCustom))}</span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ):(
                  <motion.div key="pkgs" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    <div className="pkg-grid">
                      {PAQUETES.map((pkg,i)=>(
                        <motion.div key={pkg.id}
                          className={`pkg ${paqueteSel?.id===pkg.id?'sel':''} ${pkg.destacado?'popular':''}`}
                          onClick={()=>setPaqueteSel(pkg)}
                          initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                          transition={{delay:i*0.06}} whileTap={{scale:0.97}}>
                          {pkg.tag&&(
                            <div style={{position:'absolute',top:0,left:0,right:0,background:pkg.destacado?'#8dc63f':'rgba(141,198,63,.15)',padding:'4px 0',fontSize:8,fontFamily:"'Oswald',sans-serif",fontWeight:700,letterSpacing:1,color:pkg.destacado?'#0a0d14':'#8dc63f',textAlign:'center',textTransform:'uppercase'}}>
                              {pkg.tag}
                            </div>
                          )}
                          <div style={{marginTop:pkg.tag?18:0}}>
                            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:44,fontWeight:700,color:'#fff',lineHeight:1,marginBottom:2,textAlign:'center'}}>{pkg.px}</div>
                            <div style={{fontSize:9,color:'#8dc63f',fontFamily:"'Oswald',sans-serif",letterSpacing:2,marginBottom:10,textAlign:'center'}}>PX</div>
                            <div style={{height:1,background:'rgba(255,255,255,.06)',marginBottom:10}}/>
                            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:paqueteSel?.id===pkg.id?'#8dc63f':'rgba(255,255,255,.6)',textAlign:'center'}}>{precioLocal(pkg.usd)}</div>
                          </div>
                          {paqueteSel?.id===pkg.id&&(
                            <motion.div initial={{scale:0}} animate={{scale:1}}
                              style={{position:'absolute',top:8,right:8,width:18,height:18,borderRadius:'50%',background:'#8dc63f',display:'flex',alignItems:'center',justifyContent:'center'}}>
                              <Check size={11} color="#0a0d14" strokeWidth={3}/>
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                    <div style={{marginTop:10,fontSize:10,color:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',gap:5}}>
                      <span>💱</span>
                      <span>1 PX = {paisSel.simbolo}{paisSel.tasa>=100?Math.round(paisSel.tasa).toLocaleString('es-CO'):paisSel.tasa.toFixed(2)} {paisSel.moneda}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* MÉTODOS DE PAGO */}
            <div style={{marginBottom:28}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,color:'rgba(255,255,255,.3)',letterSpacing:2,textTransform:'uppercase',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:3,height:10,background:'#8dc63f',borderRadius:1,display:'inline-block'}}/>
                Métodos de pago aceptados
              </div>
              <div style={{background:'#111827',border:'1px solid rgba(255,255,255,.06)',borderRadius:6,padding:'20px 24px'}}>
                <div style={{display:'flex',flexWrap:'wrap',gap:10,marginBottom:16}}>
                  {METODOS_PAGO.map((m,i)=>(
                    <div key={i} title={m.nombre}
                      style={{width:56,height:34,borderRadius:4,background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid rgba(255,255,255,.1)',overflow:'hidden'}}>
                      {m.logo==='VISA'&&<span style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:700,color:'#1a1f71',letterSpacing:1}}>VISA</span>}
                      {m.logo==='MC'&&(
                        <div style={{display:'flex',position:'relative',width:28,height:18}}>
                          <div style={{width:18,height:18,borderRadius:'50%',background:'#eb001b',position:'absolute',left:0}}/>
                          <div style={{width:18,height:18,borderRadius:'50%',background:'#f79e1b',position:'absolute',right:0,opacity:.9}}/>
                        </div>
                      )}
                      {m.logo==='NEQ'&&<span style={{fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,color:'#6d0191'}}>NEQUI</span>}
                      {m.logo==='BCO'&&<span style={{fontFamily:"'Oswald',sans-serif",fontSize:7,fontWeight:700,color:'#ffd100',background:'#003893',padding:'2px 4px',borderRadius:2}}>BANCOLOMBIA</span>}
                      {m.logo==='DAV'&&<span style={{fontFamily:"'Oswald',sans-serif",fontSize:8,fontWeight:700,color:'#e4002b'}}>DAVIPLATA</span>}
                      {m.logo==='₮'&&<span style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:700,color:'#26a17b'}}>₮ USDT</span>}
                      {m.logo==='PP'&&<span style={{fontFamily:"'Oswald',sans-serif",fontSize:10,fontWeight:700,color:'#003087'}}>Pay<span style={{color:'#009cde'}}>Pal</span></span>}
                      {m.logo==='EFT'&&<span style={{fontFamily:"'Oswald',sans-serif",fontSize:8,fontWeight:700,color:'#f7941d'}}>EFECTY</span>}
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,paddingTop:14,borderTop:'1px solid rgba(255,255,255,.05)'}}>
                  <CreditCard size={12} style={{color:'rgba(255,255,255,.2)',flexShrink:0}}/>
                  <span style={{fontSize:10,color:'rgba(255,255,255,.25)',lineHeight:1.5}}>Pagos procesados con encriptación SSL de 256 bits. Tu información financiera está protegida en todo momento.</span>
                </div>
              </div>
            </div>

            {/* GARANTÍAS */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {[
                {icon:<Shield size={16}/>, titulo:'Pago seguro', desc:'Encriptación SSL 256-bit en todas las transacciones'},
                {icon:<Zap size={16}/>, titulo:'Acreditación inmediata', desc:'Tus PX se acreditan al instante en tu cuenta'},
                {icon:<Smartphone size={16}/>, titulo:'Soporte 24/7', desc:'Asistencia disponible en todo momento para ti'},
              ].map((g,i)=>(
                <div key={i} style={{background:'#111827',border:'1px solid rgba(255,255,255,.06)',borderRadius:6,padding:'16px',display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{width:32,height:32,borderRadius:4,background:'rgba(141,198,63,.08)',border:'1px solid rgba(141,198,63,.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#8dc63f'}}>
                    {g.icon}
                  </div>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:700,color:'#fff'}}>{g.titulo}</div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,.3)',lineHeight:1.5}}>{g.desc}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
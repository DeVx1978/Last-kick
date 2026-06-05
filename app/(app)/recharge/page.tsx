"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Lock, Shield, Globe, ArrowRight, Check, X, ChevronDown, Zap, Edit3,
  Target, Wallet, User, History, Users, Activity, LogOut, Key
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
    <div style={{display:'flex',minHeight:'100vh',background:'#0a0d14',fontFamily:"'Roboto',sans-serif",color:'#fff',overflow:'hidden'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0d14}::-webkit-scrollbar-thumb{background:rgba(141,198,63,.3);border-radius:2px}

        /* ── GRID PRINCIPAL: resumen | paquetes | patrocinador ── */
        .rc-grid{
          display:grid;
          grid-template-columns:360px 1fr 300px;
          gap:28px;
          max-width:1440px;
          margin:0 auto;
          padding:36px 40px 80px;
          align-items:start;
        }
        /* tablet: ocultar columna publicidad */
        @media(max-width:1280px){
          .rc-grid{grid-template-columns:340px 1fr;}
          .rc-col-ad{display:none !important;}
        }
        /* mobile: single col */
        @media(max-width:840px){
          .rc-grid{grid-template-columns:1fr;padding:20px 16px 80px;gap:20px;}
        }

        /* ── PAQUETES: 5 columnas grandes ── */
        .pkg-grid{
          display:grid;
          grid-template-columns:repeat(5,1fr);
          gap:12px;
        }
        @media(max-width:600px){.pkg-grid{grid-template-columns:repeat(3,1fr);}}
        @media(max-width:400px){.pkg-grid{grid-template-columns:repeat(2,1fr);}}

        /* ── SIDEBAR ── */
        .s-menu{display:flex;align-items:center;gap:12px;padding:12px 24px;color:rgba(255,255,255,.5);font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;border-left:3px solid transparent;}
        .s-menu:hover{color:#fff;background:rgba(255,255,255,.02);}
        .s-menu.active{color:#8dc63f;background:rgba(141,198,63,.08);border-left-color:#8dc63f;font-weight:700;}

        /* ── CARDS PAQUETE ── */
        .pkg{
          background:#111827;
          border:1px solid rgba(255,255,255,.08);
          border-radius:10px;
          padding:22px 10px 18px;
          text-align:center;
          cursor:pointer;
          transition:all .18s;
          position:relative;
          overflow:hidden;
          user-select:none;
          min-height:120px;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
        }
        .pkg:hover{
          border-color:rgba(141,198,63,.5);
          background:#141e2a;
          transform:translateY(-3px);
          box-shadow:0 8px 28px rgba(0,0,0,.5);
        }
        .pkg.sel{
          border-color:#8dc63f;
          border-top:3px solid #8dc63f;
          background:linear-gradient(160deg,#0f1f10 0%,#0d1a10 100%);
          box-shadow:0 0 0 1px rgba(141,198,63,.2),0 10px 30px rgba(141,198,63,.1);
        }
        .pkg.popular{border-color:rgba(141,198,63,.3);}

        /* ── DROPDOWN OPCIONES ── */
        .popt{display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;transition:background .12s;border-bottom:1px solid rgba(255,255,255,.04);}
        .popt:hover{background:rgba(141,198,63,.05);}
        .popt:last-child{border-bottom:none;}

        /* ── LABEL SECCIÓN ── */
        .slbl{font-size:10px;font-family:'Oswald',sans-serif;color:rgba(255,255,255,.4);letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px;}
        .slbl::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.08);}

        /* ── INPUT CUSTOM ── */
        .cinp{width:100%;background:#000 !important;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:14px;color:#fff !important;font-family:'Oswald',sans-serif;font-size:26px;font-weight:700;outline:none;text-align:center;letter-spacing:2px;transition:all .2s;}
        .cinp:focus{border-color:#8dc63f;box-shadow:0 0 0 3px rgba(141,198,63,.1);}
        .cinp::placeholder{color:rgba(255,255,255,.2);font-size:16px;letter-spacing:0;font-weight:400;}
        .cinp::-webkit-outer-spin-button,.cinp::-webkit-inner-spin-button{-webkit-appearance:none;}
        .cinp[type=number]{-moz-appearance:textfield;}

        /* ── PIN BANNER ── */
        .pin-banner{
          display:flex;
          align-items:center;
          gap:14px;
          padding:16px 20px;
          background:linear-gradient(90deg,rgba(141,198,63,.08) 0%,rgba(141,198,63,.03) 100%);
          border:1px solid rgba(141,198,63,.2);
          border-radius:10px;
          margin-top:16px;
          cursor:pointer;
          transition:all .2s;
        }
        .pin-banner:hover{border-color:rgba(141,198,63,.5);background:linear-gradient(90deg,rgba(141,198,63,.14) 0%,rgba(141,198,63,.06) 100%);}

        /* ── MOBILE: ocultar sidebar ── */
        @media(max-width:900px){
          .rc-sidebar{display:none !important;}
        }
      `}</style>

      {/* ═══════════════════════════════════════
          SIDEBAR
      ═══════════════════════════════════════ */}
      <aside className="rc-sidebar" style={{width:260,flexShrink:0,background:'#0b0e14',borderRight:'1px solid rgba(255,255,255,.05)',display:'flex',flexDirection:'column',height:'100vh',position:'sticky',top:0,zIndex:100}}>
        <div style={{padding:'24px',display:'flex',alignItems:'center'}}>
          {!logoErr
            ?<img src="/img/kicklast02.png" alt="Kick Last" style={{height:22}} onError={()=>setLogoErr(true)}/>
            :<span style={{fontFamily:"'Oswald',sans-serif",fontSize:18,fontWeight:700,color:'#8dc63f',letterSpacing:2}}>KICK LAST</span>
          }
        </div>

        {perfil&&(
          <div style={{padding:'0 20px',marginBottom:20}}>
            <div style={{background:'#111827',border:'1px solid rgba(255,255,255,.05)',borderRadius:8,padding:'16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(141,198,63,.1)',border:'1.5px solid #8dc63f',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:700,color:'#8dc63f'}}>
                  {(perfil.username||perfil.full_name||'R').charAt(0).toUpperCase()}
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:600,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {perfil.username||perfil.full_name||'RECLUTA'}
                  </div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,.4)',marginTop:2,display:'flex',alignItems:'center',gap:4}}>
                    <span style={{color:perfil.status==='VIVO'?'#8dc63f':'#f59e0b',fontSize:8}}>●</span>
                    {perfil.status||'VIVO'}
                  </div>
                </div>
              </div>
              <div style={{display:'flex',borderTop:'1px solid rgba(255,255,255,.05)',paddingTop:12}}>
                <div style={{flex:1,textAlign:'center',borderRight:'1px solid rgba(255,255,255,.05)'}}>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontSize:18,fontWeight:700,color:'#fff',lineHeight:1}}>{perfil.lives||0}</div>
                  <div style={{fontSize:9,color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:1,marginTop:4}}>Vidas</div>
                </div>
                <div style={{flex:1,textAlign:'center'}}>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontSize:18,fontWeight:700,color:'#8dc63f',lineHeight:1}}>{(perfil.pitchx_balance||0).toLocaleString()}</div>
                  <div style={{fontSize:9,color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:1,marginTop:4}}>Créditos</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{flex:1,overflowY:'auto'}}>
          <div style={{fontSize:10,color:'rgba(255,255,255,.3)',fontFamily:"'Oswald',sans-serif",letterSpacing:1.5,padding:'0 24px',marginBottom:8,textTransform:'uppercase'}}>Panel de juego</div>
          <div className="s-menu" onClick={()=>router.push('/radar')}><Target size={16}/> Radar</div>
          <div className="s-menu" onClick={()=>router.push('/radar')}><Wallet size={16}/> Mis ganancias</div>
          <div className="s-menu" onClick={()=>router.push('/radar')}><User size={16}/> Mi perfil</div>
          <div className="s-menu" onClick={()=>router.push('/radar')}><History size={16}/> Historial</div>
          <div style={{fontSize:10,color:'rgba(255,255,255,.3)',fontFamily:"'Oswald',sans-serif",letterSpacing:1.5,padding:'24px 24px 8px',textTransform:'uppercase'}}>Economía</div>
          <div className="s-menu active"><Zap size={16}/> Recargar</div>
          <div className="s-menu" onClick={()=>router.push('/radar')}><Users size={16}/> Mis referidos</div>
          <div className="s-menu" onClick={()=>router.push('/radar')}><Activity size={16}/> Mis predicciones</div>
        </div>

        <div style={{padding:'20px 24px',borderTop:'1px solid rgba(255,255,255,.05)'}}>
          <button onClick={async()=>{await supabase.auth.signOut();router.push('/');}}
            style={{display:'flex',alignItems:'center',gap:10,background:'none',border:'none',color:'rgba(239,68,68,.5)',fontSize:13,fontWeight:500,cursor:'pointer',width:'100%',transition:'color .15s'}}
            onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
            onMouseLeave={e=>e.currentTarget.style.color='rgba(239,68,68,.5)'}>
            <LogOut size={16}/> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════
          ÁREA PRINCIPAL
      ═══════════════════════════════════════ */}
      <main style={{flex:1,display:'flex',flexDirection:'column',height:'100vh',overflowY:'auto'}}>

        {/* TOPBAR */}
        <div style={{height:56,borderBottom:'1px solid rgba(255,255,255,.06)',background:'#0b0e1a',padding:'0 32px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:40,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <button onClick={()=>router.back()} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:6,color:'rgba(255,255,255,.5)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',width:32,height:32,transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#8dc63f';e.currentTarget.style.color='#8dc63f';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.08)';e.currentTarget.style.color='rgba(255,255,255,.5)';}}>
              <ChevronLeft size={16}/>
            </button>
            <div style={{width:1,height:14,background:'rgba(255,255,255,.08)'}}/>
            <span style={{fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:600,color:'rgba(255,255,255,.4)',letterSpacing:2}}>
               <span style={{color:'#8dc63f',margin:'0 6px'}}>—</span> RECARGAS
            </span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,fontSize:10,color:'rgba(255,255,255,.5)'}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'#8dc63f',display:'inline-block'}}/>
            Sistema activo · Mundial 2026
          </div>
        </div>

        {/* HERO BANNER */}
        <div style={{position:'relative',height:220,overflow:'hidden',flexShrink:0}}>
          <img src="/img/kick9.jpg" alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',zIndex:0}}/>
          <div style={{position:'absolute',inset:0,background:'linear-gradient(100deg,rgba(10,13,20,.92) 25%,rgba(10,13,20,.5) 60%,rgba(10,13,20,.1) 100%)',zIndex:1}}/>
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:70,background:'linear-gradient(transparent,#0a0d14)',zIndex:2}}/>
          <div style={{position:'relative',zIndex:3,height:'100%',padding:'0 40px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:6,marginBottom:10,padding:'5px 12px',background:'rgba(141,198,63,.12)',border:'1px solid rgba(141,198,63,.35)',borderRadius:3,width:'fit-content'}}>
              <Zap size={11} style={{color:'#8dc63f'}}/>
              <span style={{fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,color:'#8dc63f',letterSpacing:2,textTransform:'uppercase'}}>Recarga tu cuenta</span>
            </div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:34,fontWeight:700,color:'#fff',lineHeight:1.05,textTransform:'uppercase',marginBottom:8,textShadow:'2px 2px 12px rgba(0,0,0,.9)'}}>
              COMPRA TUS <span style={{color:'#8dc63f'}}>CRÉDITOS PX</span>
            </div>
            <div style={{fontSize:13,color:'rgba(255,255,255,.6)',maxWidth:400,lineHeight:1.5,textShadow:'0 1px 4px rgba(0,0,0,.9)'}}>
              Elige tu paquete, confirma y sigue jugando
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            GRID: [RESUMEN] | [PAÍS + PAQUETES] | [PUBLICIDAD]
        ═══════════════════════════════════════ */}
        <div className="rc-grid">

          {/* ── COL 1: RESUMEN DE COMPRA ── */}
          <div style={{display:'flex',flexDirection:'column'}}>
            <div className="slbl">Resumen de compra</div>
            <div style={{position:'sticky',top:76}}>
              <div style={{background:'#111827',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,overflow:'hidden'}}>

                {/* Header resumen */}
                <div style={{background:'rgba(141,198,63,.06)',borderBottom:'1px solid rgba(141,198,63,.1)',padding:'16px 22px'}}>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,letterSpacing:2,color:'#8dc63f',marginBottom:3,textTransform:'uppercase'}}>Resumen de compra</div>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontSize:18,fontWeight:700,color:'#fff'}}>Kick Last · PitchX</div>
                </div>

                <div style={{padding:22}}>
                  {/* Usuario */}
                  {perfil&&(
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18,padding:13,background:'rgba(255,255,255,.03)',borderRadius:8,border:'1px solid rgba(255,255,255,.06)'}}>
                      <div style={{width:40,height:40,borderRadius:'50%',background:'rgba(141,198,63,.1)',border:'1.5px solid rgba(141,198,63,.3)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:700,color:'#8dc63f',flexShrink:0}}>
                        {(perfil.username||perfil.full_name||'R').charAt(0).toUpperCase()}
                      </div>
                      <div style={{minWidth:0}}>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:600,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{perfil.username||perfil.full_name||'RECLUTA'}</div>
                        <div style={{fontSize:11,color:'rgba(255,255,255,.35)',marginTop:3,display:'flex',alignItems:'center',gap:5}}>
                          <span style={{color:perfil.status==='VIVO'?'#8dc63f':'#f59e0b',fontSize:9}}>●</span>
                          {perfil.status||'VIVO'}
                          <span style={{color:'rgba(255,255,255,.15)'}}>|</span>
                          {(perfil.pitchx_balance||0).toLocaleString()} PX
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Paquete seleccionado o placeholder */}
                  <AnimatePresence mode="wait">
                    {haySeleccion?(
                      <motion.div key="sel" initial={{opacity:0}} animate={{opacity:1}}
                        style={{background:'rgba(141,198,63,.05)',border:'1px solid rgba(141,198,63,.2)',borderRadius:10,padding:16,marginBottom:16}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:9,color:'rgba(255,255,255,.4)',letterSpacing:1,textTransform:'uppercase'}}>Recarga seleccionada</div>
                          <button onClick={()=>{setPaqueteSel(null);setMontoCustom('');setModoCustom(false);}} style={{background:'none',border:'none',color:'rgba(255,255,255,.3)',cursor:'pointer',padding:2}}><X size={13}/></button>
                        </div>
                        <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:44,fontWeight:700,color:'#fff',lineHeight:1}}>{pxActivo}</div>
                          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,color:'#8dc63f'}}>PX</div>
                        </div>
                        <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginTop:4}}>
                          = {paisSel.simbolo}{montoActivoLocal>=1000?Math.round(montoActivoLocal).toLocaleString('es-CO'):montoActivoLocal.toFixed(2)} {paisSel.moneda}
                        </div>
                      </motion.div>
                    ):(
                      <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}}
                        style={{background:'rgba(255,255,255,.02)',border:'1px dashed rgba(255,255,255,.08)',borderRadius:10,padding:24,marginBottom:16,textAlign:'center'}}>
                        <Zap size={24} style={{margin:'0 auto 8px',color:'rgba(255,255,255,.12)',display:'block'}}/>
                        <div style={{fontSize:11,color:'rgba(255,255,255,.2)',fontFamily:"'Oswald',sans-serif",letterSpacing:1}}>SELECCIONA UN PAQUETE</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Desglose */}
                  <div style={{borderTop:'1px solid rgba(255,255,255,.06)',paddingTop:14,marginBottom:16}}>
                    {[
                      {l:'País',  v:`${paisSel.bandera} ${paisSel.nombre}`},
                      {l:'Moneda',v:paisSel.moneda},
                      {l:'Tasa',  v:`1 PX = ${paisSel.simbolo}${paisSel.tasa>=100?Math.round(paisSel.tasa).toLocaleString('es-CO'):paisSel.tasa.toFixed(2)}`},
                      ...(haySeleccion?[{l:'PX a recibir',v:`${pxActivo} PX`}]:[]),
                    ].map((r,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:12}}>
                        <span style={{color:'rgba(255,255,255,.4)'}}>{r.l}</span>
                        <span style={{color:'#fff',fontFamily:"'Oswald',sans-serif"}}>{r.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div style={{background:'#0a0d14',border:`1px solid ${haySeleccion?'rgba(141,198,63,.3)':'rgba(255,255,255,.06)'}`,borderRadius:10,padding:'14px 18px',marginBottom:16,textAlign:'center',transition:'border-color .3s'}}>
                    <div style={{fontSize:9,fontFamily:"'Oswald',sans-serif",letterSpacing:2,color:'rgba(255,255,255,.3)',marginBottom:6,textTransform:'uppercase'}}>Total a pagar</div>
                    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:34,fontWeight:700,color:haySeleccion?'#fff':'rgba(255,255,255,.15)',lineHeight:1}}>
                      {haySeleccion?`${paisSel.simbolo}${montoActivoLocal>=1000?Math.round(montoActivoLocal).toLocaleString('es-CO'):montoActivoLocal.toFixed(2)}`:'—'}
                    </div>
                    {haySeleccion&&<div style={{fontSize:10,color:'rgba(255,255,255,.3)',marginTop:4}}>{paisSel.moneda}</div>}
                  </div>

                  {/* CTA */}
                  <motion.button onClick={irCheckout} disabled={!haySeleccion}
                    whileHover={haySeleccion?{scale:1.02}:{}} whileTap={haySeleccion?{scale:0.98}:{}}
                    style={{width:'100%',padding:15,borderRadius:8,border:'none',background:haySeleccion?'#8dc63f':'rgba(255,255,255,.06)',color:haySeleccion?'#0a0d14':'rgba(255,255,255,.2)',fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,letterSpacing:1.5,cursor:haySeleccion?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:haySeleccion?'0 6px 24px rgba(141,198,63,.3)':'none',transition:'all .2s',textTransform:'uppercase'}}>
                    {haySeleccion?<><ArrowRight size={16}/> CONTINUAR AL PAGO</>:'SELECCIONA UN PAQUETE'}
                  </motion.button>

                  {/* Badges seguridad */}
                  <div style={{display:'flex',justifyContent:'center',gap:18,marginTop:14}}>
                    {[{icon:<Lock size={10}/>,label:'SEGURO'},{icon:<Shield size={10}/>,label:'CIFRADO'},{icon:<Globe size={10}/>,label:'GLOBAL'}].map((b,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:4,fontSize:9,color:'rgba(255,255,255,.2)',fontFamily:"'Oswald',sans-serif",letterSpacing:1}}>{b.icon}{b.label}</div>
                    ))}
                  </div>
                </div>

                {/* ── PIN: integrado en el card, bien diseñado ── */}
                <div
                  className="pin-banner"
                  style={{margin:'0 22px 22px',cursor:'pointer'}}
                  onClick={()=>router.push('/radar')}
                >
                  <div style={{width:38,height:38,borderRadius:8,background:'rgba(141,198,63,.12)',border:'1px solid rgba(141,198,63,.25)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Key size={18} style={{color:'#8dc63f'}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:700,color:'#fff',letterSpacing:.5,marginBottom:2}}>¿TIENES UN CÓDIGO PIN?</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,.4)',lineHeight:1.3}}>Canjéalo directamente en tu panel de recargas</div>
                  </div>
                  <ArrowRight size={14} style={{color:'rgba(141,198,63,.5)',flexShrink:0}}/>
                </div>
              </div>
            </div>
          </div>

          {/* ── COL 2: PAÍS + PAQUETES ── */}
          <div style={{display:'flex',flexDirection:'column',gap:28}}>

            {/* SELECTOR DE PAÍS */}
            <div>
              <div className="slbl">Tu país de juego</div>
              <div style={{position:'relative'}}>
                <button onClick={()=>setShowPaises(v=>!v)} style={{width:'100%',background:'#111827',border:`1px solid ${showPaises?'#8dc63f':'rgba(255,255,255,.1)'}`,borderRadius:10,padding:'14px 18px',display:'flex',alignItems:'center',gap:14,cursor:'pointer',transition:'border-color .2s'}}>
                  <span style={{fontSize:24}}>{paisSel.bandera}</span>
                  <div style={{flex:1,textAlign:'left'}}>
                    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:15,fontWeight:600,color:'#fff'}}>{paisSel.nombre}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:2}}>
                      {paisSel.moneda} · 1 PX = {paisSel.simbolo}{paisSel.tasa>=100?Math.round(paisSel.tasa).toLocaleString('es-CO'):paisSel.tasa.toFixed(2)}
                    </div>
                  </div>
                  <ChevronDown size={15} style={{color:'rgba(255,255,255,.35)',transform:showPaises?'rotate(180deg)':'none',transition:'transform .2s'}}/>
                </button>
                <AnimatePresence>
                  {showPaises&&(
                    <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                      style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:'#111827',border:'1px solid rgba(141,198,63,.25)',borderRadius:10,zIndex:100,overflow:'hidden',maxHeight:300,overflowY:'auto',boxShadow:'0 16px 40px rgba(0,0,0,.8)'}}>
                      {paises.map(p=>(
                        <div key={p.code} className="popt" onClick={()=>{setPaisSel(p);setShowPaises(false);setPaqueteSel(null);setMontoCustom('');setModoCustom(false);}}>
                          <span style={{fontSize:18}}>{p.bandera}</span>
                          <div style={{flex:1}}>
                            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,color:'#fff'}}>{p.nombre}</div>
                            <div style={{fontSize:10,color:'rgba(255,255,255,.35)'}}>{p.moneda} · 1 PX = {p.simbolo}{p.tasa>=100?Math.round(p.tasa).toLocaleString('es-CO'):p.tasa.toFixed(2)}</div>
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
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <div className="slbl" style={{marginBottom:0,flex:1}}>Elige cuántos PX recargar</div>
                <button onClick={()=>{setModoCustom(v=>!v);setPaqueteSel(null);setMontoCustom('');}}
                  style={{background:modoCustom?'#8dc63f':'transparent',border:'1px solid #8dc63f',borderRadius:6,padding:'7px 16px',color:modoCustom?'#0a0d14':'#8dc63f',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:10,fontFamily:"'Oswald',sans-serif",fontWeight:700,letterSpacing:1,textTransform:'uppercase',transition:'all .2s',boxShadow:modoCustom?'0 0 12px rgba(141,198,63,.35)':'none'}}>
                  <Edit3 size={12}/> {modoCustom?'VER PAQUETES':'VALOR LIBRE'}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {modoCustom?(
                  <motion.div key="custom" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
                    <div style={{background:'#111827',border:'1px solid rgba(141,198,63,.25)',borderRadius:12,padding:28,marginBottom:12}}>
                      <div style={{fontSize:12,color:'rgba(255,255,255,.45)',marginBottom:18,textAlign:'center'}}>
                        ¿Cuántos <strong style={{color:'#8dc63f'}}>PX</strong> quieres recargar?
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:14,justifyContent:'center'}}>
                        <button type="button" onClick={()=>setMontoCustom(v=>String(Math.max(1,(parseInt(v)||0)-1)))}
                          style={{width:46,height:58,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,color:'rgba(255,255,255,.7)',cursor:'pointer',fontSize:24,fontWeight:700,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'background .15s'}}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}
                          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.05)'}>−</button>
                        <div style={{width:160}}>
                          <input type="number" className="cinp" placeholder="Ej: 15" value={montoCustom} onChange={e=>setMontoCustom(e.target.value)} min={1}/>
                        </div>
                        <button type="button" onClick={()=>setMontoCustom(v=>String((parseInt(v)||0)+1))}
                          style={{width:46,height:58,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,color:'rgba(255,255,255,.7)',cursor:'pointer',fontSize:24,fontWeight:700,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'background .15s'}}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}
                          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.05)'}>+</button>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:700,color:'#8dc63f',flexShrink:0}}>PX</div>
                      </div>
                      {montoCustom&&parseInt(montoCustom)>=1&&(
                        <motion.div initial={{opacity:0}} animate={{opacity:1}}
                          style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:20,padding:'13px 18px',background:'rgba(141,198,63,.06)',borderRadius:8,border:'1px solid rgba(141,198,63,.15)'}}>
                          <span style={{fontSize:12,color:'rgba(255,255,255,.5)',textTransform:'uppercase',letterSpacing:1}}>Pagarás</span>
                          <span style={{fontFamily:"'Oswald',sans-serif",fontSize:24,fontWeight:700,color:'#8dc63f'}}>{precioCustom(parseInt(montoCustom))}</span>
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
                          initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                          transition={{delay:i*0.05}} whileTap={{scale:0.96}}>
                          {pkg.tag&&(
                            <div style={{position:'absolute',top:0,left:0,right:0,background:pkg.destacado?'#8dc63f':'rgba(141,198,63,.15)',padding:'4px 0',fontSize:9,fontFamily:"'Oswald',sans-serif",fontWeight:700,letterSpacing:1,color:pkg.destacado?'#0a0d14':'#8dc63f',textAlign:'center'}}>
                              {pkg.tag}
                            </div>
                          )}
                          <div style={{marginTop:pkg.tag?14:0,width:'100%'}}>
                            {/* Número PX grande */}
                            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:42,fontWeight:700,color:'#fff',lineHeight:1,marginBottom:2,textAlign:'center'}}>{pkg.px}</div>
                            <div style={{fontSize:10,color:'#8dc63f',fontFamily:"'Oswald',sans-serif",letterSpacing:2,marginBottom:12,textAlign:'center'}}>PX</div>
                            <div style={{height:1,background:'rgba(255,255,255,.06)',marginBottom:10}}/>
                            {/* Precio local */}
                            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:paqueteSel?.id===pkg.id?'#8dc63f':'rgba(255,255,255,.7)',textAlign:'center',letterSpacing:.5}}>{precioLocal(pkg.usd)}</div>
                          </div>
                          {paqueteSel?.id===pkg.id&&(
                            <motion.div initial={{scale:0}} animate={{scale:1}}
                              style={{position:'absolute',top:8,right:8,width:20,height:20,borderRadius:'50%',background:'#8dc63f',display:'flex',alignItems:'center',justifyContent:'center'}}>
                              <Check size={12} color="#0a0d14" strokeWidth={3}/>
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                    <div style={{marginTop:12,fontSize:11,color:'rgba(255,255,255,.25)',display:'flex',alignItems:'center',gap:5}}>
                      <span>💱</span>
                      <span>1 PX = {paisSel.simbolo}{paisSel.tasa>=100?Math.round(paisSel.tasa).toLocaleString('es-CO'):paisSel.tasa.toFixed(2)} {paisSel.moneda}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── COL 3: PUBLICIDAD (derecha) ── */}
          <div className="rc-col-ad" style={{display:'flex',flexDirection:'column'}}>
            <div className="slbl">Patrocinador oficial</div>
            <div style={{position:'sticky',top:76,minHeight:520,background:'#0a0d14',border:'1px solid rgba(255,255,255,.06)',borderRadius:12,overflow:'hidden',cursor:'pointer',transition:'border-color .2s',boxShadow:'0 10px 40px rgba(0,0,0,.5)'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(141,198,63,.4)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.06)'}>
              {/* BADGE */}
              <div style={{position:'absolute',top:14,right:14,background:'#8dc63f',padding:'5px 12px',borderRadius:4,fontSize:9,fontWeight:800,color:'#0a0d14',fontFamily:"'Oswald',sans-serif",letterSpacing:1.5,zIndex:10,textTransform:'uppercase',boxShadow:'0 4px 12px rgba(0,0,0,.5)'}}>
                
              </div>
              {/* IMAGEN */}
              <img src="/img/kick10.jpg" alt="Publicidad" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',zIndex:0}}/>
              {/* GRADIENTE INFERIOR */}
              <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(to top,#0a0d14 0%,rgba(10,13,20,.88) 50%,transparent 100%)',padding:'80px 24px 30px',textAlign:'center',zIndex:1}}>
                <div style={{fontFamily:"'Oswald',sans-serif",fontSize:28,fontWeight:700,color:'#fff',textTransform:'uppercase',marginBottom:8,lineHeight:1.1,textShadow:'0 4px 12px rgba(0,0,0,.9)'}}>
                  <br/>
                </div>
                <div style={{fontSize:12,color:'#8dc63f',fontWeight:600,letterSpacing:.5,marginBottom:20}}>
                  
                </div>
                <button style={{background:'rgba(141,198,63,.1)',border:'1px solid #8dc63f',color:'#8dc63f',padding:'10px 24px',borderRadius:6,fontFamily:"'Oswald',sans-serif",fontSize:12,letterSpacing:1.5,fontWeight:700,cursor:'pointer',transition:'all .2s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='#8dc63f';e.currentTarget.style.color='#0a0d14';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(141,198,63,.1)';e.currentTarget.style.color='#8dc63f';}}>
                  DESCUBRIR MÁS
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
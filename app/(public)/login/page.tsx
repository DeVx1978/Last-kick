"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Activity, X, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const IMAGEN_FONDO = '/img/pintura1.jpg';

/* ── Ojo tracking ── */
const TrackingEye = ({
  show, onClick, mousePos,
}: { show: boolean; onClick: () => void; mousePos: { x: number; y: number } }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const r  = ref.current.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    const dx = mousePos.x - cx;
    const dy = mousePos.y - cy;
    const a  = Math.atan2(dy, dx);
    const d  = Math.sqrt(dx * dx + dy * dy);
    setOffset({
      x: Math.cos(a) * Math.min(2.5, d / 35),
      y: Math.sin(a) * Math.min(2.5, d / 35),
    });
  }, [mousePos]);

  return (
    <button type="button" ref={ref} onClick={onClick} className="lp-eye-btn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx={12 + offset.x} cy={12 + offset.y} r="3"
          fill={show ? 'transparent' : 'currentColor'} />
        {show && <line x1="3" y1="3" x2="21" y2="21" />}
      </svg>
    </button>
  );
};

/* ══════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════ */
export default function LoginPortal() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [isRecovering, setIsRecovering] = useState(false);
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [msg,          setMsg]          = useState('');
  const [msgType,      setMsgType]      = useState<'error'|'success'|'warn'>('error');
  const [mousePos,     setMousePos]     = useState({ x: 0, y: 0 });

  /* ── Leer mensaje del middleware o de la URL ── */
  useEffect(() => {
    const message = searchParams.get('message');
    const em      = searchParams.get('email');

    switch (message) {
      case 'verify-email':
        setMsg(
          `Debes verificar tu correo${em ? ` (${em})` : ''} antes de ingresar. Revisa tu bandeja de entrada.`
        );
        setMsgType('warn');
        break;

      case 'session-required':
        setMsg('Debes iniciar sesión para acceder al radar.');
        setMsgType('warn');
        break;

      case 'email-confirmed':
        setMsg('¡Tu correo fue verificado correctamente! Ya puedes iniciar sesión.');
        setMsgType('success');
        break;

      case 'session-expired':
        setMsg('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        setMsgType('warn');
        break;

      case 'signed-out':
        setMsg('Cerraste sesión correctamente.');
        setMsgType('success');
        break;

      default:
        break;
    }
  }, [searchParams]);

  /* Mouse tracking */
  useEffect(() => {
    const h = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const showMsg = (text: string, type: 'error'|'success'|'warn' = 'error') => {
    setMsg(text); setMsgType(type);
  };

  /* ── Login ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showMsg('Ingresa tu correo y contraseña'); return;
    }
    setIsLoading(true);
    showMsg('Verificando credenciales...', 'success');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut();
        showMsg(
          'Debes verificar tu correo antes de ingresar. Revisa tu bandeja de entrada.',
          'warn'
        );
        setIsLoading(false);
        return;
      }

      showMsg('Acceso concedido. Ingresando...', 'success');
      const { data: profileData } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', data.user.id)
  .maybeSingle();
const rolesAdmin        = ['admin', 'super_admin', 'finance_admin'];
const rolesPromotor     = ['promotor'];
const rolesDistribuidor = ['distribuidor'];
const rol = profileData?.role ?? '';
const destino = rolesAdmin.includes(rol) ? '/admin'
  : rolesPromotor.includes(rol) ? '/promotor'
  : rolesDistribuidor.includes(rol) ? '/distribuidor'
  : '/radar';
setTimeout(() => router.push(destino), 1200);

    } catch (err: any) {
      setIsLoading(false);
      if (err.message?.includes('Invalid login credentials')) {
        showMsg('Correo o contraseña incorrectos. Verifica tus datos.');
      } else if (err.message?.includes('Email not confirmed')) {
        showMsg('Debes verificar tu correo antes de ingresar.', 'warn');
      } else {
        showMsg(err.message || 'Error al ingresar. Intenta de nuevo.');
      }
    }
  };

  /* ── Recuperar contraseña ── */
  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showMsg('Ingresa tu correo electrónico para recuperar la contraseña'); return;
    }
    setIsLoading(true);
    showMsg('Enviando enlace...', 'success');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      showMsg('¡Enlace enviado! Revisa tu bandeja de entrada.', 'success');
      setTimeout(() => { setIsRecovering(false); setMsg(''); }, 4000);
    } catch (err: any) {
      showMsg(err.message || 'Error al enviar el enlace.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lp-root">
      <style dangerouslySetInnerHTML={{ __html: LP_STYLES(mousePos, IMAGEN_FONDO) }} />

      <div className="lp-bg" />
      <div className="lp-grid" />
      <div className="lp-bg-vignette" />

      <motion.div className="lp-card-wrap"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}>
        <div className="lp-form-inner">

          <button className="lp-close" onClick={() => router.push('/')} aria-label="Cerrar">
            <X size={18} />
          </button>

          <div className="lp-header">
            <img src="/img/logo12.png" alt="KICK LAST" className="lp-logo"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            <div className="lp-subtitle">
              {isRecovering ? 'Recuperar contraseña' : 'Iniciar sesión'}
            </div>
          </div>

          {/* Mensajes de estado */}
          <AnimatePresence>
            {msg && (
              <motion.div key="msg"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`lp-msg ${msgType}`}>
                {msg}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">

            {/* ══ MODO RECUPERACIÓN ══ */}
            {isRecovering ? (
              <motion.div key="recover"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>

                <div className="lp-section-label">Tu correo registrado</div>

                <div className="lp-field">
                  <input type="email" className="lp-input"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoFocus />
                  <Mail size={14} className="lp-field-icon" />
                </div>

                <button className="lp-btn-submit"
                  onClick={handleRecoverPassword}
                  disabled={isLoading}>
                  {isLoading
                    ? <Activity className="animate-spin" size={16} />
                    : 'Enviar enlace de recuperación'
                  }
                </button>

                <button type="button" className="lp-btn-link"
                  onClick={() => { setIsRecovering(false); setMsg(''); }}>
                  ← Volver al inicio de sesión
                </button>
              </motion.div>

            ) : (

              /* ══ MODO LOGIN ══ */
              <motion.div key="login"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.25 }}>

                <form onSubmit={handleLogin} autoComplete="off">

                  <div className="lp-section-label">Tus credenciales</div>

                  <div className="lp-field">
                    <input type="email" className="lp-input"
                      placeholder="Correo electrónico"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required />
                    <Mail size={14} className="lp-field-icon" />
                  </div>

                  <div className="lp-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="lp-input"
                      placeholder="Contraseña"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required />
                    <Lock size={14} className="lp-field-icon" />
                    <TrackingEye
                      show={showPassword}
                      onClick={() => setShowPassword(!showPassword)}
                      mousePos={mousePos}
                    />
                  </div>

                  <button type="button" className="lp-forgot"
                    onClick={() => { setIsRecovering(true); setMsg(''); }}>
                    ¿Olvidaste tu contraseña?
                  </button>

                  <button type="submit" className="lp-btn-submit" disabled={isLoading}>
                    {isLoading
                      ? <Activity className="animate-spin" size={16} />
                      : <><span>Ingresar</span><ChevronRight size={16} /></>
                    }
                  </button>

                  <div className="lp-divider"><span>¿No tienes cuenta?</span></div>

                  <button type="button" className="lp-btn-link"
                    onClick={() => router.push('/register')}>
                    Crear cuenta gratis
                  </button>

                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Estilos originales con optimización estructural responsiva ── */
function LP_STYLES(mousePos: { x: number; y: number }, bg: string) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap');
    
    .lp-root { 
      min-height: 100vh; 
      width: 100vw; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      background: #0a0d14; 
      font-family: 'Roboto', sans-serif; 
      padding: 40px 16px; /* Ajuste para dar espacio vertical en móviles */
      position: relative; 
      overflow-x: hidden; 
    }
    .lp-bg { position: fixed; inset: 0; z-index: 0; background: url('${bg}') center center/cover no-repeat; filter: brightness(0.22) saturate(0.7); }
    .lp-bg-vignette { position: fixed; inset: 0; z-index: 1; pointer-events: none; background: radial-gradient(circle 500px at ${mousePos.x}px ${mousePos.y}px,rgba(141,198,63,0.05) 0%,rgba(0,0,0,0.65) 100%); }
    .lp-grid { position: fixed; inset: 0; z-index: 1; pointer-events: none; background: linear-gradient(rgba(141,198,63,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(141,198,63,0.025) 1px,transparent 1px); background-size: 48px 48px; }
    
    .lp-card-wrap { 
      position: relative; 
      z-index: 10; 
      width: 100%; 
      max-width: 420px; 
      border-radius: 10px; 
      padding: 2px; 
      overflow: hidden; 
      box-shadow: 0 24px 80px rgba(0,0,0,0.9); 
    }
    .lp-card-wrap::before, .lp-card-wrap::after { content: ''; position: absolute; top: -60%; left: -60%; width: 220%; height: 220%; background: conic-gradient(transparent 0deg, transparent 200deg, #8dc63f 240deg, rgba(255,255,255,0.5) 270deg, #8dc63f 300deg, transparent 360deg); animation: lp-snake 5s linear infinite; z-index: 0; }
    .lp-card-wrap::after { filter: blur(14px); opacity: 0.5; }
    @keyframes lp-snake { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
    
    .lp-form-inner { 
      position: relative; 
      z-index: 1; 
      background: rgba(8,11,20,0.98); 
      border-radius: 8px; 
      padding: 36px 28px 30px; 
      width: 100%;
    }
    .lp-close { position: absolute; top: 14px; right: 14px; background: transparent; border: none; color: rgba(255,255,255,0.2); cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
    .lp-close:hover { color: #8dc63f; transform: rotate(90deg); }
    .lp-header { text-align: center; margin-bottom: 28px; }
    .lp-logo { height: 40px; width: auto; margin: 0 auto 10px; display: block; filter: drop-shadow(0 0 18px rgba(141,198,63,0.35)); }
    .lp-subtitle { font-family: 'Oswald', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 3px; color: #8dc63f; text-transform: uppercase; }
    
    .lp-section-label { font-family: 'Oswald', sans-serif; font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.25); letter-spacing: 2px; text-transform: uppercase; margin: 0 0 14px; display: flex; align-items: center; gap: 8px; }
    .lp-section-label::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(141,198,63,0.2), transparent); }
    
    .lp-field { position: relative; margin-bottom: 12px; width: 100%; }
    
    .lp-input { 
      width: 100%; 
      background: rgba(255,255,255,0.04) !important; 
      color: #fff !important; 
      border: 1px solid rgba(255,255,255,0.08) !important; 
      padding: 13px 14px 13px 42px; 
      border-radius: 6px; 
      font-size: 12px; 
      outline: none; 
      transition: border-color 0.2s, box-shadow 0.2s; 
      font-family: 'Roboto', sans-serif; 
    }
    .lp-input:focus { border-color: #8dc63f !important; box-shadow: 0 0 0 3px rgba(141,198,63,0.1) !important; }
    .lp-input:-webkit-autofill { -webkit-text-fill-color: #fff !important; -webkit-box-shadow: 0 0 0 1000px rgba(8,11,20,0.98) inset !important; }
    .lp-input::placeholder { color: rgba(255,255,255,0.22); font-size: 11px; }
    
    .lp-field-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.2); pointer-events: none; z-index: 2; transition: color 0.2s; }
    .lp-field:focus-within .lp-field-icon { color: #8dc63f; }
    .lp-eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: rgba(255,255,255,0.2); cursor: pointer; z-index: 3; padding: 2px; transition: color 0.15s; }
    .lp-eye-btn:hover { color: #8dc63f; }
    
    .lp-forgot { background: transparent; border: none; color: rgba(255,255,255,0.25); font-size: 11px; font-weight: 500; cursor: pointer; transition: color 0.2s; padding: 0; display: block; text-align: right; width: 100%; margin: -4px 0 14px; }
    .lp-forgot:hover { color: #8dc63f; }
    
    .lp-msg { padding: 10px 14px; border-radius: 5px; margin-bottom: 14px; font-size: 11px; font-weight: 500; line-height: 1.5; border-left: 3px solid #ef4444; background: rgba(239,68,68,0.08); color: #ef4444; }
    .lp-msg.success { border-left-color: #8dc63f; background: rgba(141,198,63,0.08); color: #8dc63f; }
    .lp-msg.warn { border-left-color: #f59e0b; background: rgba(245,158,11,0.08); color: #f59e0b; }
    
    .lp-btn-submit { width: 100%; padding: 13px; background: #8dc63f; border: none; color: #0a0d14; border-radius: 6px; font-family: 'Oswald', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 16px rgba(141,198,63,0.25); margin-bottom: 16px; }
    .lp-btn-submit:hover { background: #7ab52f; transform: translateY(-1px); }
    .lp-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    
    .lp-btn-link { width: 100%; background: transparent; border: none; color: rgba(255,255,255,0.28); font-size: 11px; font-weight: 500; cursor: pointer; transition: color 0.2s; padding: 6px; text-align: center; }
    .lp-btn-link:hover { color: rgba(255,255,255,0.7); }
    
    .lp-divider { display: flex; align-items: center; gap: 10px; margin: 4px 0 14px; width: 100%; }
    .lp-divider::before, .lp-divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
    .lp-divider span { font-size: 10px; color: rgba(255,255,255,0.2); white-space: nowrap; letter-spacing: 1px; }
    
    /* ADAPTACIÓN TOTAL PARA TODOS LOS DISPOSITIVOS MOBILE */
    @media(max-width: 480px) { 
      .lp-card-wrap { max-width: 95% !important; }
      .lp-form-inner { padding: 28px 18px 24px; } 
      .lp-logo { height: 34px; } 
    }
    @media(max-width: 360px) { 
      .lp-form-inner { padding: 24px 14px 20px; } 
      .lp-subtitle { font-size: 9px; letter-spacing: 2px; } 
      .lp-input { padding: 13px 10px 13px 38px; font-size: 11px; }
      .lp-field-icon { left: 10px; }
    }
    @media(max-height: 600px) {
      .lp-root { padding: 20px 16px; align-items: flex-start; overflow-y: auto; }
      .lp-header { margin-bottom: 16px; }
    }
  `;
}
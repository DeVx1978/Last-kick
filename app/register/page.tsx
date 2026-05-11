"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, ShieldAlert, Activity, Globe, Phone, Check, Target, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
// ✅ CORRECCIÓN: Cliente centralizado — sin keys hardcodeadas
import { supabase } from '@/lib/supabase';

const IMAGEN_FONDO = '/img/bayern1.jpg';

// ✅ Lista de países con códigos — encoding corregido
const COUNTRIES = [
  { name: 'Argentina',  code: '+54',  maxDigits: 10 },
  { name: 'Bolivia',    code: '+591', maxDigits: 9  },
  { name: 'Brasil',     code: '+55',  maxDigits: 11 },
  { name: 'Chile',      code: '+56',  maxDigits: 9  },
  { name: 'Colombia',   code: '+57',  maxDigits: 10 },
  { name: 'Ecuador',    code: '+593', maxDigits: 9  },
  { name: 'Mexico',     code: '+52',  maxDigits: 10 },
  { name: 'Peru',       code: '+51',  maxDigits: 9  },
  { name: 'Venezuela',  code: '+58',  maxDigits: 10 },
  { name: 'España',     code: '+34',  maxDigits: 9  },
  { name: 'USA',        code: '+1',   maxDigits: 10 },
  { name: 'Otro',       code: '',     maxDigits: 15 },
];

// ✅ Componente ojo que sigue al mouse — diseño intacto
const TrackingEye = ({ show, onClick, mousePos }: {
  show: boolean;
  onClick: () => void;
  mousePos: { x: number; y: number };
}) => {
  const eyeRef = useRef<HTMLButtonElement>(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!eyeRef.current) return;
    const rect = eyeRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = mousePos.x - cx;
    const dy = mousePos.y - cy;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);
    setPupilOffset({
      x: Math.cos(angle) * Math.min(2, distance / 40),
      y: Math.sin(angle) * Math.min(2, distance / 40),
    });
  }, [mousePos]);

  return (
    <button type="button" ref={eyeRef} onClick={onClick} className="eye-btn-tactical">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx={12 + pupilOffset.x} cy={12 + pupilOffset.y} r="3" fill={show ? 'transparent' : 'currentColor'} />
        {show && <line x1="3" y1="3" x2="21" y2="21" />}
      </svg>
    </button>
  );
};

export default function RegisterPortal() {
  const router = useRouter();
  const [isLoading, setIsLoading]               = useState(false);
  const [systemMessage, setSystemMessage]       = useState('');
  const [mousePos, setMousePos]                 = useState({ x: 0, y: 0 });
  const [fullName, setFullName]                 = useState('');
  const [gamertag, setGamertag]                 = useState('');
  const [email, setEmail]                       = useState('');
  const [selectedCountry, setSelectedCountry]   = useState(COUNTRIES[4]); // Colombia por defecto
  const [phone, setPhone]                       = useState('');
  const [password, setPassword]                 = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isOver18, setIsOver18]                 = useState(false);
  const [acceptTerms, setAcceptTerms]           = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setSystemMessage('ERROR: CLAVES NO COINCIDEN'); return; }
    if (!isOver18 || !acceptTerms)    { setSystemMessage('ERROR: ACEPTA LOS PROTOCOLOS'); return; }
    if (gamertag.length < 3)          { setSystemMessage('ERROR: ALIAS DEMASIADO CORTO'); return; }

    setIsLoading(true);
    setSystemMessage('ENCRIPTANDO EN LA BOVEDA...');

    try {
      // ✅ PASO 1: Crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            gamertag,
            full_name: fullName,
            phone: `${selectedCountry.code}${phone}`,
            country: selectedCountry.name,
          },
        },
      });

      if (error) throw error;

      // 📝 PASO 2: Sincronización de la Bóveda (Corrección Milimétrica)
      if (data.user) {
        // Generamos el código real estilo Calamar
        const playerCode = `CQ-${Math.floor(Math.random() * 900000) + 100000}`;
        
        // 🛡️ CAMBIAMOS .insert POR .upsert PARA EVITAR EL ERROR DE CLAVE DUPLICADA
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          username: gamertag,             // 👈 Se llena el alias
          full_name: fullName,            // 👈 Se llenan nombres y apellidos
          email: email,
          phone: `${selectedCountry.code}${phone}`, // 👈 Se llena el teléfono
          country: selectedCountry.name,  // 👈 Se llena el país
          role: 'user',                   // Rango inicial recluta
          pitchx_balance: 0,              // Saldo inicial
          lives: 0,                       // Vidas iniciales
          status: 'VIVO',
          streak: 0,
          best_streak: 0,
          is_ghost: false,
          player_code: playerCode,        // 🆔 El código que aparecerá en el expediente
        });

        if (profileError) {
          console.error('ERROR EN BÓVEDA:', profileError.message);
          throw profileError;
        }
      }

      setSystemMessage('DATOS FIRMADOS. ACCESO CONCEDIDO.');
      setTimeout(() => router.push('/radar'), 2000);
    } catch (error: any) {
      setIsLoading(false);
      setSystemMessage(`ERROR: ${error.message.toUpperCase()}`);
    }
  };

  return (
    <div className="auth-portal-container">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@700;900&family=Space+Grotesk:wght@300;500;700&display=swap');

        .auth-portal-container {
          background: #000; min-height: 100vh; width: 100vw;
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden; font-family: 'Space Grotesk', sans-serif;
        }
        .auth-bg {
          position: fixed; inset: 0; z-index: 0;
          background: radial-gradient(circle at 50% 50%, rgba(0,0,0,0.4) 0%, #000 100%), url('${IMAGEN_FONDO}');
          background-size: cover; background-position: center; filter: brightness(0.65);
        }
        .magenta-neon-grid {
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background: linear-gradient(rgba(255,0,51,0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,0,51,0.03) 1px, transparent 1px);
          background-size: 60px 60px; opacity: 0.3;
        }
        .radar-vignette {
          position: fixed; inset: 0; z-index: 2; pointer-events: none;
          background: radial-gradient(circle 450px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgba(0,0,0,0.72) 100%);
        }
        .card-wrapper {
          position: relative; z-index: 10; width: 100%; max-width: 440px;
          background: #000; border-radius: 8px; padding: 3px;
          overflow: hidden; box-shadow: 0 0 50px rgba(0,0,0,1);
          display: flex; flex-direction: column;
        }
        .card-wrapper::before, .card-wrapper::after {
          content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
          background: conic-gradient(transparent, transparent, transparent, #FF0033);
          animation: snake-rotate 4s linear infinite; z-index: 0;
        }
        .card-wrapper::after { filter: blur(15px); opacity: 0.8; }
        @keyframes snake-rotate {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .form-content {
          position: relative; z-index: 1;
          background: rgba(5,0,0,0.98); padding: 40px 30px; border-radius: 6px;
        }
        .close-btn {
          position: absolute; top: 15px; right: 15px; background: transparent; border: none;
          color: rgba(255,255,255,0.2); cursor: pointer; transition: 0.3s; z-index: 100;
          display: flex; align-items: center; justify-content: center; padding: 5px;
        }
        .close-btn:hover { color: #FF0033; transform: rotate(90deg) scale(1.2); }
        .auth-header { text-align: center; margin-bottom: 30px; }
        .auth-logo {
          font-family: 'Syncopate', sans-serif; font-size: 24px; font-weight: 900;
          color: white; text-shadow: 0 0 20px rgba(255,0,51,0.8);
        }
        .auth-subtitle {
          font-family: 'Syncopate', sans-serif; font-size: 8px; color: #FF0033;
          letter-spacing: 5px; margin-top: 6px; font-weight: 700;
        }
        .input-group { position: relative; margin-bottom: 14px; width: 100%; }
        .input-row { display: flex; gap: 10px; width: 100%; margin-bottom: 14px; }
        .input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: rgba(255,255,255,0.2); z-index: 5;
        }
        .elite-input, .elite-select {
          width: 100%; background-color: #000 !important; color: #fff !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          padding: 14px 14px 14px 42px; border-radius: 4px; font-size: 11px;
          outline: none; transition: 0.3s;
        }
        .elite-input:-webkit-autofill {
          -webkit-text-fill-color: #fff !important;
          -webkit-box-shadow: 0 0 0px 1000px #000 inset !important;
        }
        .elite-input:focus, .elite-select:focus {
          border-color: #FF0033 !important; box-shadow: 0 0 15px rgba(255,0,51,0.2) !important;
        }
        .eye-btn-tactical {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: rgba(255,255,255,0.2); cursor: pointer; z-index: 10;
        }
        .eye-btn-tactical:hover { color: #fff; }
        .checkbox-container {
          display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
          cursor: pointer; user-select: none;
        }
        .checkbox-box {
          width: 16px; height: 16px; border: 1px solid rgba(255,255,255,0.2);
          border-radius: 2px; display: flex; align-items: center; justify-content: center;
          background: #000; transition: 0.2s; flex-shrink: 0;
        }
        .checkbox-container:hover .checkbox-box { border-color: #FF0033; }
        .checkbox-label {
          font-size: 9px; color: rgba(255,255,255,0.5); text-transform: uppercase;
          letter-spacing: 1px; font-weight: 700;
        }
        .checkbox-label span { color: #FF0033; }
        .submit-btn {
          width: 100%; background: #FF0033; color: #fff; padding: 18px; margin-top: 20px;
          font-family: 'Syncopate', sans-serif; font-weight: 900; font-size: 13px;
          letter-spacing: 3px; cursor: pointer; border-radius: 4px; transition: 0.4s;
          border: 1px solid #FF5577; box-shadow: 0 10px 20px rgba(255,0,51,0.2);
        }
        .submit-btn:hover { background: #fff; color: #FF0033; transform: translateY(-3px); border-color: #fff; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .login-link-btn {
          background: transparent !important; border: none !important;
          color: rgba(255,255,255,0.3) !important; font-size: 10px; font-weight: 900;
          text-transform: uppercase; letter-spacing: 2px; cursor: pointer;
          transition: 0.3s; padding: 10px; margin: 0 auto; display: block;
        }
        .login-link-btn:hover { color: #fff !important; text-shadow: 0 0 10px #fff; }
        .system-message {
          padding: 12px; border-left: 3px solid #FF0033; background: rgba(255,0,51,0.1);
          color: #FF0033; font-size: 10px; font-weight: 900; text-align: center;
          margin-bottom: 15px; font-family: 'Syncopate'; border-radius: 0 4px 4px 0;
        }
        .system-message.success { border-left-color: #00C853; background: rgba(0,200,83,0.1); color: #00C853; }
      `}} />

      <div className="auth-bg" />
      <div className="magenta-neon-grid" />
      <div className="radar-vignette" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="card-wrapper"
      >
        <div className="form-content">
          <button type="button" className="close-btn" onClick={() => router.push('/v2')}>
            <X size={20} />
          </button>

          <div className="auth-header">
            <h1 className="auth-logo">LAST KICK</h1>
            <p className="auth-subtitle">REGISTRO DE USUARIO</p>
          </div>

          <form onSubmit={handleRegister} autoComplete="off">

            <div className="input-group">
              <User size={14} className="input-icon" />
              <input
                className="elite-input"
                placeholder="NOMBRES Y APELLIDOS"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                autoComplete="off"
                required
              />
            </div>

            <div className="input-group">
              <Target size={14} className="input-icon" />
              <input
                className="elite-input"
                placeholder="APODO / ALIAS"
                value={gamertag}
                onChange={e => setGamertag(e.target.value)}
                autoComplete="off"
                required
              />
            </div>

            <div className="input-group">
              <Mail size={14} className="input-icon" />
              <input
                type="email"
                className="elite-input"
                placeholder="CORREO ELECTRONICO"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="off"
                required
              />
            </div>

            <div className="input-row">
              <div className="input-group" style={{ flex: '0 0 150px' }}>
                <Globe size={14} className="input-icon" />
                <select
                  className="elite-select"
                  value={COUNTRIES.indexOf(selectedCountry)}
                  onChange={e => setSelectedCountry(COUNTRIES[parseInt(e.target.value)])}
                >
                  {COUNTRIES.map((c, i) => (
                    <option key={i} value={i}>{c.code} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <Phone size={14} className="input-icon" />
                <input
                  type="tel"
                  className="elite-input"
                  placeholder="TELEFONO"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <Lock size={14} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="elite-input"
                placeholder="CREAR CONTRASEÑA"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <TrackingEye show={showPassword} onClick={() => setShowPassword(!showPassword)} mousePos={mousePos} />
            </div>

            <div className="input-group">
              <ShieldAlert size={14} className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="elite-input"
                placeholder="CONFIRMAR CONTRASEÑA"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <TrackingEye show={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} mousePos={mousePos} />
            </div>

            <div className="mt-6">
              <label className="checkbox-container" onClick={() => setIsOver18(!isOver18)}>
                <div className="checkbox-box">
                  {isOver18 && <Check size={12} color="#00C853" strokeWidth={4} />}
                </div>
                <span className="checkbox-label">SOY <span>MAYOR DE 18 ANOS</span></span>
              </label>
              <label className="checkbox-container" onClick={() => setAcceptTerms(!acceptTerms)}>
                <div className="checkbox-box">
                  {acceptTerms && <Check size={12} color="#00C853" strokeWidth={4} />}
                </div>
                <span className="checkbox-label">ACEPTO LOS <span>TERMINOS Y CONDICIONES</span></span>
              </label>
            </div>

            <AnimatePresence>
              {systemMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`system-message ${systemMessage.includes('CONCEDIDO') ? 'success' : ''}`}
                >
                  {systemMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading
                ? <Activity className="animate-spin mx-auto" size={20} />
                : 'REGISTRARSE'
              }
            </button>

            <div className="mt-8 text-center">
              <button type="button" onClick={() => router.push('/login')} className="login-link-btn">
                ¿YA TIENES UNA CUENTA? INICIAR SESION
              </button>
            </div>

          </form>
        </div>
      </motion.div>
    </div>
  );
}
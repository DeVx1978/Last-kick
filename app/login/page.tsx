"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Activity, X, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
// ✅ CORRECCIÓN: Importamos el cliente centralizado — nunca más keys hardcodeadas
import { supabase } from '@/lib/supabase';

const IMAGEN_FONDO = '/img/allianz1.jpg';

// ✅ Componente del ojo que sigue al mouse — diseño intacto
const TrackingEye = ({ show, onClick, mousePos }: {
  show: boolean;
  onClick: () => void;
  mousePos: { x: number; y: number }
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
      y: Math.sin(angle) * Math.min(2, distance / 40)
    });
  }, [mousePos]);

  return (
    <button type="button" ref={eyeRef} onClick={onClick} className="eye-btn-tactical">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx={12 + pupilOffset.x} cy={12 + pupilOffset.y} r="3" fill={show ? "transparent" : "currentColor"} />
        {show && <line x1="3" y1="3" x2="21" y2="21" />}
      </svg>
    </button>
  );
};

export default function LoginPortal() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [systemMessage, setSystemMessage] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSystemMessage("VERIFICANDO CREDENCIALES...");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSystemMessage("ACCESO CONCEDIDO. SINCRONIZANDO RADAR...");
      setTimeout(() => router.push('/radar'), 1500);
    } catch (error: any) {
      setIsLoading(false);
      setSystemMessage(`FALLO: ${error.message.toUpperCase()}`);
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
          background: radial-gradient(circle 450px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgba(0,0,0,0.75) 100%);
        }

        .card-wrapper {
          position: relative; z-index: 10; width: 100%; max-width: 400px;
          background: #000; border-radius: 8px; padding: 3px; overflow: hidden;
          box-shadow: 0 0 50px rgba(0,0,0,1); display: flex; flex-direction: column;
        }

        .card-wrapper::before, .card-wrapper::after {
          content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
          background: conic-gradient(transparent, transparent, transparent, #FF0033);
          animation: snake-rotate 4s linear infinite; z-index: 0;
        }
        .card-wrapper::after { filter: blur(15px); opacity: 0.8; }

        @keyframes snake-rotate {
          0% { transform: rotate(0deg); }
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
        .input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: rgba(255,255,255,0.2); z-index: 5;
        }

        .elite-input {
          width: 100%; background-color: #000 !important; color: #fff !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          padding: 14px 14px 14px 42px; border-radius: 4px; font-size: 11px;
          outline: none; transition: 0.3s;
        }
        .elite-input:-webkit-autofill,
        .elite-input:-webkit-autofill:hover,
        .elite-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #fff !important;
          -webkit-box-shadow: 0 0 0px 1000px #000 inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        .elite-input:focus {
          border-color: #FF0033 !important;
          box-shadow: 0 0 15px rgba(255,0,51,0.2) !important;
        }

        .eye-btn-tactical {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none !important; border: none !important;
          color: rgba(255,255,255,0.2); cursor: pointer; z-index: 10;
          transition: 0.3s; padding: 5px; display: flex; align-items: center; justify-content: center;
        }
        .eye-btn-tactical:hover { color: #fff; }

        .submit-btn {
          width: 100%; background: #FF0033; color: #fff; padding: 18px; margin-top: 20px;
          font-family: 'Syncopate', sans-serif; font-weight: 900; font-size: 13px;
          letter-spacing: 3px; cursor: pointer; border-radius: 4px; transition: 0.4s;
          border: 1px solid #FF5577; box-shadow: 0 10px 20px rgba(255,0,51,0.2);
        }
        .submit-btn:hover { background: #fff; color: #FF0033; transform: translateY(-3px); border-color: #fff; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .register-link-btn {
          background: transparent !important; border: none !important;
          color: rgba(255,255,255,0.3) !important; font-size: 10px; font-weight: 900;
          text-transform: uppercase; letter-spacing: 2px; cursor: pointer;
          transition: 0.3s; padding: 10px; margin: 0 auto; display: block;
        }
        .register-link-btn:hover { color: #fff !important; text-shadow: 0 0 10px #fff; }

        .system-message {
          padding: 12px; border-left: 3px solid #FF0033; background: rgba(255,0,51,0.1);
          color: #FF0033; font-size: 10px; font-weight: 900; text-align: center;
          margin-bottom: 15px; font-family: 'Syncopate';
        }
        .system-message.success {
          border-left-color: #00C853; background: rgba(0,200,83,0.1); color: #00C853;
        }
      `}} />

      <div className="auth-bg" />
      <div className="magenta-neon-grid" />
      <div className="radar-vignette" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-wrapper"
      >
        <div className="form-content">
          <button type="button" className="close-btn" onClick={() => router.push('/')}>
            <X size={20} />
          </button>

          <div className="auth-header">
            <h1 className="auth-logo">LAST KICK</h1>
            <p className="auth-subtitle">INGRESA TUS DATOS</p>
          </div>

          <form onSubmit={handleLogin} autoComplete="off">
            <div className="input-group">
              <Mail size={14} className="input-icon" />
              <input
                type="email"
                className="elite-input"
                placeholder="CORREO DE RECLUTA"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <Lock size={14} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className="elite-input"
                placeholder="CLAVE ENCRIPTADA"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <TrackingEye
                show={showPassword}
                onClick={() => setShowPassword(!showPassword)}
                mousePos={mousePos}
              />
            </div>

            <AnimatePresence>
              {systemMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`system-message ${systemMessage.includes('CONCEDIDO') ? 'success' : ''}`}
                >
                  {systemMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading
                ? <Activity className="animate-spin mx-auto" size={20} />
                : <span className="flex items-center justify-center gap-2">INGRESAR <ChevronRight size={18} /></span>
              }
            </button>

            <button
              type="button"
              onClick={() => router.push('/register')}
              className="register-link-btn"
            >
              ¿NO TIENES CUENTA? REGISTRARSE
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
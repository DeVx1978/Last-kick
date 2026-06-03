"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, ShieldAlert, Activity,
  Globe, Phone, Check, Target, X, Gift,
  ChevronRight, ChevronLeft, AlertCircle
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const IMAGEN_FONDO = '/img/ronaldinho2.jpg';

const COUNTRIES = [
  { name: 'Colombia',  code: '+57',  flag: '🇨🇴', maxDigits: 10 },
  { name: 'Ecuador',   code: '+593', flag: '🇪🇨', maxDigits: 9  },
  { name: 'México',    code: '+52',  flag: '🇲🇽', maxDigits: 10 },
  { name: 'Argentina', code: '+54',  flag: '🇦🇷', maxDigits: 10 },
  { name: 'Perú',      code: '+51',  flag: '🇵🇪', maxDigits: 9  },
  { name: 'Venezuela', code: '+58',  flag: '🇻🇪', maxDigits: 10 },
  { name: 'Chile',     code: '+56',  flag: '🇨🇱', maxDigits: 9  },
  { name: 'Bolivia',   code: '+591', flag: '🇧🇴', maxDigits: 9  },
  { name: 'Brasil',    code: '+55',  flag: '🇧🇷', maxDigits: 11 },
  { name: 'España',    code: '+34',  flag: '🇪🇸', maxDigits: 9  },
  { name: 'USA',       code: '+1',   flag: '🇺🇸', maxDigits: 10 },
  { name: 'Otro',      code: '',     flag: '🌐',  maxDigits: 15 },
];

const DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = [
  { val: '01', name: 'Enero' },     { val: '02', name: 'Febrero'   },
  { val: '03', name: 'Marzo' },     { val: '04', name: 'Abril'     },
  { val: '05', name: 'Mayo' },      { val: '06', name: 'Junio'     },
  { val: '07', name: 'Julio' },     { val: '08', name: 'Agosto'    },
  { val: '09', name: 'Septiembre'}, { val: '10', name: 'Octubre'   },
  { val: '11', name: 'Noviembre'},  { val: '12', name: 'Diciembre' },
];
const CY    = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => String(CY - 13 - i));

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
    setOffset({ x: Math.cos(a) * Math.min(2.5, d / 35), y: Math.sin(a) * Math.min(2.5, d / 35) });
  }, [mousePos]);
  return (
    <button type="button" ref={ref} onClick={onClick} className="rp-eye-btn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx={12 + offset.x} cy={12 + offset.y} r="3" fill={show ? 'transparent' : 'currentColor'} />
        {show && <line x1="3" y1="3" x2="21" y2="21" />}
      </svg>
    </button>
  );
};

const SuccessScreen = ({ email, onGoHome }: { email: string; onGoHome: () => void }) => (
  <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }} style={{ textAlign: 'center', padding: '8px 0' }}>
    <div className="rp-success-icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
        stroke="#8dc63f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    </div>
    <h2 className="rp-success-title">¡Revisa tu correo!</h2>
    <p className="rp-success-desc">Te enviamos un enlace de verificación a</p>
    <div className="rp-success-email">{email}</div>
    <p className="rp-success-note">
      Haz clic en el enlace del correo para activar tu cuenta.<br />
      <strong>Sin verificar no podrás ingresar al juego.</strong>
    </p>
    <div className="rp-success-steps">
      {['Abre tu correo electrónico','Busca el mensaje de KICK LAST',
        'Haz clic en "Verificar mi cuenta"','Inicia sesión y empieza a predecir'].map((s, i) => (
        <div key={i} className="rp-success-step">
          <span className="rp-success-step-num">{i + 1}</span>{s}
        </div>
      ))}
    </div>
    <p className="rp-success-spam">¿No llegó el correo? Revisa tu carpeta de spam.</p>
    <button className="rp-btn-home" onClick={onGoHome}>Ir al inicio</button>
  </motion.div>
);

/* ══════════════════════════════════════
   INNER — recibe el refCode como prop
   ══════════════════════════════════════ */
function RegisterPortalInner({ initialRef }: { initialRef: string }) {
  const router = useRouter();

  const [step,       setStep]       = useState(1);
  const [registered, setRegistered] = useState(false);
  const [regEmail,   setRegEmail]   = useState('');
  const TOTAL_STEPS = 3;

  const [fullName,        setFullName]        = useState('');
  const [gamertag,        setGamertag]        = useState('');
  const [birthDay,        setBirthDay]        = useState('');
  const [birthMonth,      setBirthMonth]      = useState('');
  const [birthYear,       setBirthYear]       = useState('');
  const [email,           setEmail]           = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phone,           setPhone]           = useState('');
  // ── initialRef viene directo de searchParams antes del primer render ──
  const [referral,        setReferral]        = useState(initialRef);
  const [password,        setPassword]        = useState('');
  const [confirmPw,       setConfirmPw]       = useState('');
  const [showPw,          setShowPw]          = useState(false);
  const [showCPw,         setShowCPw]         = useState(false);
  const [acceptAge,       setAcceptAge]       = useState(false);
  const [acceptData,      setAcceptData]      = useState(false);

  const [gamertagStatus, setGamertagStatus] = useState<'idle'|'checking'|'ok'|'taken'>('idle');
  const [phoneStatus,    setPhoneStatus]    = useState<'idle'|'checking'|'ok'|'taken'>('idle');

  const [isLoading,  setIsLoading]  = useState(false);
  const [msg,        setMsg]        = useState('');
  const [msgType,    setMsgType]    = useState<'error'|'success'>('error');
  const [mousePos,   setMousePos]   = useState({ x: 0, y: 0 });
  const [blocked,    setBlocked]    = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);

  useEffect(() => {
    const h = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const checkRateLimit = (): boolean => {
    const key    = 'lk_reg_attempts';
    const now    = Date.now();
    const stored = localStorage.getItem(key);
    const data   = stored ? JSON.parse(stored) : { count: 0, firstAt: now };
    if (now - data.firstAt > 10 * 60 * 1000) {
      localStorage.setItem(key, JSON.stringify({ count: 1, firstAt: now }));
      return true;
    }
    if (data.count >= 5) {
      const remaining = Math.ceil((10 * 60 * 1000 - (now - data.firstAt)) / 60000);
      setBlocked(true); setBlockTimer(remaining);
      showMsg(`Demasiados intentos. Espera ${remaining} min.`);
      return false;
    }
    localStorage.setItem(key, JSON.stringify({ count: data.count + 1, firstAt: data.firstAt }));
    return true;
  };

  const showMsg = (text: string, type: 'error'|'success' = 'error') => { setMsg(text); setMsgType(type); };

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length <= selectedCountry.maxDigits) setPhone(clean);
  };

  const checkGamertag = useCallback(async (val: string) => {
    if (!val.trim()) return;
    setGamertagStatus('checking');
    const { data } = await supabase.from('profiles').select('id').eq('username', val.trim()).maybeSingle();
    setGamertagStatus(data ? 'taken' : 'ok');
  }, []);

  const checkPhone = useCallback(async (val: string) => {
    if (!val || val.length < selectedCountry.maxDigits - 1) return;
    setPhoneStatus('checking');
    const { data } = await supabase.from('profiles').select('id')
      .eq('phone', `${selectedCountry.code}${val}`).maybeSingle();
    setPhoneStatus(data ? 'taken' : 'ok');
  }, [selectedCountry]);

  const validateStep1 = () => {
    if (!fullName.trim()) { showMsg('Ingresa tu nombre completo'); return false; }
    if (!gamertag.trim()) { showMsg('Ingresa un apodo o alias');   return false; }
    if (gamertagStatus === 'taken') { showMsg('Este apodo ya está en uso'); return false; }
    if (!birthDay || !birthMonth || !birthYear) { showMsg('Selecciona tu fecha de nacimiento completa'); return false; }
    const birth = new Date(`${birthYear}-${birthMonth}-${birthDay}`);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    if (age < 18) { showMsg('Debes ser mayor de 18 años'); return false; }
    return true;
  };

  const validateStep2 = () => {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRe.test(email)) { showMsg('Ingresa un correo electrónico válido'); return false; }
    if (phone.length < selectedCountry.maxDigits - 1) {
      showMsg(`El teléfono debe tener al menos ${selectedCountry.maxDigits - 1} dígitos`); return false;
    }
    if (phoneStatus === 'taken') { showMsg('Este número ya está registrado'); return false; }
    if (referral && !/^LK-[A-Z0-9]{6}$/.test(referral)) {
      showMsg('El código de referido debe tener el formato LK-XXXXXX'); return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (password.length < 6)    { showMsg('La contraseña debe tener mínimo 6 caracteres'); return false; }
    if (password !== confirmPw) { showMsg('Las contraseñas no coinciden'); return false; }
    if (!acceptAge)             { showMsg('Debes confirmar que eres mayor de 18 años'); return false; }
    if (!acceptData)            { showMsg('Debes aceptar los términos y condiciones'); return false; }
    return true;
  };

  const nextStep = () => {
    setMsg('');
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const prevStep = () => { setMsg(''); setStep(s => Math.max(s - 1, 1)); };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (!validateStep3()) return;
    if (!checkRateLimit()) return;
    setIsLoading(true);
    showMsg('Verificando datos...', 'success');

    try {
      const fullPhone    = `${selectedCountry.code}${phone}`;
      const birthDateStr = `${birthYear}-${birthMonth}-${birthDay}`;

      const [emailCheck, phoneCheck, gamertagCheck, referralCheck] = await Promise.all([
        supabase.from('profiles').select('id').eq('email', email).maybeSingle(),
        supabase.from('profiles').select('id').eq('phone', fullPhone).maybeSingle(),
        supabase.from('profiles').select('id').eq('username', gamertag.trim()).maybeSingle(),
        referral
          ? supabase.from('profiles').select('id').eq('referral_code', referral).maybeSingle()
          : Promise.resolve({ data: true, error: null }),
      ]);

      if (emailCheck.data)    { setIsLoading(false); showMsg('Este correo ya tiene una cuenta. ¿Olvidaste tu contraseña?'); return; }
      if (phoneCheck.data)    { setIsLoading(false); showMsg('Este teléfono ya está registrado en otra cuenta.'); return; }
      if (gamertagCheck.data) { setIsLoading(false); showMsg('Este apodo ya está en uso. Elige otro.'); return; }
      if (referral && referralCheck && !referralCheck.data) {
        setIsLoading(false);
        showMsg('El código de referido no existe. Déjalo en blanco si no tienes uno.');
        return;
      }

      showMsg('Creando tu cuenta...', 'success');

      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/login?message=email-confirmed`,
          data: {
            gamertag:      gamertag.trim(),
            full_name:     fullName.trim(),
            phone:         fullPhone,
            country:       selectedCountry.name,
            country_code:  selectedCountry.code,
            birth_date:    birthDateStr,
            referral_code: referral || null,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          showMsg('Este correo ya tiene una cuenta. ¿Olvidaste tu contraseña?');
        } else {
          showMsg(error.message || 'Error al crear la cuenta');
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        const playerCode = `LK-${Math.floor(Math.random() * 900000) + 100000}`;
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id, username: gamertag.trim(), full_name: fullName.trim(),
          email, phone: fullPhone, country: selectedCountry.name,
          country_code: selectedCountry.code, birth_date: birthDateStr,
          role: 'user', pitchx_balance: 0, lives: 0, status: 'VIVO',
          streak: 0, best_streak: 0, is_ghost: false,
          player_code: playerCode, referido_por: referral || null,
        });

        if (profileError) {
          if (profileError.code === '23505') {
            if (profileError.message.includes('phone')) showMsg('Este teléfono ya está registrado en otra cuenta.');
            else if (profileError.message.includes('username')) showMsg('Este apodo ya está en uso. Elige otro.');
            else showMsg('Algunos datos ya están registrados. Verifica la información.');
          } else {
            showMsg(profileError.message || 'Error al guardar tu perfil');
          }
          setIsLoading(false);
          return;
        }
      }

      setRegEmail(email);
      setRegistered(true);

    } catch (err: any) {
      setIsLoading(false);
      showMsg(err.message || 'Error inesperado. Intenta de nuevo.');
    }
  };

  if (registered) {
    return (
      <div className="rp-root">
        <style dangerouslySetInnerHTML={{ __html: BASE_STYLES(mousePos, IMAGEN_FONDO) }} />
        <div className="rp-bg" /><div className="rp-grid" /><div className="rp-bg-vignette" />
        <motion.div className="rp-card-wrap" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <div className="rp-form-inner">
            <div className="rp-header">
              <img src="/img/kicklast02.png" alt="KICK LAST" className="rp-logo"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <SuccessScreen email={regEmail} onGoHome={() => router.push('/')} />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="rp-root">
      <style dangerouslySetInnerHTML={{ __html: BASE_STYLES(mousePos, IMAGEN_FONDO) }} />
      <div className="rp-bg" /><div className="rp-grid" /><div className="rp-bg-vignette" />

      <motion.div className="rp-card-wrap" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <div className="rp-form-inner">

          <button className="rp-close" onClick={() => router.push('/')} aria-label="Cerrar"><X size={18} /></button>

          <div className="rp-header">
            <img src="/img/kicklast02.png" alt="KICK LAST" className="rp-logo"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            <div className="rp-subtitle">Registro de nuevo jugador</div>
          </div>

          <div className="rp-steps">
            {['Perfil', 'Contacto', 'Acceso'].map((label, i) => {
              const n = i + 1;
              const isDone = step > n; const isActive = step === n;
              return (
                <React.Fragment key={n}>
                  <div className="rp-step-item">
                    <div className={`rp-step-circle ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                      {isDone ? <Check size={12} strokeWidth={3} /> : n}
                    </div>
                    <div className={`rp-step-label ${isActive ? 'active' : ''}`}>{label}</div>
                  </div>
                  {i < 2 && <div className={`rp-step-connector ${isDone ? 'done' : ''}`} />}
                </React.Fragment>
              );
            })}
          </div>

          {blocked && <div className="rp-msg" style={{ marginBottom: 16 }}>⏱ Demasiados intentos. Espera {blockTimer} minutos.</div>}

          <form onSubmit={handleRegister} autoComplete="off">
            <AnimatePresence mode="wait">

              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div className="rp-section-title">Información personal</div>
                  <div className="rp-field">
                    <input className="rp-input" placeholder="Nombres y apellidos completos"
                      value={fullName} onChange={e => setFullName(e.target.value)} />
                    <User size={14} className="rp-field-icon" />
                  </div>
                  <div className="rp-field">
                    <input className={`rp-input ${gamertagStatus === 'taken' ? 'rp-input-error' : gamertagStatus === 'ok' ? 'rp-input-ok' : ''}`}
                      placeholder="Apodo / Alias en la plataforma" value={gamertag}
                      onChange={e => { setGamertag(e.target.value); setGamertagStatus('idle'); }}
                      onBlur={e => checkGamertag(e.target.value)} />
                    <Target size={14} className="rp-field-icon" />
                    {gamertagStatus === 'checking' && <div className="rp-field-status"><Activity size={12} className="animate-spin" style={{ color: '#8dc63f' }} /></div>}
                    {gamertagStatus === 'ok'       && <div className="rp-field-status"><Check size={12} style={{ color: '#8dc63f' }} /></div>}
                    {gamertagStatus === 'taken'    && <div className="rp-field-status"><AlertCircle size={12} style={{ color: '#ef4444' }} /></div>}
                  </div>
                  {gamertagStatus === 'taken' && <p className="rp-field-hint error">Este apodo no está disponible</p>}
                  {gamertagStatus === 'ok'    && <p className="rp-field-hint ok">¡Apodo disponible!</p>}
                  <div className="rp-section-title" style={{ marginTop: 16 }}>Fecha de nacimiento</div>
                  <div className="rp-field-row cols-3">
                    <select className="rp-select-flat" value={birthDay} onChange={e => setBirthDay(e.target.value)}>
                      <option value="" style={{ background: '#0a0d14' }}>Día</option>
                      {DAYS.map(d => <option key={d} value={d} style={{ background: '#0a0d14' }}>{d}</option>)}
                    </select>
                    <select className="rp-select-flat" value={birthMonth} onChange={e => setBirthMonth(e.target.value)}>
                      <option value="" style={{ background: '#0a0d14' }}>Mes</option>
                      {MONTHS.map(m => <option key={m.val} value={m.val} style={{ background: '#0a0d14' }}>{m.name}</option>)}
                    </select>
                    <select className="rp-select-flat" value={birthYear} onChange={e => setBirthYear(e.target.value)}>
                      <option value="" style={{ background: '#0a0d14' }}>Año</option>
                      {YEARS.map(y => <option key={y} value={y} style={{ background: '#0a0d14' }}>{y}</option>)}
                    </select>
                  </div>
                  {msg && <div className={`rp-msg ${msgType}`}>{msg}</div>}
                  <div className="rp-btn-row">
                    <button type="button" className="rp-btn-next" onClick={nextStep}>Continuar <ChevronRight size={15} /></button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div className="rp-section-title">Correo electrónico</div>
                  <div className="rp-field">
                    <input type="email" className="rp-input" placeholder="tu@correo.com"
                      value={email} onChange={e => setEmail(e.target.value)} />
                    <Mail size={14} className="rp-field-icon" />
                  </div>
                  <div className="rp-section-title" style={{ marginTop: 16 }}>País y teléfono</div>
                  <div className="rp-field-row cols-2">
                    <div className="rp-field" style={{ margin: 0 }}>
                      <select className="rp-select" value={COUNTRIES.indexOf(selectedCountry)}
                        onChange={e => { setSelectedCountry(COUNTRIES[parseInt(e.target.value)]); setPhone(''); setPhoneStatus('idle'); }}>
                        {COUNTRIES.map((c, i) => (
                          <option key={i} value={i} style={{ background: '#0a0d14' }}>{c.flag} {c.code} {c.name}</option>
                        ))}
                      </select>
                      <Globe size={14} className="rp-field-icon" />
                    </div>
                    <div className="rp-field" style={{ margin: 0 }}>
                      <input type="tel"
                        className={`rp-input ${phoneStatus === 'taken' ? 'rp-input-error' : phoneStatus === 'ok' ? 'rp-input-ok' : ''}`}
                        placeholder={`${selectedCountry.maxDigits} dígitos`} value={phone}
                        onChange={e => { handlePhoneChange(e.target.value); setPhoneStatus('idle'); }}
                        onBlur={e => checkPhone(e.target.value)} />
                      <Phone size={14} className="rp-field-icon" />
                      {phoneStatus === 'checking' && <div className="rp-field-status"><Activity size={12} className="animate-spin" style={{ color: '#8dc63f' }} /></div>}
                      {phoneStatus === 'ok'       && <div className="rp-field-status"><Check size={12} style={{ color: '#8dc63f' }} /></div>}
                      {phoneStatus === 'taken'    && <div className="rp-field-status"><AlertCircle size={12} style={{ color: '#ef4444' }} /></div>}
                    </div>
                  </div>
                  {phoneStatus === 'taken' && <p className="rp-field-hint error">Este teléfono ya está registrado</p>}

                  <div className="rp-section-title" style={{ marginTop: 16 }}>Código de referido (opcional)</div>
                  <div className="rp-field">
                    <input
                      className={`rp-input ${referral ? 'rp-input-ok' : ''}`}
                      placeholder="Código de invitación — ej: LK-AB1234"
                      value={referral}
                      onChange={e => setReferral(e.target.value.toUpperCase().trim())} />
                    <Gift size={14} className="rp-field-icon" />
                    {referral && <div className="rp-field-status"><Check size={12} style={{ color: '#8dc63f' }} /></div>}
                  </div>
                  {referral && <p className="rp-field-hint ok">Código de referido aplicado ✓</p>}

                  {msg && <div className={`rp-msg ${msgType}`}>{msg}</div>}
                  <div className="rp-btn-row">
                    <button type="button" className="rp-btn-back" onClick={prevStep}><ChevronLeft size={14} /> Volver</button>
                    <button type="button" className="rp-btn-next" onClick={nextStep}>Continuar <ChevronRight size={15} /></button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div className="rp-section-title">Crea tu contraseña</div>
                  <div className="rp-field">
                    <input type={showPw ? 'text' : 'password'} className="rp-input"
                      placeholder="Contraseña (mín. 6 caracteres)" value={password}
                      onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                    <Lock size={14} className="rp-field-icon" />
                    <TrackingEye show={showPw} onClick={() => setShowPw(!showPw)} mousePos={mousePos} />
                  </div>
                  <div className="rp-field">
                    <input type={showCPw ? 'text' : 'password'} className="rp-input"
                      placeholder="Confirmar contraseña" value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)} autoComplete="new-password" />
                    <ShieldAlert size={14} className="rp-field-icon" />
                    <TrackingEye show={showCPw} onClick={() => setShowCPw(!showCPw)} mousePos={mousePos} />
                  </div>
                  <div className="rp-checks">
                    <div className="rp-check" onClick={() => setAcceptAge(!acceptAge)}>
                      <div className={`rp-check-box ${acceptAge ? 'checked' : ''}`}>
                        {acceptAge && <Check size={11} color="#0a0d14" strokeWidth={3} />}
                      </div>
                      <span className="rp-check-label">Declaro que soy <span>mayor de 18 años</span></span>
                    </div>
                    <div className="rp-check" onClick={() => setAcceptData(!acceptData)}>
                      <div className={`rp-check-box ${acceptData ? 'checked' : ''}`}>
                        {acceptData && <Check size={11} color="#0a0d14" strokeWidth={3} />}
                      </div>
                      <span className="rp-check-label">Acepto los <span>términos y condiciones</span> y el tratamiento de datos</span>
                    </div>
                  </div>
                  {msg && <div className={`rp-msg ${msgType}`}>{msg}</div>}
                  <div className="rp-btn-row">
                    <button type="button" className="rp-btn-back" onClick={prevStep} disabled={isLoading}><ChevronLeft size={14} /> Volver</button>
                    <button type="submit" className="rp-btn-submit" disabled={isLoading || blocked}>
                      {isLoading ? <Activity className="animate-spin" size={16} /> : <><Check size={15} /> Crear cuenta</>}
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </form>

          <div className="rp-login-link">
            ¿Ya tienes cuenta?
            <button type="button" onClick={() => router.push('/login')}>Iniciar sesión</button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════
   WRAPPER — lee searchParams y pasa como prop
   ══════════════════════════════════════ */
function RegisterPortalWrapper() {
  const searchParams = useSearchParams();
  const refCode = (searchParams.get('ref') || '').toUpperCase().trim();
  return <RegisterPortalInner initialRef={refCode} />;
}

/* ══════════════════════════════════════
   EXPORT DEFAULT
   ══════════════════════════════════════ */
export default function RegisterPortal() {
  return (
    <Suspense fallback={null}>
      <RegisterPortalWrapper />
    </Suspense>
  );
}

function BASE_STYLES(mousePos: { x: number; y: number }, bg: string) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap');
    .rp-root{min-height:100vh;width:100vw;display:flex;align-items:center;justify-content:center;background:#0a0d14;font-family:'Roboto',sans-serif;padding:24px 16px;position:relative;overflow-x:hidden;overflow-y:auto}
    .rp-bg{position:fixed;inset:0;z-index:0;background:url('${bg}') center center/cover no-repeat;filter:brightness(0.22) saturate(0.7)}
    .rp-bg-vignette{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(circle 500px at ${mousePos.x}px ${mousePos.y}px,rgba(141,198,63,0.04) 0%,rgba(0,0,0,0.6) 100%)}
    .rp-grid{position:fixed;inset:0;z-index:1;pointer-events:none;background:linear-gradient(rgba(141,198,63,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(141,198,63,0.025) 1px,transparent 1px);background-size:48px 48px}
    .rp-card-wrap{position:relative;z-index:10;width:100%;max-width:480px;border-radius:10px;padding:2px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.85)}
    .rp-card-wrap::before,.rp-card-wrap::after{content:'';position:absolute;top:-60%;left:-60%;width:220%;height:220%;background:conic-gradient(transparent 0deg,transparent 200deg,#8dc63f 240deg,rgba(255,255,255,0.6) 270deg,#8dc63f 300deg,transparent 360deg);animation:rp-snake 5s linear infinite;z-index:0}
    .rp-card-wrap::after{filter:blur(14px);opacity:0.5}
    @keyframes rp-snake{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .rp-form-inner{position:relative;z-index:1;background:rgba(8,11,20,0.98);border-radius:8px;padding:32px 28px 28px}
    .rp-close{position:absolute;top:14px;right:14px;background:transparent;border:none;color:rgba(255,255,255,0.2);cursor:pointer;padding:4px;border-radius:4px;transition:all 0.2s;display:flex;align-items:center;justify-content:center}
    .rp-close:hover{color:#8dc63f;transform:rotate(90deg)}
    .rp-header{text-align:center;margin-bottom:24px}
    .rp-logo{height:38px;width:auto;margin:0 auto 10px;display:block;filter:drop-shadow(0 0 16px rgba(141,198,63,0.3))}
    .rp-subtitle{font-family:'Oswald',sans-serif;font-size:10px;font-weight:600;letter-spacing:3px;color:#8dc63f;text-transform:uppercase}
    .rp-steps{display:flex;align-items:center;margin-bottom:24px}
    .rp-step-item{display:flex;flex-direction:column;align-items:center;gap:5px;flex:1}
    .rp-step-circle{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;border:1.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.3);transition:all 0.3s;position:relative;z-index:2}
    .rp-step-circle.active{border-color:#8dc63f;background:rgba(141,198,63,0.12);color:#8dc63f;box-shadow:0 0 12px rgba(141,198,63,0.25)}
    .rp-step-circle.done{border-color:#8dc63f;background:#8dc63f;color:#0a0d14}
    .rp-step-label{font-size:9px;font-weight:600;letter-spacing:0.5px;color:rgba(255,255,255,0.2);text-transform:uppercase;text-align:center}
    .rp-step-label.active{color:#8dc63f}
    .rp-step-connector{flex:1;height:1px;background:rgba(255,255,255,0.08);margin-bottom:18px}
    .rp-step-connector.done{background:#8dc63f}
    .rp-section-title{font-family:'Oswald',sans-serif;font-size:10px;font-weight:600;color:rgba(255,255,255,0.3);letter-spacing:2px;text-transform:uppercase;margin:0 0 14px;display:flex;align-items:center;gap:8px}
    .rp-section-title::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(141,198,63,0.2),transparent)}
    .rp-field{position:relative;margin-bottom:10px}
    .rp-field-row{display:grid;gap:10px;margin-bottom:10px}
    .rp-field-row.cols-3{grid-template-columns:1fr 1fr 1fr}
    .rp-field-row.cols-2{grid-template-columns:140px 1fr}
    .rp-input,.rp-select{width:100%;background:rgba(255,255,255,0.04)!important;color:#fff!important;border:1px solid rgba(255,255,255,0.08)!important;padding:12px 14px 12px 40px;border-radius:6px;font-size:12px;outline:none;transition:border-color 0.2s,box-shadow 0.2s;font-family:'Roboto',sans-serif;-webkit-appearance:none}
    .rp-select-flat{width:100%;background:rgba(255,255,255,0.04)!important;color:#fff!important;border:1px solid rgba(255,255,255,0.08)!important;padding:12px 10px;border-radius:6px;font-size:12px;outline:none;transition:border-color 0.2s;font-family:'Roboto',sans-serif;cursor:pointer;text-align:center;-webkit-appearance:none}
    .rp-input:focus,.rp-select:focus,.rp-select-flat:focus{border-color:#8dc63f!important;box-shadow:0 0 0 3px rgba(141,198,63,0.1)!important}
    .rp-input-ok{border-color:#8dc63f!important}
    .rp-input-error{border-color:#ef4444!important}
    .rp-input:-webkit-autofill{-webkit-text-fill-color:#fff!important;-webkit-box-shadow:0 0 0 1000px rgba(8,11,20,0.98) inset!important}
    .rp-input::placeholder{color:rgba(255,255,255,0.22);font-size:11px}
    .rp-field-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.2);pointer-events:none;transition:color 0.2s;z-index:2}
    .rp-field:focus-within .rp-field-icon{color:#8dc63f}
    .rp-field-status{position:absolute;right:12px;top:50%;transform:translateY(-50%);z-index:3;display:flex;align-items:center}
    .rp-field-hint{font-size:10px;margin:-6px 0 8px 2px;font-weight:600}
    .rp-field-hint.ok{color:#8dc63f}
    .rp-field-hint.error{color:#ef4444}
    .rp-eye-btn{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:rgba(255,255,255,0.2);cursor:pointer;z-index:3;padding:2px;transition:color 0.15s}
    .rp-eye-btn:hover{color:#8dc63f}
    .rp-checks{display:flex;flex-direction:column;gap:10px;margin:18px 0 16px}
    .rp-check{display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none}
    .rp-check-box{width:18px;height:18px;border-radius:4px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s}
    .rp-check:hover .rp-check-box{border-color:#8dc63f}
    .rp-check-box.checked{background:#8dc63f;border-color:#8dc63f}
    .rp-check-label{font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:0.3px}
    .rp-check-label span{color:#8dc63f}
    .rp-msg{padding:10px 14px;border-radius:5px;margin-bottom:14px;font-size:11px;font-weight:600;letter-spacing:0.3px;border-left:3px solid #ef4444;background:rgba(239,68,68,0.08);color:#ef4444}
    .rp-msg.success{border-left-color:#8dc63f;background:rgba(141,198,63,0.08);color:#8dc63f}
    .rp-btn-row{display:flex;gap:10px}
    .rp-btn-back{padding:13px 18px;border-radius:6px;background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);font-family:'Oswald',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:5px;flex-shrink:0}
    .rp-btn-back:hover{border-color:#8dc63f;color:#8dc63f}
    .rp-btn-next,.rp-btn-submit{flex:1;padding:13px;background:#8dc63f;border:none;color:#0a0d14;border-radius:6px;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 16px rgba(141,198,63,0.25)}
    .rp-btn-next:hover,.rp-btn-submit:hover{background:#7ab52f}
    .rp-btn-next:disabled,.rp-btn-submit:disabled{opacity:0.5;cursor:not-allowed}
    .rp-login-link{text-align:center;margin-top:16px;font-size:11px;color:rgba(255,255,255,0.25)}
    .rp-login-link button{background:none;border:none;color:#8dc63f;font-size:11px;font-weight:700;cursor:pointer;transition:color 0.15s;padding:0;margin-left:4px}
    .rp-login-link button:hover{color:#fff}
    .rp-success-icon{width:72px;height:72px;border-radius:50%;background:rgba(141,198,63,0.1);border:1px solid rgba(141,198,63,0.25);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;animation:rp-pulse-icon 2s ease-in-out infinite}
    @keyframes rp-pulse-icon{0%,100%{box-shadow:0 0 0 0 rgba(141,198,63,0.2)}50%{box-shadow:0 0 0 12px rgba(141,198,63,0)}}
    .rp-success-title{font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;color:#fff;text-transform:uppercase;margin-bottom:10px}
    .rp-success-desc{font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:6px}
    .rp-success-email{font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;color:#8dc63f;margin-bottom:16px;word-break:break-all}
    .rp-success-note{font-size:12px;color:rgba(255,255,255,0.35);line-height:1.6;margin-bottom:20px}
    .rp-success-note strong{color:rgba(255,255,255,0.6)}
    .rp-success-steps{display:flex;flex-direction:column;gap:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:14px 16px;margin-bottom:16px;text-align:left}
    .rp-success-step{display:flex;align-items:center;gap:10px;font-size:12px;color:rgba(255,255,255,0.4)}
    .rp-success-step-num{width:20px;height:20px;border-radius:50%;background:#8dc63f;color:#0a0d14;font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .rp-success-spam{font-size:10px;color:rgba(255,255,255,0.2);margin-bottom:20px}
    .rp-btn-home{width:100%;padding:13px;background:#8dc63f;border:none;color:#0a0d14;border-radius:6px;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:background 0.15s}
    .rp-btn-home:hover{background:#7ab52f}
    @media(max-width:520px){.rp-form-inner{padding:24px 18px 22px}.rp-field-row.cols-2{grid-template-columns:1fr}.rp-field-row.cols-3{gap:6px}.rp-select-flat{font-size:11px;padding:11px 6px}.rp-step-label{font-size:8px}}
    @media(max-width:360px){.rp-step-circle{width:24px;height:24px;font-size:10px}}
  `;
}
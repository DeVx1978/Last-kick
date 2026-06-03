"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, User, Mail, Calendar, Shield, Activity,
  Skull, Wallet, MapPin, Fingerprint, Database, Terminal, 
  Star, Phone, Camera, Save, RefreshCw, ShieldCheck, 
  Heart, Globe, Info, Zap, Edit3, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function PerfilJugador() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    full_name: '', username: '', email: '', phone: '', country: '', avatar_url: ''
  });

  const [userStats, setUserStats] = useState({
    ganadas: 0, perdidas: 0, total: 0, pitchx: 0, lives: 0, status: 'VIVO'
  });

  useEffect(() => {
    async function fetchPerfilData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: perfil } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: pred } = await supabase.from('predictions').select('is_correct').eq('user_id', user.id);

      let g = pred?.filter(p => p.is_correct === true).length || 0;
      let p = pred?.filter(p => p.is_correct === false).length || 0;

      const pData = {
        id: user.id,
        email: user.email || "",
        created_at: user.created_at,
        full_name: perfil?.full_name || 'JUGADOR NO IDENTIFICADO',
        username: perfil?.username || 'SIN_ALIAS',
        country: perfil?.country || 'ZONA NO IDENTIFICADA',
        phone: perfil?.phone || 'NO REGISTRADO',
        player_code: perfil?.player_code || 'CQ-000000',
        avatar_url: perfil?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
      };

      setUserData(pData);
      setFormData({ ...pData });
      setUserStats({
        ganadas: g, perdidas: p, total: g + p,
        pitchx: perfil?.pitchx_balance ?? 0,
        lives: perfil?.lives ?? 0,
        status: perfil?.status || 'VIVO',
      });
      setLoading(false);
    }
    fetchPerfilData();
  }, [router]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase.from('profiles').update({ 
        full_name: formData.full_name,
        country: formData.country,
        phone: formData.phone,
        username: formData.username
      }).eq('id', userData.id);
      
      if (error) throw error;
      setUserData({ ...userData, ...formData });
      setIsEditing(false);
      alert("PERFIL ACTUALIZADO CORRECTAMENTE");
    } catch (e: any) {
      alert("ERROR: " + e.message);
    } finally { setUpdating(false); }
  };

  const winRate = userStats.total > 0 ? Math.round((userStats.ganadas / userStats.total) * 100) : 0;
  const statusColor = userStats.status === 'ELIMINADO' ? '#FF0033' : userStats.status === 'EN COMA' ? '#FFAA00' : '#00FF87';

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-[#00D4FF] font-mono tracking-[10px]">CONECTANDO_BÓVEDA...</div>;

  return (
    <div className="profile-root">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Barlow+Condensed:wght@300;400;600;800&family=Share+Tech+Mono&display=swap');

        :root {
          --cyan: #00D4FF;
          --cyan2: #00B8FF;
          --green: #00FF87;
          --red: #FF0033;
          --gold: #FFD700;
          --bg: #020508;
          --card: rgba(0,8,20,0.92);
          --border: rgba(0,212,255,0.25);
          --border2: rgba(0,212,255,0.12);
          --status: ${statusColor};
        }

        * { box-sizing: border-box; }

        .profile-root {
          background: var(--bg);
          min-height: 100vh;
          color: #fff;
          font-family: 'Share Tech Mono', monospace;
          position: relative;
          overflow-x: hidden;
          padding-bottom: 60px;
        }

        /* ── FONDO ── */
        .ambient-bg {
  position: fixed; inset: 0; z-index: 0;
  background-image: url('/img/embato1.jpg');
  background-size: cover; background-position: center;
  filter: brightness(0.35);
}
        .ambient-overlay {
  position: fixed; inset: 0; z-index: 1;
  background: linear-gradient(180deg, rgba(0,8,20,0.3) 0%, rgba(0,8,20,0.1) 50%, rgba(0,8,20,0.4) 100%);
}

        /* ── SCANLINES ── */
        .profile-root::before {
          content: '';
          position: fixed; inset: 0; z-index: 2; pointer-events: none;
          background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,180,255,0.015) 3px, rgba(0,180,255,0.015) 4px);
        }

        /* ── TICKER SUPERIOR ── */
        .hud-ticker {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          height: 24px;
          background: rgba(0,180,255,0.08);
          border-bottom: 1px solid rgba(0,212,255,0.3);
          display: flex; align-items: center;
          overflow: hidden;
          font-family: 'Orbitron', monospace;
          font-size: 7px; letter-spacing: 2px;
          color: rgba(0,212,255,0.5);
        }
        .hud-ticker-inner {
          display: flex; gap: 60px; white-space: nowrap;
          animation: ticker-move 25s linear infinite;
        }
        @keyframes ticker-move {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* ── NAV HUD ── */
        .top-nav {
          position: sticky; top: 24px; z-index: 100;
          padding: 0 40px;
          height: 56px;
          background: rgba(0,8,20,0.97);
          backdrop-filter: blur(30px);
          border-bottom: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center;
          box-shadow: 0 0 40px rgba(0,180,255,0.08), inset 0 -1px 0 rgba(0,212,255,0.2);
        }
        .top-nav::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, var(--cyan), var(--cyan2), transparent);
          animation: nav-sweep 4s ease-in-out infinite;
        }
        @keyframes nav-sweep {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .btn-radar {
          background: none; border: 1px solid rgba(0,212,255,0.25);
          color: var(--cyan); cursor: pointer;
          font-family: 'Orbitron', monospace; font-size: 8px; letter-spacing: 2px;
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          transition: 0.25s;
          clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
        }
        .btn-radar:hover {
          background: rgba(0,212,255,0.1);
          border-color: var(--cyan);
          box-shadow: 0 0 20px rgba(0,212,255,0.3);
          transform: translateX(-3px);
        }

        .nav-title {
          font-family: 'Orbitron', monospace;
          font-size: 12px; font-weight: 700; letter-spacing: 8px;
          color: rgba(255,255,255,0.9);
          text-shadow: 0 0 20px rgba(0,212,255,0.4);
          position: relative;
        }
        .nav-title::before, .nav-title::after {
          content: '//';
          color: rgba(0,212,255,0.4);
          font-size: 10px;
          margin: 0 12px;
        }

        .nav-sys {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Orbitron', monospace; font-size: 7px;
          color: rgba(0,212,255,0.35); letter-spacing: 2px;
        }
        .nav-sys-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 8px var(--green);
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

        /* ── LAYOUT ── */
        .main-layout {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 24px;
          max-width: 1300px;
          margin: 36px auto;
          padding: 0 32px;
          position: relative; z-index: 10;
        }

        /* ── DOSSIER CARD ── */
        .dossier-card {
          background: var(--card);
          border: 1px solid var(--border);
          position: relative;
          overflow: hidden;
          padding: 0;
          backdrop-filter: blur(40px);
          clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
        }
        .dossier-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--status), var(--cyan), var(--status));
          animation: nav-sweep 3s ease-in-out infinite;
        }
        .dossier-card::after {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
          background: var(--status);
          box-shadow: 0 0 20px var(--status);
        }

        /* DOSSIER HEADER */
        .dossier-header {
          background: rgba(0,180,255,0.04);
          border-bottom: 1px solid var(--border2);
          padding: 12px 20px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .dossier-file-tag {
          font-family: 'Orbitron', monospace; font-size: 7px;
          color: rgba(0,212,255,0.5); letter-spacing: 3px;
        }
        .dossier-rec {
          display: flex; align-items: center; gap: 6px;
          font-family: 'Orbitron', monospace; font-size: 7px;
          color: var(--red); letter-spacing: 2px;
        }
        .rec-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--red); box-shadow: 0 0 8px var(--red);
          animation: blink 1s ease-in-out infinite;
        }

        /* DOSSIER BODY */
        .dossier-body { padding: 28px 28px 24px; }

        /* AVATAR */
        .avatar-wrap {
          position: relative;
          width: 120px; height: 120px;
          margin: 0 auto 24px;
        }
        .avatar-frame {
          width: 100%; height: 100%;
          overflow: hidden;
          border: 2px solid var(--cyan);
          box-shadow: 0 0 30px rgba(0,212,255,0.3), inset 0 0 20px rgba(0,0,0,0.5);
          clip-path: polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px);
        }
        .avatar-frame img {
          width: 100%; height: 100%; object-fit: cover;
          filter: saturate(0.8) brightness(0.9);
        }
        /* HUD corners */
        .avatar-wrap::before, .avatar-wrap::after,
        .av-corner-bl, .av-corner-br {
          content: ''; position: absolute;
          width: 16px; height: 16px;
        }
        .avatar-wrap::before { top: -4px; left: -4px; border-top: 2px solid var(--cyan); border-left: 2px solid var(--cyan); }
        .avatar-wrap::after { top: -4px; right: -4px; border-top: 2px solid var(--cyan); border-right: 2px solid var(--cyan); }
        .av-corner-bl { bottom: -4px; left: -4px; border-bottom: 2px solid var(--cyan); border-left: 2px solid var(--cyan); }
        .av-corner-br { bottom: -4px; right: -4px; border-bottom: 2px solid var(--cyan); border-right: 2px solid var(--cyan); }

        .cam-btn {
          position: absolute; bottom: -8px; right: -8px;
          background: var(--cyan); color: #000;
          padding: 7px; border: none; cursor: pointer;
          box-shadow: 0 0 20px rgba(0,212,255,0.6);
          transition: 0.25s;
          clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%);
        }
        .cam-btn:hover { background: #fff; transform: scale(1.1); }

        /* PLAYER ID */
        .player-id-block {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border2);
        }
        .p-code-display {
          font-family: 'Orbitron', monospace;
          font-size: 22px; font-weight: 900;
          color: var(--cyan);
          letter-spacing: 2px;
          text-shadow: 0 0 20px rgba(0,212,255,0.6);
          margin-bottom: 8px;
        }
        .status-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(0,0,0,0.6);
          border: 1px solid var(--status);
          color: var(--status);
          font-family: 'Orbitron', monospace;
          font-size: 7px; font-weight: 700;
          padding: 5px 16px; letter-spacing: 3px;
          box-shadow: 0 0 15px rgba(0,255,135,0.2);
          clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
        }

        /* FIELDS */
        .field-box { margin-bottom: 16px; }
        .field-label {
          font-family: 'Orbitron', monospace;
          font-size: 6px; color: rgba(0,212,255,0.45);
          letter-spacing: 3px; display: flex; align-items: center; gap: 6px;
          margin-bottom: 7px; text-transform: uppercase;
        }
        .field-label::before {
          content: '›';
          color: var(--cyan); font-size: 10px;
        }
        .field-value {
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px; color: rgba(255,255,255,0.85);
          display: block; min-height: 28px;
          padding: 6px 10px;
          background: rgba(0,180,255,0.04);
          border-left: 2px solid rgba(0,212,255,0.2);
          letter-spacing: 0.5px;
          transition: 0.2s;
        }
        .field-input {
          width: 100%;
          background: rgba(0,212,255,0.06) !important;
          color: var(--cyan) !important;
          border: 1px solid rgba(0,212,255,0.4) !important;
          border-left: 3px solid var(--cyan) !important;
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px; padding: 8px 12px;
          outline: none; transition: 0.3s;
          letter-spacing: 0.5px;
        }
        .field-input:focus {
          background: rgba(0,212,255,0.1) !important;
          box-shadow: 0 0 20px rgba(0,212,255,0.15);
        }

        /* META ROW */
        .meta-row {
          display: flex; justify-content: space-between;
          margin-top: 20px; padding-top: 16px;
          border-top: 1px solid var(--border2);
        }
        .meta-item .field-label { margin-bottom: 4px; }
        .meta-val {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px; color: rgba(255,255,255,0.3);
        }

        /* BARCODE */
        .barcode-hd {
          height: 40px; width: 100%; margin-top: 20px;
          opacity: 0.2;
          background: repeating-linear-gradient(
            90deg,
            var(--cyan), var(--cyan) 1px,
            transparent 1px, transparent 3px,
            var(--cyan) 3px, var(--cyan) 5px,
            transparent 5px, transparent 9px,
            var(--cyan) 9px, var(--cyan) 10px,
            transparent 10px, transparent 14px
          );
        }

        /* ── STATS COLUMN ── */
        .stats-column { display: flex; flex-direction: column; gap: 16px; }

        /* TOP ROW */
        .stats-top-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .big-card {
          background: var(--card);
          border: 1px solid var(--border2);
          padding: 28px 24px;
          position: relative; overflow: hidden;
          backdrop-filter: blur(20px);
          clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%);
        }
        .big-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
        }
        .big-card.red::before {
          background: linear-gradient(90deg, var(--red), transparent);
        }
        .big-card::after {
          content: '';
          position: absolute; top: 0; right: 0;
          border-style: solid;
          border-width: 0 16px 16px 0;
          border-color: transparent rgba(0,212,255,0.2) transparent transparent;
        }

        .bc-lbl {
          font-family: 'Orbitron', monospace;
          font-size: 7px; color: rgba(255,255,255,0.35);
          letter-spacing: 3px;
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 16px;
        }
        .bc-val {
          font-family: 'Orbitron', monospace;
          font-size: 32px; font-weight: 900;
          line-height: 1;
        }
        .bc-sub {
          font-size: 10px; opacity: 0.4; font-weight: 400; margin-left: 6px;
        }

        /* GRID 4 */
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

        .mini-stat {
          background: var(--card);
          border: 1px solid var(--border2);
          padding: 24px 12px;
          text-align: center;
          position: relative; overflow: hidden;
          transition: 0.3s;
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
        }
        .mini-stat::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--cyan), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .mini-stat:hover { border-color: rgba(0,212,255,0.3); background: rgba(0,180,255,0.05); }
        .mini-stat:hover::before { opacity: 1; }

        .ms-val {
          font-family: 'Orbitron', monospace;
          font-size: 22px; font-weight: 900;
          margin: 10px 0 6px; line-height: 1;
        }
        .ms-lbl {
          font-family: 'Orbitron', monospace;
          font-size: 6px; color: rgba(255,255,255,0.3);
          letter-spacing: 2px;
        }

        /* ACTION ZONE */
        .action-zone {
          background: var(--card);
          border: 1px solid var(--border2);
          padding: 28px;
          position: relative; overflow: hidden;
          clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
        }
        .action-zone::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, var(--cyan), transparent);
          animation: nav-sweep 4s ease-in-out infinite;
        }

        .az-header {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border2);
        }
        .az-title {
          font-family: 'Orbitron', monospace;
          font-size: 8px; letter-spacing: 3px;
          color: rgba(0,212,255,0.6);
        }
        .az-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, rgba(0,212,255,0.3), transparent);
        }

        /* BUTTONS */
        .btn-edit {
          background: rgba(0,212,255,0.05);
          color: var(--cyan);
          font-family: 'Orbitron', monospace; font-weight: 700; font-size: 9px;
          padding: 18px 24px;
          border: 1px solid rgba(0,212,255,0.3);
          cursor: pointer; letter-spacing: 3px;
          transition: 0.3s;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          width: 100%;
          clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
        }
        .btn-edit:hover {
          background: var(--cyan); color: #000;
          box-shadow: 0 0 30px rgba(0,212,255,0.4);
        }

        .btn-save {
          background: var(--green); color: #000;
          font-family: 'Orbitron', monospace; font-weight: 900; font-size: 9px;
          padding: 20px 24px; border: none; cursor: pointer;
          letter-spacing: 3px; transition: 0.3s;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          width: 100%;
          clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
          box-shadow: 0 0 20px rgba(0,255,135,0.3);
        }
        .btn-save:hover {
          background: #fff;
          box-shadow: 0 0 40px rgba(0,255,135,0.5);
        }

        .btn-cancel {
          background: none; color: rgba(255,0,51,0.6);
          font-family: 'Orbitron', monospace; font-weight: 700; font-size: 8px;
          padding: 14px; border: 1px solid rgba(255,0,51,0.2);
          cursor: pointer; letter-spacing: 2px; transition: 0.3s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%;
        }
        .btn-cancel:hover {
          background: var(--red); color: #fff;
          border-color: var(--red);
          box-shadow: 0 0 25px rgba(255,0,51,0.4);
        }

        .az-footer {
          margin-top: 16px;
          font-family: 'Orbitron', monospace;
          font-size: 7px; color: rgba(255,255,255,0.15);
          text-align: center; letter-spacing: 3px;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1050px) {
          .main-layout { grid-template-columns: 1fr; padding: 0 20px; margin: 20px auto; }
          .grid-4 { grid-template-columns: 1fr 1fr; }
          .stats-top-row { grid-template-columns: 1fr; }
          .hud-ticker { display: none; }
          .top-nav { top: 0; padding: 0 20px; }
          .nav-title { font-size: 9px; letter-spacing: 4px; }
          .nav-sys { display: none; }
        }

        @media (max-width: 600px) {
          .grid-4 { grid-template-columns: 1fr 1fr; gap: 8px; }
          .stats-top-row { grid-template-columns: 1fr; }
          .dossier-body { padding: 20px; }
          .main-layout { gap: 16px; }
          .top-nav { height: 48px; }
          .bc-val { font-size: 26px; }
        }
          .main-layout { padding: 0 12px; margin: 14px auto; gap: 12px; }
  
  .dossier-body { padding: 16px; }
  
  .avatar-wrap { width: 80px; height: 80px; margin-bottom: 14px; }
  
  .p-code-display { font-size: 16px; }
  
  .big-card { padding: 16px 14px; }
  .bc-val { font-size: 20px; }
  .bc-lbl { font-size: 6px; margin-bottom: 8px; }
  
  .mini-stat { padding: 14px 8px; }
  .ms-val { font-size: 16px; margin: 6px 0 4px; }
  .ms-lbl { font-size: 5px; letter-spacing: 1px; }
  
  .action-zone { padding: 16px; }
  .az-title { font-size: 7px; letter-spacing: 1px; }
  
  .btn-edit { padding: 14px; font-size: 8px; letter-spacing: 1px; }
  .btn-save { padding: 14px; font-size: 8px; letter-spacing: 1px; }
  .btn-cancel { padding: 10px; font-size: 7px; }
  
  .field-label { font-size: 6px; letter-spacing: 2px; }
  .field-value { font-size: 11px; padding: 5px 8px; }
  .field-input { font-size: 11px; padding: 7px 10px; }
  
  .top-nav { height: 44px; padding: 0 14px; }
  .nav-title { font-size: 8px; letter-spacing: 2px; }
  .nav-title::before, .nav-title::after { margin: 0 6px; font-size: 8px; }
  .btn-radar { padding: 6px 10px; font-size: 7px; }
      `}} />

      <div className="ambient-bg" />
      <div className="ambient-overlay" />

      {/* TICKER */}
      <div className="hud-ticker">
        <div className="hud-ticker-inner">
          {Array(2).fill(null).map((_, ri) => (
            ['SYS // PROFILE_DATABASE_SYNC', 'AUTH // SECURE_ACCESS_GRANTED', 'REC // IDENTITY_ARCHIVING', 'NET // ENCRYPTION_ACTIVE', 'DB // PLAYER_RECORD_LOADED', 'SYS // LAST_KICK_2026', 'STATUS // STABLE'].map((t, i) => (
              <span key={`${ri}-${i}`} style={{marginRight:60}}>{t}</span>
            ))
          ))}
        </div>
      </div>

      {/* NAV */}
      <nav className="top-nav">
        <button onClick={() => router.push('/radar')} className="btn-radar">
          <ChevronLeft size={14}/> VOLVER AL MANDO
        </button>
        <div className="nav-title">PERFIL DE JUGADOR</div>
        <div className="nav-sys">
          <div className="nav-sys-dot"/>
          <Terminal size={12}/> DATABASE_SYNC_STABLE
        </div>
      </nav>

      <main className="main-layout">

        {/* COL 1: DOSSIER */}
        <motion.div initial={{opacity:0, x:-40}} animate={{opacity:1, x:0}} transition={{duration:0.5}} className="dossier-card">

          <div className="dossier-header">
            <span className="dossier-file-tag">FILE // PLAYER_RECORD</span>
            <div className="dossier-rec"><div className="rec-dot"/> REC</div>
          </div>

          <div className="dossier-body">
            <div className="avatar-wrap">
              <div className="avatar-frame"><img src={formData.avatar_url} alt="Jugador" /></div>
              <div className="av-corner-bl"/>
              <div className="av-corner-br"/>
              <button className="cam-btn"><Camera size={16}/></button>
            </div>

            <div className="player-id-block">
              <div className="p-code-display">{userData?.player_code}</div>
              <div className="status-badge">
                <div className="rec-dot" style={{background: statusColor, boxShadow: `0 0 8px ${statusColor}`}}/>
                {userStats.status}
              </div>
            </div>

            <div className="field-box">
              <span className="field-label">NOMBRES Y APELLIDOS</span>
              {isEditing
                ? <input className="field-input" value={formData.full_name} onChange={(e)=>setFormData({...formData, full_name: e.target.value})} placeholder="NOMBRE COMPLETO" />
                : <span className="field-value">{userData?.full_name}</span>
              }
            </div>

            <div className="field-box">
              <span className="field-label">ALIAS DE JUGADOR</span>
              {isEditing
                ? <input className="field-input" style={{color:'var(--cyan)'}} value={formData.username} onChange={(e)=>setFormData({...formData, username: e.target.value})} placeholder="@ALIAS" />
                : <span className="field-value" style={{color:'var(--cyan)', fontWeight:700}}>@{userData?.username}</span>
              }
            </div>

            <div className="field-box">
              <span className="field-label">CORREO ELECTRÓNICO (ID)</span>
              <span className="field-value" style={{opacity:0.4}}>{userData?.email}</span>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="field-box">
                <span className="field-label">PAÍS</span>
                {isEditing
                  ? <input className="field-input" value={formData.country} onChange={(e)=>setFormData({...formData, country: e.target.value})} />
                  : <span className="field-value">{userData?.country}</span>
                }
              </div>
              <div className="field-box">
                <span className="field-label">TELÉFONO</span>
                {isEditing
                  ? <input className="field-input" value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} />
                  : <span className="field-value">{userData?.phone}</span>
                }
              </div>
            </div>

            <div className="meta-row">
              <div className="meta-item">
                <span className="field-label">REGISTRO</span>
                <div className="meta-val">{new Date(userData?.created_at).toLocaleDateString()}</div>
              </div>
              <div className="meta-item" style={{textAlign:'right'}}>
                <span className="field-label">HASH UID</span>
                <div className="meta-val">{userData?.id.substring(0,12)}...</div>
              </div>
            </div>

            <div className="barcode-hd" />
          </div>
        </motion.div>

        {/* COL 2: STATS */}
        <div className="stats-column">

          <div className="stats-top-row">
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="big-card gold">
              <div className="bc-lbl">BÓVEDA PitchX <Wallet size={16} color="var(--gold)"/></div>
              <div className="bc-val" style={{color:'var(--gold)'}}>
                {userStats.pitchx.toLocaleString()} <span className="bc-sub">PX</span>
              </div>
            </motion.div>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.15}} className="big-card red">
              <div className="bc-lbl">RESERVAS DE VIDA <Heart size={16} fill="var(--red)" color="var(--red)"/></div>
              <div className="bc-val" style={{color:'var(--red)'}}>
                {userStats.lives} <span className="bc-sub">UNIDADES</span>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="grid-4">
            <div className="mini-stat">
              <Activity size={18} color="var(--green)"/>
              <div className="ms-val" style={{color:'var(--green)'}}>{winRate}%</div>
              <div className="ms-lbl">SUPERVIVENCIA</div>
            </div>
            <div className="mini-stat">
              <ShieldCheck size={18} color="var(--cyan)"/>
              <div className="ms-val" style={{color:'var(--cyan)'}}>{userStats.total}</div>
              <div className="ms-lbl">OPERACIONES</div>
            </div>
            <div className="mini-stat">
              <Star size={18} color="var(--gold)"/>
              <div className="ms-val" style={{color:'var(--gold)'}}>{userStats.ganadas}</div>
              <div className="ms-lbl">ACIERTOS</div>
            </div>
            <div className="mini-stat">
              <Skull size={18} color="var(--red)"/>
              <div className="ms-val" style={{color:'var(--red)'}}>{userStats.perdidas}</div>
              <div className="ms-lbl">FALLOS</div>
            </div>
          </motion.div>

          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.25}} className="action-zone">
            <div className="az-header">
              <Info size={14} color="var(--cyan)"/>
              <span className="az-title">GESTIÓN_DE_IDENTIDAD_2026</span>
              <div className="az-line"/>
            </div>

            {isEditing ? (
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                <button className="btn-save" onClick={handleUpdate} disabled={updating}>
                  {updating ? <RefreshCw size={16} style={{animation:'spin 1s linear infinite'}}/> : <><Save size={16}/> FIRMAR Y GUARDAR CAMBIOS</>}
                </button>
                <button className="btn-cancel" onClick={() => { setIsEditing(false); setFormData({...userData}); }}>
                  <X size={14}/> CANCELAR EDICIÓN
                </button>
              </div>
            ) : (
              <button className="btn-edit" onClick={() => setIsEditing(true)}>
                <Edit3 size={14}/> ACTUALIZAR DATOS DE PERFIL
              </button>
            )}

            <div className="az-footer">KICK LAST SECURE SYSTEMS © 2026</div>
          </motion.div>

        </div>
      </main>
    </div>
  );
  
}
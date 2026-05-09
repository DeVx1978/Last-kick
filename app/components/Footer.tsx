export default function Footer() {
  return (
  <footer className="lk-footer" style={{ 
        background: '#000', 
        borderTop: '1px solid rgba(0, 200, 83, 0.4)', 
        padding: '80px 5vw 40px', 
        position: 'relative', 
        zIndex: 10,
        userSelect: 'none' 
      }}>
        <div className="lk-footer-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div className="lk-footer-top" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '40px', 
            marginBottom: '60px' 
          }}>
            {/* BRANDING OFICIAL */}
            <div className="lk-footer-brand">
              <div className="lk-logo" style={{ fontFamily: 'Anton', fontSize: '38px', color: '#fff', marginBottom: '15px', letterSpacing: '1px' }}>
                LAST <span className="lk-logo-kick" style={{ color: '#00C853' }}>KICK</span>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', maxWidth: '300px' }}>
                El primer juego de supervivencia del Mundial 2026. Predice resultados. Gestiona tus vidas. Reclama la bóveda final.
              </p>
            </div>
            
            {/* COLUMNAS DE LINKS */}
            {[
              { title: 'El Juego', links: ['Cómo jugar', 'Sistema de vidas', 'El premio', 'Preguntas frecuentes'] },
              { title: 'Plataforma', links: ['Registrarse', 'Iniciar sesión', 'Mi perfil', 'Mis predicciones'] },
              { title: 'Legal', links: ['Términos', 'Privacidad', 'Reglas', 'Contacto'] }
            ].map((col) => (
              <div key={col.title}>
                <div className="lk-footer-col-title" style={{ fontFamily: 'Anton', fontSize: '16px', color: '#fff', marginBottom: '20px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {col.title}
                </div>
                <div className="lk-footer-links" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {col.links.map(link => (
                    <a key={link} href="#" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none', transition: '0.3s' }} 
                       onMouseEnter={(e) => e.currentTarget.style.color = '#00C853'}
                       onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 🏆 SECCIÓN DE LOGOS REALES: VECTORES DE ALTA PRECISIÓN */}
          <div style={{ 
            padding: '40px 0', 
            borderTop: '1px solid rgba(255,255,255,0.05)', 
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'center',
            marginBottom: '50px'
          }}>
            <div style={{ fontSize: '10px', color: '#444', fontFamily: 'var(--font-mono)', letterSpacing: '4px', marginBottom: '35px' }}>
              PROTOCOLOS COMPATIBLES CON
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'flex-end', 
              gap: '50px', 
              flexWrap: 'wrap',
              opacity: 0.5,
              filter: 'grayscale(100%) brightness(150%)' 
            }}>
              {/* FIFA World Cup Trophy Silhouette */}
              <div style={{ textAlign: 'center' }}>
                <svg width="32" height="45" viewBox="0 0 24 32" fill="currentColor"><path d="M12 0c-1.5 0-3 1.5-3 4s1.5 4 1.5 4-1.5 2-1.5 5c0 4 3 6 3 6s3-2 3-6c0-3-1.5-5-1.5-5s1.5-1.5 1.5-4-1.5-4-3-4zm0 22c-4 0-7 2-7 5v5h14v-5c0-3-3-5-7-5z"/></svg>
                <div style={{ fontFamily: 'Anton', fontSize: '9px', marginTop: '8px' }}>WORLD CUP</div>
              </div>
              {/* UEFA Starball (Champions League) */}
              <div style={{ textAlign: 'center' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 4.5h4.5l-3.5 3 1.5 4.5-4-3-4 3 1.5-4.5-3.5-3h4.5zm0 2a10 10 0 100 20 10 10 0 000-20z m0 18a8 8 0 110-16 8 8 0 010 16z"/></svg>
                <div style={{ fontFamily: 'Anton', fontSize: '9px', marginTop: '8px' }}>CHAMPIONS</div>
              </div>
              {/* Conmebol Libertadores Icon */}
              <div style={{ textAlign: 'center' }}>
                <svg width="35" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 6v10l8 6 8-6V6l-8-4zm0 17.5L6 15V8l6-3.5L18 8v7l-6 4.5z"/></svg>
                <div style={{ fontFamily: 'Anton', fontSize: '9px', marginTop: '8px' }}>LIBERTADORES</div>
              </div>
              {/* Premier League Lion Head Style */}
              <div style={{ textAlign: 'center' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 110 20 10 10 0 010-20zm0 2a8 8 0 00-2 15.7V12h4v7.7a8 8 0 00-2-15.7z"/></svg>
                <div style={{ fontFamily: 'Anton', fontSize: '9px', marginTop: '8px' }}>PREMIER</div>
              </div>
              {/* La Liga Emblem Style */}
              <div style={{ textAlign: 'center' }}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm-1-12h2v4h4v2h-6V8z"/></svg>
                <div style={{ fontFamily: 'Anton', fontSize: '9px', marginTop: '8px' }}>LA LIGA</div>
              </div>
            </div>
          </div>

          {/* 🔞 SECCIÓN DE RESPONSABILIDAD: ROJO NEÓN +18 */}
          <div className="lk-footer-bottom" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '40px' 
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '25px', 
              padding: '25px 45px', 
              borderRadius: '60px', 
              border: '1px solid rgba(255,0,51,0.25)',
              background: 'rgba(255,0,51,0.03)'
            }}>
              {/* Sello +18 Diseño Solicitado */}
              <div style={{ 
                width: '60px', 
                height: '60px', 
                border: '3px solid #FF0033', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontFamily: 'Anton',
                fontSize: '24px',
                color: '#FF0033',
                boxShadow: '0 0 25px rgba(255,0,51,0.4)',
                background: '#000'
              }}>+18</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', color: '#fff', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>JUEGO RESPONSABLE</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', maxWidth: '500px', fontFamily: 'var(--font-body)', lineHeight: '1.5' }}>
                  Participación exclusiva para mayores de edad. LAST KICK promueve la integridad operativa y el control total en cada fase del protocolo táctico.
                </div>
              </div>
            </div>

            {/* COPYRIGHT FINAL */}
            <div style={{ 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              fontSize: '11px',
              color: '#333',
              fontFamily: 'var(--font-mono)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: '30px'
            }}>
              <div>© 2026 LAST KICK · MUNDIAL 2026 · OPERACIÓN GLOBAL</div>
              <div className="lk-footer-hashtags" style={{ display: 'flex', gap: '20px' }}>
                {['#LastKick', '#Mundial2026', '#Supervivencia'].map(tag => (
                  <span key={tag} style={{ color: '#00C853', fontWeight: 'bold' }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>  
  );
}
import React from 'react';
import { useTelegram } from '../hooks/useTelegram';

interface NavbarProps {
  dueCount?: number;
  isConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ dueCount = 0, isConnected = true }) => {
  const { user } = useTelegram();

  const userInitial = user?.first_name?.charAt(0).toUpperCase() || 'S';
  const displayName = user?.first_name || 'Scholar';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '12px 16px',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        background: 'rgba(8, 12, 18, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              padding: '2px',
              boxShadow: '0 4px 16px rgba(56, 189, 248, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="/logo.svg"
              alt="RuScholar Logo"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '8px',
                objectFit: 'contain',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(90deg, #f0f6fc 0%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                }}
              >
                RuScholar TMA
              </h1>
              <span
                className="live-indicator"
                title={isConnected ? 'Connected to live Render cluster' : 'Offline / Standalone'}
                style={{
                  background: isConnected ? '#10b981' : '#f59e0b',
                }}
              />
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                letterSpacing: '0.01em',
              }}
            >
              Academic Translate &amp; SRS
            </span>
          </div>
        </div>

        {/* User profile & stats chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {dueCount > 0 && (
            <div
              className="badge badge-warning"
              style={{
                padding: '4px 8px',
                fontSize: '0.72rem',
                boxShadow: '0 2px 10px rgba(245, 158, 11, 0.2)',
              }}
            >
              <span>⚡</span>
              <span>{dueCount} Due</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px 4px 5px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
              }}
            >
              {userInitial}
            </div>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                fontFamily: 'var(--font-ui)',
                maxWidth: '90px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'var(--text-primary)',
              }}
            >
              {displayName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

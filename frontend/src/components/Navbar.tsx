import React from 'react';
import { useTelegram } from '../hooks/useTelegram';

interface NavbarProps {
  dueCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ dueCount = 0 }) => {
  const { user } = useTelegram();

  const userInitial = user?.first_name?.charAt(0).toUpperCase() || 'S';
  const displayName = user?.first_name || 'Student';

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(22, 27, 34, 0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img
          src="/logo.svg"
          alt="RuScholar Logo"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 4px 14px rgba(47, 129, 247, 0.4)',
          }}
        />
        <div>
          <h1
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            RuScholar TMA
          </h1>
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            Academic Translate & SRS
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {dueCount > 0 && (
          <span className="badge badge-warning" title="Cards due for review">
            ⚡ {dueCount} Due
          </span>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px 4px 6px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(240, 246, 252, 0.06)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#2f81f7',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {userInitial}
          </div>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              maxWidth: '90px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </span>
        </div>
      </div>
    </header>
  );
};

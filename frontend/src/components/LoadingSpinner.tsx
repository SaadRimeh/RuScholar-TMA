import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading academic deck...' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      gap: '16px'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        border: '3px solid rgba(47, 129, 247, 0.2)',
        borderTop: '3px solid var(--accent-color, #2f81f7)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{
        fontSize: '0.875rem',
        color: 'var(--text-secondary, #8b949e)',
        fontWeight: 500
      }}>
        {message}
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

import React from 'react';
import { useTelegram } from '../hooks/useTelegram';

interface ReviewCompleteProps {
  reviewedCount: number;
  onReturnToDashboard: () => void;
  onBrowseAll: () => void;
}

export const ReviewComplete: React.FC<ReviewCompleteProps> = ({
  reviewedCount,
  onReturnToDashboard,
  onBrowseAll,
}) => {
  const { triggerNotificationFeedback } = useTelegram();

  React.useEffect(() => {
    triggerNotificationFeedback('success');
  }, [triggerNotificationFeedback]);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '36px 24px',
        textAlign: 'center',
        maxWidth: '480px',
        margin: '20px auto',
        border: '1px solid rgba(46, 160, 67, 0.3)',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏆</div>
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '8px',
        }}
      >
        Session Completed!
      </h2>
      <p
        style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '24px',
        }}
      >
        Outstanding academic work! You reviewed <b>{reviewedCount} flashcard(s)</b>.
        Your retention intervals have been recalibrated using the SuperMemo SM-2 algorithm.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          type="button"
          onClick={onReturnToDashboard}
          style={{
            padding: '14px',
            background: 'var(--accent-gradient)',
            color: '#fff',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.95rem',
            boxShadow: '0 4px 16px rgba(47, 129, 247, 0.35)',
          }}
        >
          📊 Return to Dashboard
        </button>

        <button
          type="button"
          onClick={onBrowseAll}
          style={{
            padding: '12px',
            background: 'rgba(240, 246, 252, 0.08)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.9rem',
            border: '1px solid var(--border-subtle)',
          }}
        >
          📚 Browse Vocabulary Dictionary
        </button>
      </div>
    </div>
  );
};

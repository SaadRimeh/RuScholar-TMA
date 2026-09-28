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
        padding: '40px 24px',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '20px auto',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        background: 'linear-gradient(180deg, rgba(19, 26, 41, 0.95) 0%, rgba(13, 28, 20, 0.95) 100%)',
        boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.7), 0 0 30px rgba(16, 185, 129, 0.15)',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.4rem',
          margin: '0 auto 20px',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)',
        }}
      >
        🏆
      </div>

      <h2
        style={{
          fontSize: '1.6rem',
          fontWeight: 800,
          fontFamily: 'var(--font-heading)',
          color: '#ffffff',
          marginBottom: '8px',
          letterSpacing: '-0.02em',
        }}
      >
        SRS Review Completed!
      </h2>

      <p
        style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '28px',
          maxWidth: '380px',
          margin: '0 auto 28px',
        }}
      >
        Outstanding academic work! You mastered <b>{reviewedCount} term(s)</b>.
        Your retention intervals have been recalibrated using the scientific <b>SuperMemo SM-2</b> algorithm.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          type="button"
          className="btn-primary"
          onClick={onReturnToDashboard}
          style={{ width: '100%' }}
        >
          <span>📊 Return to Dashboard</span>
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={onBrowseAll}
          style={{ width: '100%', padding: '13px' }}
        >
          <span>📚 Browse Academic Dictionary</span>
        </button>
      </div>
    </div>
  );
};

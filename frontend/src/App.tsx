import React, { useEffect, useState } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { Navbar } from './components/Navbar';
import { LoadingSpinner } from './components/LoadingSpinner';
import { flashcardsApi } from './api/flashcards.api';
import type { DeckStats, IFlashcard } from './types/flashcard.types';

export const App: React.FC = () => {
  const { user, isAvailable, initData, triggerHaptic } = useTelegram();

  const [stats, setStats] = useState<DeckStats | null>(null);
  const [dueCards, setDueCards] = useState<IFlashcard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // 1. Verify Telegram initData authentication with backend
        await flashcardsApi.checkSession();
        setBackendConnected(true);
        setAuthError(null);

        // 2. Fetch live deck statistics and due flashcards
        const [deckStats, dueResult] = await Promise.all([
          flashcardsApi.getStats().catch(() => null),
          flashcardsApi.getDueFlashcards(10).catch(() => ({ cards: [], count: 0, totalDue: 0, timestamp: '' })),
        ]);

        if (deckStats) {
          setStats(deckStats);
        }
        if (dueResult) {
          setDueCards(dueResult.cards);
        }
      } catch (err) {
        console.error('[App] Failed to synchronize with backend:', err);
        setAuthError('Running in standalone development mode or backend session unverified.');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [initData]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar dueCount={stats?.dueToday || dueCards.length} />

      <main style={{ flex: 1, padding: '20px 16px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        {/* Telegram Security & Handshake Status */}
        <section
          className="glass-panel"
          style={{
            padding: '16px',
            marginBottom: '20px',
            borderLeft: backendConnected ? '4px solid var(--success-color)' : '4px solid var(--warning-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 700 }}>
              Telegram Mini App Authentication
            </span>
            <span className={backendConnected ? 'badge badge-success' : 'badge badge-warning'}>
              {backendConnected ? '● HMAC-SHA-256 Verified' : '○ Standalone / Dev'}
            </span>
          </div>

          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            <p>
              Student: <b>{user?.first_name} {user?.last_name || ''}</b> {user?.username ? `(@${user.username})` : ''}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Telegram ID: <code>{user?.id || 'Dev Mock'}</code> • TMA SDK: {isAvailable ? 'Native Client' : 'Browser Mode'}
            </p>
            {authError && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                ℹ️ {authError}
              </p>
            )}
          </div>
        </section>

        {loading ? (
          <LoadingSpinner message="Synchronizing with RuScholar server..." />
        ) : (
          <>
            {/* Deck Stats Grid */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                ACADEMIC RETENTION METRICS (SM-2)
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                }}
              >
                <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning-color)' }}>
                    {stats?.dueToday ?? dueCards.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Due for Review
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success-color)' }}>
                    {stats?.masteredCards ?? 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Mastered Terms
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--purple-color)' }}>
                    {stats?.learningCards ?? 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    In Learning
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-color)' }}>
                    {stats?.totalCards ?? dueCards.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Total Vocabulary
                  </div>
                </div>
              </div>
            </section>

            {/* Due Cards Preview */}
            <section style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  QUEUE FOR SPACED REPETITION
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  SM-2 Algorithm
                </span>
              </div>

              {dueCards.length === 0 ? (
                <div
                  className="glass-panel"
                  style={{
                    padding: '32px 20px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <p style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🎉</p>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    All caught up!
                  </p>
                  <p style={{ fontSize: '0.85rem' }}>
                    No cards due right now. Forward Russian academic messages to the bot to generate more cards.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {dueCards.slice(0, 4).map((card) => (
                    <div
                      key={card._id}
                      className="glass-panel"
                      style={{
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {card.originalTerm}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {card.translatedTerm}
                        </div>
                      </div>
                      <span className="badge badge-primary">
                        Interval: {card.interval}d
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Launch Action Callout */}
            <div style={{ marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => triggerHaptic('medium')}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(47, 129, 247, 0.4)',
                }}
              >
                <span>🧠 Review Due Cards</span>
                <span style={{ opacity: 0.85 }}>({dueCards.length})</span>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;

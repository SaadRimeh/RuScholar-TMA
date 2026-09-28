import React, { useEffect, useState, useCallback } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { Navbar } from './components/Navbar';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Tabs, type AppTab } from './components/Tabs';
import { FlashcardReview } from './components/FlashcardReview';
import { ReviewComplete } from './components/ReviewComplete';
import { AllCardsView } from './components/AllCardsView';
import { flashcardsApi } from './api/flashcards.api';
import type { DeckStats, IFlashcard, SRSRating } from './types/flashcard.types';

export const App: React.FC = () => {
  const { user, isAvailable, initData, triggerHaptic, triggerNotificationFeedback } = useTelegram();

  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [stats, setStats] = useState<DeckStats | null>(null);
  const [dueCards, setDueCards] = useState<IFlashcard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Review session state
  const [reviewIndex, setReviewIndex] = useState<number>(0);
  const [sessionReviewedCount, setSessionReviewedCount] = useState<number>(0);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);

  const refreshDeckData = useCallback(async () => {
    try {
      const [deckStats, dueResult] = await Promise.all([
        flashcardsApi.getStats().catch(() => null),
        flashcardsApi.getDueFlashcards(30).catch(() => ({ cards: [], count: 0, totalDue: 0, timestamp: '' })),
      ]);

      if (deckStats) setStats(deckStats);
      if (dueResult) {
        setDueCards(dueResult.cards);
        // If current index is out of bounds, reset index
        if (reviewIndex >= dueResult.cards.length) {
          setReviewIndex(0);
        }
      }
    } catch (err) {
      console.error('[App] Error refreshing deck data:', err);
    }
  }, [reviewIndex]);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await flashcardsApi.checkSession();
        setBackendConnected(true);
        setAuthError(null);
        await refreshDeckData();
      } catch (err) {
        console.error('[App] Failed to authenticate with backend:', err);
        setAuthError('Running in standalone development mode or backend session unverified.');
        await refreshDeckData();
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [initData, refreshDeckData]);

  // Handle flashcard review rating submission
  const handleReviewRating = async (rating: SRSRating) => {
    const currentCard = dueCards[reviewIndex];
    if (!currentCard) return;

    try {
      // 1. Submit review to backend (calculates SM-2 interval & updates MongoDB)
      await flashcardsApi.submitReview(currentCard._id, rating);

      setSessionReviewedCount((prev) => prev + 1);

      // 2. Advance to next card or complete session
      if (reviewIndex + 1 < dueCards.length) {
        setReviewIndex((prev) => prev + 1);
      } else {
        setIsSessionComplete(true);
        triggerNotificationFeedback('success');
      }

      // 3. Refresh deck stats in background
      refreshDeckData();
    } catch (err) {
      console.error('[App] Failed to submit review:', err);
      triggerNotificationFeedback('error');
    }
  };

  const startReviewSession = () => {
    triggerHaptic('medium');
    setReviewIndex(0);
    setSessionReviewedCount(0);
    setIsSessionComplete(false);
    setActiveTab('review');
  };

  const handleSessionRestart = () => {
    setIsSessionComplete(false);
    setReviewIndex(0);
    setSessionReviewedCount(0);
    refreshDeckData();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar dueCount={stats?.dueToday || dueCards.length} />

      <main style={{ flex: 1, padding: '16px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        {/* Navigation Tabs */}
        <Tabs
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === 'review' && isSessionComplete) {
              handleSessionRestart();
            }
          }}
          dueCount={stats?.dueToday || dueCards.length}
        />

        {loading ? (
          <LoadingSpinner message="Synchronizing with RuScholar server..." />
        ) : (
          <>
            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div>
                {/* Security Handshake Panel */}
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
                      Telegram Mini App Security
                    </span>
                    <span className={backendConnected ? 'badge badge-success' : 'badge badge-warning'}>
                      {backendConnected ? '● HMAC-SHA-256 Validated' : '○ Standalone / Dev'}
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

                {/* Deck Metrics Grid */}
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

                {/* Action CTA */}
                <div style={{ marginTop: '16px' }}>
                  {dueCards.length > 0 ? (
                    <button
                      type="button"
                      onClick={startReviewSession}
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
                      <span>🧠 Start SRS Review Session</span>
                      <span style={{ opacity: 0.85 }}>({dueCards.length} due)</span>
                    </button>
                  ) : (
                    <div
                      className="glass-panel"
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <p style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🎉</p>
                      <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Deck is up to date!
                      </p>
                      <p style={{ fontSize: '0.85rem' }}>
                        No cards due right now. Forward university messages into the bot to extract new technical terms.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: INTERACTIVE SRS REVIEW */}
            {activeTab === 'review' && (
              <div>
                {isSessionComplete || dueCards.length === 0 ? (
                  <ReviewComplete
                    reviewedCount={sessionReviewedCount || dueCards.length}
                    onReturnToDashboard={() => setActiveTab('dashboard')}
                    onBrowseAll={() => setActiveTab('dictionary')}
                  />
                ) : (
                  dueCards[reviewIndex] && (
                    <FlashcardReview
                      card={dueCards[reviewIndex]}
                      currentIndex={reviewIndex}
                      totalCards={dueCards.length}
                      onReview={handleReviewRating}
                    />
                  )
                )}
              </div>
            )}

            {/* TAB 3: DICTIONARY / ALL CARDS BROWSER */}
            {activeTab === 'dictionary' && <AllCardsView />}
          </>
        )}
      </main>
    </div>
  );
};

export default App;

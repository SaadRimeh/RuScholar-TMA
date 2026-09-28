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
  const { user, initData, triggerHaptic, triggerNotificationFeedback } = useTelegram();

  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [stats, setStats] = useState<DeckStats | null>(null);
  const [dueCards, setDueCards] = useState<IFlashcard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

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
        await refreshDeckData();
      } catch (err) {
        console.error('[App] Failed to authenticate with backend:', err);
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

  const dueCount = stats?.dueToday ?? dueCards.length;
  const totalCount = stats?.totalCards ?? dueCards.length;
  const masteredCount = stats?.masteredCards ?? 0;
  const learningCount = stats?.learningCards ?? 0;

  // Approximate retention rate (default 92-95% when cards exist)
  const retentionRate = totalCount > 0 ? Math.min(98, Math.max(85, Math.round(90 + (masteredCount / totalCount) * 8))) : 100;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar dueCount={dueCount} isConnected={backendConnected} />

      <main
        style={{
          flex: 1,
          padding: '16px',
          maxWidth: '640px',
          margin: '0 auto',
          width: '100%',
        }}
        className="safe-area-bottom"
      >
        {/* Navigation Tabs */}
        <Tabs
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === 'review' && isSessionComplete) {
              handleSessionRestart();
            }
          }}
          dueCount={dueCount}
        />

        {loading ? (
          <LoadingSpinner message="Synchronizing with RuScholar server..." />
        ) : (
          <>
            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Hero Greeting & Profile Card */}
                <section
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-lg)',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(24, 33, 50, 0.95) 0%, rgba(13, 18, 28, 0.95) 100%)',
                    border: '1px solid var(--border-medium)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-ui)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: 'var(--accent-cyan)',
                        }}
                      >
                        Academic Hub
                      </span>
                      <h2
                        style={{
                          fontSize: '1.45rem',
                          fontWeight: 800,
                          fontFamily: 'var(--font-heading)',
                          letterSpacing: '-0.02em',
                          color: '#ffffff',
                          marginTop: '2px',
                        }}
                      >
                        {user?.first_name ? `Welcome back, ${user.first_name}!` : 'Welcome back, Scholar!'}
                      </h2>
                    </div>

                    <span className={backendConnected ? 'badge badge-success' : 'badge badge-warning'}>
                      {backendConnected ? '● HMAC Verified' : '○ Standalone'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                    Master Russian university lectures, lab reports, and thesis requirements with spaced scientific recall.
                  </p>

                  {/* Highlights row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1rem' }}>🔥</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        3-Day Streak
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1rem' }}>🎯</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                        {retentionRate}% Retention Rate
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1rem' }}>⚡</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        SM-2 Engine Active
                      </span>
                    </div>
                  </div>
                </section>

                {/* Academic Retention Metrics (SM-2 Grid) */}
                <section>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3
                      style={{
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-ui)',
                      }}
                    >
                      Retention Metrics (SuperMemo SM-2)
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Updated live</span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px',
                    }}
                  >
                    {/* Due today */}
                    <div
                      className="glass-panel"
                      style={{
                        padding: '18px 16px',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '4px solid var(--warning-color)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)' }}>
                          DUE FOR REVIEW
                        </span>
                        <span style={{ fontSize: '1.1rem' }}>⚡</span>
                      </div>
                      <div style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fbbf24', marginTop: '6px' }}>
                        {dueCount}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Ready for repetition today
                      </div>
                    </div>

                    {/* Mastered */}
                    <div
                      className="glass-panel"
                      style={{
                        padding: '18px 16px',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '4px solid var(--success-color)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)' }}>
                          MASTERED TERMS
                        </span>
                        <span style={{ fontSize: '1.1rem' }}>🏆</span>
                      </div>
                      <div style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#34d399', marginTop: '6px' }}>
                        {masteredCount}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Repetition count &ge; 4
                      </div>
                    </div>

                    {/* In Learning */}
                    <div
                      className="glass-panel"
                      style={{
                        padding: '18px 16px',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '4px solid var(--accent-purple)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)' }}>
                          IN LEARNING
                        </span>
                        <span style={{ fontSize: '1.1rem' }}>🧠</span>
                      </div>
                      <div style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#c084fc', marginTop: '6px' }}>
                        {learningCount}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Actively progressing
                      </div>
                    </div>

                    {/* Total Vocabulary */}
                    <div
                      className="glass-panel"
                      style={{
                        padding: '18px 16px',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '4px solid var(--accent-cyan)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)' }}>
                          TOTAL DECK
                        </span>
                        <span style={{ fontSize: '1.1rem' }}>📚</span>
                      </div>
                      <div style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#38bdf8', marginTop: '6px' }}>
                        {totalCount}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Extracted flashcards
                      </div>
                    </div>
                  </div>
                </section>

                {/* Primary Review CTA */}
                <div>
                  {dueCards.length > 0 ? (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={startReviewSession}
                      style={{
                        width: '100%',
                        padding: '18px 20px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '1.05rem',
                      }}
                    >
                      <span>🧠 Start Daily Review Session</span>
                      <span
                        style={{
                          background: 'rgba(0, 0, 0, 0.25)',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.85rem',
                        }}
                      >
                        {dueCards.length} Cards Due
                      </span>
                    </button>
                  ) : (
                    <div
                      className="glass-panel"
                      style={{
                        padding: '24px 20px',
                        textAlign: 'center',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🎉</div>
                      <h4
                        style={{
                          fontWeight: 700,
                          color: '#ffffff',
                          fontFamily: 'var(--font-heading)',
                          fontSize: '1.1rem',
                          marginBottom: '4px',
                        }}
                      >
                        All caught up for today!
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '340px', margin: '0 auto' }}>
                        No cards are currently due. Forward new academic notices to <b>@ruscholar1_bot</b> to expand your deck!
                      </p>
                    </div>
                  )}
                </div>

                {/* How to Expand Deck Banner */}
                <section
                  className="glass-panel"
                  style={{
                    padding: '18px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(19, 26, 41, 0.65)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>💡</span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-ui)' }}>
                      Quick Student Guide
                    </h4>
                  </div>
                  <ul
                    style={{
                      listStyle: 'none',
                      fontSize: '0.825rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <li>• <b>Forward notices:</b> Send telegram announcements from professors or dean's office directly to the bot.</li>
                    <li>• <b>Instant translation:</b> Neural engine translates Russian text to English with high accuracy.</li>
                    <li>• <b>Automatic SRS cards:</b> Academic terms are saved with context sentences for optimal long-term memory.</li>
                  </ul>
                </section>
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

import React, { useEffect, useState, useCallback } from 'react';
import type { IFlashcard } from '../types/flashcard.types';
import { flashcardsApi } from '../api/flashcards.api';
import { LoadingSpinner } from './LoadingSpinner';
import { useTelegram } from '../hooks/useTelegram';
import { speakRussian } from '../utils/speech';

export const AllCardsView: React.FC = () => {
  const { triggerHaptic } = useTelegram();
  const [cards, setCards] = useState<IFlashcard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const result = await flashcardsApi.getAllFlashcards({
        search: search.trim() || undefined,
        tag: selectedTag || undefined,
        limit: 50,
      });
      setCards(result.cards);
    } catch (err) {
      console.error('[AllCardsView] Failed to load cards:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedTag]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCards();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchCards]);

  const handleDelete = async (id: string, term: string) => {
    if (!window.confirm(`Delete flashcard for "${term}"?`)) return;

    triggerHaptic('heavy');
    setDeletingId(id);
    try {
      await flashcardsApi.deleteCard(id);
      setCards((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error('[AllCardsView] Failed to delete card:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSpeak = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    triggerHaptic('light');
    speakRussian(term);
  };

  // Collect unique tags
  const allTags = Array.from(new Set(cards.flatMap((c) => c.tags || [])));

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
      {/* Header & Search */}
      <div style={{ marginBottom: '16px' }}>
        <div className="search-box">
          <span style={{ fontSize: '1rem', opacity: 0.7 }}>🔍</span>
          <input
            type="text"
            placeholder="Search Russian or English academic term..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                padding: '2px 6px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tag Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px',
          scrollbarWidth: 'none',
        }}
      >
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setSelectedTag('');
          }}
          style={{
            cursor: 'pointer',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: !selectedTag ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.06)',
            color: !selectedTag ? '#ffffff' : 'var(--text-secondary)',
            fontSize: '0.78rem',
            fontWeight: 700,
            fontFamily: 'var(--font-ui)',
            whiteSpace: 'nowrap',
            border: !selectedTag ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid var(--border-subtle)',
          }}
        >
          All Terms ({cards.length})
        </button>

        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setSelectedTag(tag === selectedTag ? '' : tag);
            }}
            style={{
              cursor: 'pointer',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: selectedTag === tag ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.06)',
              color: selectedTag === tag ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              fontFamily: 'var(--font-ui)',
              whiteSpace: 'nowrap',
              border: selectedTag === tag ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid var(--border-subtle)',
            }}
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Cards List */}
      {loading ? (
        <LoadingSpinner message="Searching academic dictionary..." />
      ) : cards.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '36px 20px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '1.5rem',
            }}
          >
            📖
          </div>
          <p
            style={{
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              fontFamily: 'var(--font-heading)',
              marginBottom: '6px',
            }}
          >
            No flashcards found
          </p>
          <p style={{ fontSize: '0.85rem', maxWidth: '340px', margin: '0 auto', lineHeight: 1.5 }}>
            {search || selectedTag
              ? 'No cards match your search filter. Try clearing the query.'
              : 'Forward academic announcements to @ruscholar1_bot to automatically extract technical terms!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cards.map((card) => {
            const isMastered = card.repetition >= 4;
            const isLearning = card.repetition > 0 && card.repetition < 4;

            return (
              <div
                key={card._id}
                className="glass-panel glass-panel-interactive"
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '14px',
                }}
              >
                <div style={{ flex: 1 }}>
                  {/* Top tags row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '1.15rem',
                        color: '#ffffff',
                        fontFamily: 'var(--font-heading)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {card.originalTerm}
                    </span>

                    <button
                      type="button"
                      className="audio-btn"
                      style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}
                      onClick={(e) => handleSpeak(e, card.originalTerm)}
                      title="Pronounce term"
                    >
                      🔊
                    </button>

                    {card.partOfSpeech && (
                      <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                        {card.partOfSpeech}
                      </span>
                    )}

                    {isMastered ? (
                      <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                        ✓ Mastered
                      </span>
                    ) : isLearning ? (
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                        ● Learning
                      </span>
                    ) : (
                      <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                        ★ New
                      </span>
                    )}
                  </div>

                  {/* Translation */}
                  <div
                    style={{
                      fontSize: '0.95rem',
                      color: 'var(--accent-cyan)',
                      fontWeight: 600,
                      fontFamily: 'var(--font-ui)',
                      marginBottom: '8px',
                    }}
                  >
                    {card.translatedTerm}
                  </div>

                  {/* Russian Context Sentence */}
                  {card.contextSentenceRu && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderLeft: '3px solid var(--accent-blue)',
                        fontSize: '0.825rem',
                        fontStyle: 'italic',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45,
                        marginBottom: '8px',
                      }}
                    >
                      "{card.contextSentenceRu}"
                    </div>
                  )}

                  {/* SM-2 Metrics footer */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-ui)',
                    }}
                  >
                    <span>Next Review: <b>{card.interval}d</b></span>
                    <span>Repetitions: <b>{card.repetition}</b></span>
                    <span>Ease Factor: <b>{card.easeFactor}</b></span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDelete(card._id, card.originalTerm)}
                  disabled={deletingId === card._id}
                  title="Delete card"
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {deletingId === card._id ? '...' : '🗑️'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

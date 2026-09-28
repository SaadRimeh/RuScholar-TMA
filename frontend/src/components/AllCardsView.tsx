import React, { useEffect, useState, useCallback } from 'react';
import type { IFlashcard } from '../types/flashcard.types';
import { flashcardsApi } from '../api/flashcards.api';
import { LoadingSpinner } from './LoadingSpinner';
import { useTelegram } from '../hooks/useTelegram';

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

  // Collect unique tags
  const allTags = Array.from(new Set(cards.flatMap((c) => c.tags || [])));

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Search Input */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="🔍 Search Russian or English term..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
      </div>

      {/* Tag Filter Pills */}
      {allTags.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '16px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setSelectedTag('');
            }}
            className={`badge ${!selectedTag ? 'badge-primary' : ''}`}
            style={{
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: !selectedTag ? 'var(--accent-color)' : 'rgba(240, 246, 252, 0.08)',
              color: '#fff',
            }}
          >
            All
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
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                background: selectedTag === tag ? 'var(--accent-color)' : 'rgba(240, 246, 252, 0.08)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Cards List */}
      {loading ? (
        <LoadingSpinner message="Searching flashcards..." />
      ) : cards.length === 0 ? (
        <div className="glass-panel" style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '1.4rem', marginBottom: '8px' }}>🔍</p>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>No flashcards found</p>
          <p style={{ fontSize: '0.85rem' }}>
            {search || selectedTag
              ? 'Try adjusting your search query or filter.'
              : 'Forward academic notices to the bot to create your first flashcards.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cards.map((card) => (
            <div
              key={card._id}
              className="glass-panel"
              style={{
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>
                    {card.originalTerm}
                  </span>
                  {card.partOfSpeech && (
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                      {card.partOfSpeech}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.9rem', color: '#58a6ff', fontWeight: 600, marginBottom: '6px' }}>
                  {card.translatedTerm}
                </div>

                {card.contextSentenceRu && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontStyle: 'italic',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      marginBottom: '8px',
                    }}
                  >
                    "{card.contextSentenceRu}"
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Interval: <b>{card.interval}d</b></span>
                  <span>Reps: <b>{card.repetition}</b></span>
                  <span>EF: <b>{card.easeFactor}</b></span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(card._id, card.originalTerm)}
                disabled={deletingId === card._id}
                title="Delete flashcard"
                style={{
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                }}
              >
                {deletingId === card._id ? '...' : '🗑️'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { IFlashcard, SRSRating } from '../types/flashcard.types';
import { useTelegram } from '../hooks/useTelegram';
import { speakRussian } from '../utils/speech';

interface FlashcardReviewProps {
  card: IFlashcard;
  currentIndex: number;
  totalCards: number;
  onReview: (rating: SRSRating) => Promise<void>;
  onSkip?: () => void;
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({
  card,
  currentIndex,
  totalCards,
  onReview,
}) => {
  const { triggerHaptic } = useTelegram();
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Compute live estimated interval hints for the buttons
  const getProjectedInterval = (rating: SRSRating): string => {
    if (rating === 'again') return '1d';
    if (card.repetition === 0) return rating === 'easy' ? '3d' : '1d';
    if (card.repetition === 1) return rating === 'easy' ? '10d' : '6d';

    const ef = card.easeFactor || 2.5;
    const baseInterval = card.interval || 6;

    if (rating === 'hard') {
      return `${Math.max(Math.round(baseInterval * 1.2), baseInterval + 1)}d`;
    }
    if (rating === 'good') {
      return `${Math.round(baseInterval * ef)}d`;
    }
    // easy
    return `${Math.round(baseInterval * (ef + 0.15))}d`;
  };

  const handleCardClick = () => {
    triggerHaptic('light');
    setIsFlipped((prev) => !prev);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    speakRussian(card.originalTerm);
  };

  const handleRatingSubmit = async (rating: SRSRating) => {
    if (submitting) return;

    if (rating === 'again') {
      triggerHaptic('heavy');
    } else {
      triggerHaptic('medium');
    }

    setSubmitting(true);
    try {
      await onReview(rating);
      setIsFlipped(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard accessibility for desktop users (Space to flip, 1-4 for ratings)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleRatingSubmit('again');
        else if (e.key === '2') handleRatingSubmit('hard');
        else if (e.key === '3') handleRatingSubmit('good');
        else if (e.key === '4') handleRatingSubmit('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, submitting]);

  const progressPct = Math.round(((currentIndex + 1) / totalCards) * 100);

  return (
    <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>
      {/* Session Progress Header */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            marginBottom: '8px',
            fontFamily: 'var(--font-ui)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.9rem' }}>🎯</span>
            <span style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>SRS Recall Session</span>
          </div>
          <span
            className="badge badge-primary"
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
          >
            {currentIndex + 1} / {totalCards} ({progressPct}%)
          </span>
        </div>

        <div
          style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: 'var(--accent-gradient)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
            }}
          />
        </div>
      </div>

      {/* 3D Flip Card */}
      <div className="flip-card-container" onClick={handleCardClick}>
        <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
          {/* FRONT SIDE (RUSSIAN ACADEMIC TERM) */}
          <div className="flip-card-front">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-primary">
                  {card.partOfSpeech || 'Academic Term'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="audio-btn"
                    onClick={handleSpeak}
                    title="Listen to Russian pronunciation"
                  >
                    🔊
                  </button>
                  {card.tags?.slice(0, 1).map((tag, idx) => (
                    <span
                      key={idx}
                      className="badge"
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: 'center', margin: '42px 0 24px' }}>
                <h3
                  style={{
                    fontSize: '2.1rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    color: '#ffffff',
                    fontFamily: 'var(--font-heading)',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {card.originalTerm}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Tap speaker to hear pronunciation
                </p>
              </div>

              {card.contextSentenceRu && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(56, 189, 248, 0.06)',
                    borderLeft: '3px solid var(--accent-cyan)',
                    fontSize: '0.875rem',
                    fontStyle: 'italic',
                    color: '#e2e8f0',
                    lineHeight: 1.5,
                  }}
                >
                  "{card.contextSentenceRu}"
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--accent-cyan)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                }}
              >
                🔄 Tap card or press Space to reveal translation
              </span>
            </div>
          </div>

          {/* BACK SIDE (ENGLISH TRANSLATION & CONTEXT) */}
          <div className="flip-card-back">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-success">Translation</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)' }}>
                  Interval: <b>{card.interval}d</b> • Reps: <b>{card.repetition}</b>
                </span>
              </div>

              <div style={{ textAlign: 'center', margin: '38px 0 20px' }}>
                <h3
                  style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: '#34d399',
                    fontFamily: 'var(--font-heading)',
                    lineHeight: 1.2,
                    textShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {card.translatedTerm}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  ({card.originalTerm})
                </p>
              </div>

              {card.contextSentenceEn && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(16, 185, 129, 0.08)',
                    borderLeft: '3px solid #10b981',
                    fontSize: '0.875rem',
                    color: '#f0fdf4',
                    lineHeight: 1.5,
                  }}
                >
                  "{card.contextSentenceEn}"
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                Rate how well you recalled this term below:
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SuperMemo SM-2 Rating Buttons */}
      <div className="rating-grid">
        <button
          type="button"
          className="rating-btn rating-again"
          onClick={(e) => {
            e.stopPropagation();
            handleRatingSubmit('again');
          }}
          disabled={submitting}
        >
          <span className="rating-label">Again</span>
          <span className="interval-hint">{getProjectedInterval('again')}</span>
        </button>

        <button
          type="button"
          className="rating-btn rating-hard"
          onClick={(e) => {
            e.stopPropagation();
            handleRatingSubmit('hard');
          }}
          disabled={submitting}
        >
          <span className="rating-label">Hard</span>
          <span className="interval-hint">{getProjectedInterval('hard')}</span>
        </button>

        <button
          type="button"
          className="rating-btn rating-good"
          onClick={(e) => {
            e.stopPropagation();
            handleRatingSubmit('good');
          }}
          disabled={submitting}
        >
          <span className="rating-label">Good</span>
          <span className="interval-hint">{getProjectedInterval('good')}</span>
        </button>

        <button
          type="button"
          className="rating-btn rating-easy"
          onClick={(e) => {
            e.stopPropagation();
            handleRatingSubmit('easy');
          }}
          disabled={submitting}
        >
          <span className="rating-label">Easy</span>
          <span className="interval-hint">{getProjectedInterval('easy')}</span>
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import type { IFlashcard, SRSRating } from '../types/flashcard.types';
import { useTelegram } from '../hooks/useTelegram';

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

  const progressPct = Math.round(((currentIndex + 1) / totalCards) * 100);

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
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
            marginBottom: '6px',
          }}
        >
          <span>REVIEW SESSION</span>
          <span>
            {currentIndex + 1} of {totalCards} ({progressPct}%)
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '6px',
            background: 'rgba(240, 246, 252, 0.1)',
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
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* 3D Flip Card */}
      <div className="flip-card-container" onClick={handleCardClick}>
        <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
          {/* FRONT SIDE (RUSSIAN ACADEMIC TERM) */}
          <div
            className="flip-card-front glass-panel"
            style={{
              border: '1px solid rgba(47, 129, 247, 0.25)',
              background: 'linear-gradient(180deg, rgba(22, 27, 34, 0.95) 0%, rgba(13, 17, 23, 0.95) 100%)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-primary">
                  {card.partOfSpeech || 'Academic Term'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {card.tags?.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="badge" style={{ background: 'rgba(240, 246, 252, 0.08)', color: 'var(--text-secondary)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: 'center', margin: '48px 0 24px' }}>
                <h3
                  style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    color: '#ffffff',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {card.originalTerm}
                </h3>
              </div>

              {card.contextSentenceRu && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(240, 246, 252, 0.04)',
                    borderLeft: '3px solid #2f81f7',
                    fontSize: '0.85rem',
                    fontStyle: 'italic',
                    color: 'var(--text-secondary)',
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
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--accent-color)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                🔄 Tap card to reveal translation
              </span>
            </div>
          </div>

          {/* BACK SIDE (ENGLISH TRANSLATION & CONTEXT) */}
          <div
            className="flip-card-back glass-panel"
            style={{
              border: '1px solid rgba(46, 160, 67, 0.3)',
              background: 'linear-gradient(180deg, rgba(22, 27, 34, 0.98) 0%, rgba(13, 23, 17, 0.98) 100%)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-success">Translation</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Interval: {card.interval}d • Reps: {card.repetition}
                </span>
              </div>

              <div style={{ textAlign: 'center', margin: '40px 0 20px' }}>
                <h3
                  style={{
                    fontSize: '1.85rem',
                    fontWeight: 800,
                    color: '#3fb950',
                    lineHeight: 1.2,
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
                    background: 'rgba(46, 160, 67, 0.08)',
                    borderLeft: '3px solid #2ea043',
                    fontSize: '0.85rem',
                    color: '#e6edf3',
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
                Select your recall difficulty below
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SuperMemo SM-2 Rating Buttons */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="rating-btn rating-again"
            onClick={(e) => {
              e.stopPropagation();
              handleRatingSubmit('again');
            }}
            disabled={submitting}
          >
            <span>Again</span>
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
            <span>Hard</span>
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
            <span>Good</span>
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
            <span>Easy</span>
            <span className="interval-hint">{getProjectedInterval('easy')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

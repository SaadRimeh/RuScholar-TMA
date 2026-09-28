import React from 'react';
import { useTelegram } from '../hooks/useTelegram';

export type AppTab = 'dashboard' | 'review' | 'dictionary';

interface TabsProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  dueCount?: number;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange, dueCount = 0 }) => {
  const { triggerHaptic } = useTelegram();

  const handleSelect = (tab: AppTab) => {
    triggerHaptic('light');
    onTabChange(tab);
  };

  return (
    <nav
      style={{
        display: 'flex',
        padding: '4px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(22, 27, 34, 0.9)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '20px',
        gap: '4px',
      }}
    >
      <button
        type="button"
        onClick={() => handleSelect('dashboard')}
        style={{
          flex: 1,
          padding: '10px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          fontWeight: activeTab === 'dashboard' ? 700 : 500,
          background: activeTab === 'dashboard' ? 'var(--accent-color)' : 'transparent',
          color: activeTab === 'dashboard' ? '#fff' : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <span>📊</span>
        <span>Dashboard</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect('review')}
        style={{
          flex: 1,
          padding: '10px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          fontWeight: activeTab === 'review' ? 700 : 500,
          background: activeTab === 'review' ? 'var(--accent-color)' : 'transparent',
          color: activeTab === 'review' ? '#fff' : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          position: 'relative',
        }}
      >
        <span>🧠</span>
        <span>Review</span>
        {dueCount > 0 && (
          <span
            style={{
              padding: '2px 6px',
              borderRadius: 'var(--radius-full)',
              background: activeTab === 'review' ? '#fff' : 'var(--warning-color)',
              color: activeTab === 'review' ? 'var(--accent-color)' : '#000',
              fontSize: '0.7rem',
              fontWeight: 800,
            }}
          >
            {dueCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => handleSelect('dictionary')}
        style={{
          flex: 1,
          padding: '10px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          fontWeight: activeTab === 'dictionary' ? 700 : 500,
          background: activeTab === 'dictionary' ? 'var(--accent-color)' : 'transparent',
          color: activeTab === 'dictionary' ? '#fff' : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <span>📚</span>
        <span>Dictionary</span>
      </button>
    </nav>
  );
};

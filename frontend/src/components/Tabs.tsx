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

  const tabsConfig: Array<{ id: AppTab; label: string; icon: string; count?: number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'review', label: 'Review', icon: '🧠', count: dueCount },
    { id: 'dictionary', label: 'Dictionary', icon: '📚' },
  ];

  return (
    <nav
      style={{
        display: 'flex',
        padding: '5px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(19, 26, 41, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '20px',
        gap: '4px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      }}
    >
      {tabsConfig.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleSelect(tab.id)}
            style={{
              flex: 1,
              padding: '11px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: isActive ? 700 : 600,
              fontFamily: 'var(--font-ui)',
              background: isActive
                ? 'var(--accent-gradient)'
                : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: isActive ? '0 4px 14px rgba(59, 130, 246, 0.35)' : 'none',
              border: isActive ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: '0.95rem' }}>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  background: isActive ? '#ffffff' : 'var(--warning-color)',
                  color: isActive ? '#1d4ed8' : '#000000',
                  fontSize: '0.675rem',
                  fontWeight: 800,
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import WebApp from '@twa-dev/sdk';
import type { TelegramContextType, TelegramUser, TelegramThemeParams } from '../types/telegram.types';

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>('');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');
  const [themeParams, setThemeParams] = useState<TelegramThemeParams>({});
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (typeof WebApp !== 'undefined' && WebApp.initDataUnsafe) {
        // Signal to Telegram that the Mini App is fully initialized
        WebApp.ready();

        // Expand app viewport to full height
        WebApp.expand();

        setIsAvailable(true);
        setInitData(WebApp.initData || '');

        if (WebApp.initDataUnsafe.user) {
          setUser({
            id: WebApp.initDataUnsafe.user.id,
            first_name: WebApp.initDataUnsafe.user.first_name,
            last_name: WebApp.initDataUnsafe.user.last_name,
            username: WebApp.initDataUnsafe.user.username,
            language_code: WebApp.initDataUnsafe.user.language_code,
            is_premium: WebApp.initDataUnsafe.user.is_premium,
          });
        }

        if (WebApp.colorScheme) {
          setColorScheme(WebApp.colorScheme);
        }

        if (WebApp.themeParams) {
          setThemeParams(WebApp.themeParams);
        }
      }
    } catch (err) {
      console.warn('[TelegramProvider] Telegram WebApp SDK running outside Telegram client:', err);
      // Fallback for desktop browser development
      setUser({
        id: 987654321,
        first_name: 'Academic',
        last_name: 'Scholar',
        username: 'scholar_demo',
        language_code: 'en',
      });
    }
  }, []);

  const ready = () => {
    try {
      WebApp.ready();
    } catch {
      // Ignored in desktop browser
    }
  };

  const expand = () => {
    try {
      WebApp.expand();
    } catch {
      // Ignored in desktop browser
    }
  };

  const close = () => {
    try {
      WebApp.close();
    } catch {
      // Ignored in desktop browser
    }
  };

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    try {
      WebApp.HapticFeedback.impactOccurred(style);
    } catch {
      // Ignored in desktop browser
    }
  };

  const triggerNotificationFeedback = (type: 'error' | 'success' | 'warning') => {
    try {
      WebApp.HapticFeedback.notificationOccurred(type);
    } catch {
      // Ignored in desktop browser
    }
  };

  const value = useMemo(
    () => ({
      user,
      initData,
      isAvailable,
      colorScheme,
      themeParams,
      ready,
      expand,
      close,
      triggerHaptic,
      triggerNotificationFeedback,
    }),
    [user, initData, isAvailable, colorScheme, themeParams]
  );

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
};

export const useTelegram = (): TelegramContextType => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};

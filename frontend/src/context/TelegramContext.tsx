import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import WebApp from '@twa-dev/sdk';
import type { TelegramContextType, TelegramUser, TelegramThemeParams } from '../types/telegram.types';

import { getTelegramInitData, getTelegramUser } from '../utils/telegram';

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>('');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');
  const [themeParams, setThemeParams] = useState<TelegramThemeParams>({});
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (typeof WebApp !== 'undefined') {
        WebApp.ready();
        WebApp.expand();
      }
    } catch {
      // Ignore
    }

    const detectedInitData = getTelegramInitData();
    const detectedUser = getTelegramUser();

    if (detectedInitData) {
      setInitData(detectedInitData);
      setIsAvailable(true);
    }

    if (detectedUser) {
      setUser(detectedUser);
    } else {
      // Fallback for desktop browser development
      setUser({
        id: 987654321,
        first_name: 'Academic',
        last_name: 'Scholar',
        username: 'scholar_demo',
        language_code: 'en',
      });
    }

    try {
      if (typeof WebApp !== 'undefined') {
        if (WebApp.colorScheme) {
          setColorScheme(WebApp.colorScheme);
        }
        if (WebApp.themeParams) {
          setThemeParams(WebApp.themeParams);
        }
      }
    } catch {
      // Ignore
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

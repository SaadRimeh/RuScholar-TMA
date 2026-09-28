import WebApp from '@twa-dev/sdk';
import type { TelegramUser } from '../types/telegram.types';

/**
 * Reliably retrieves the raw Telegram Mini App initData string.
 * Checks in sequence:
 * 1. window.Telegram.WebApp.initData
 * 2. @twa-dev/sdk WebApp.initData
 * 3. URL Hash fragment: #tgWebAppData=... (Telegram Desktop & web client)
 * 4. URL Search query: ?tgWebAppData=...
 */
export const getTelegramInitData = (): string => {
  if (typeof window === 'undefined') return '';

  // 1. window.Telegram.WebApp
  if (window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData;
  }

  // 2. @twa-dev/sdk
  try {
    if (typeof WebApp !== 'undefined' && WebApp.initData) {
      return WebApp.initData;
    }
  } catch {
    // Ignore errors from SDK check
  }

  // 3. Telegram Desktop passes parameters in location.hash: #tgWebAppData=...
  if (window.location.hash) {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hash);
    const tgWebAppData = hashParams.get('tgWebAppData');
    if (tgWebAppData) {
      return tgWebAppData;
    }
  }

  // 4. Fallback: location.search: ?tgWebAppData=...
  if (window.location.search) {
    const searchParams = new URLSearchParams(window.location.search);
    const tgWebAppData = searchParams.get('tgWebAppData');
    if (tgWebAppData) {
      return tgWebAppData;
    }
  }

  return '';
};

/**
 * Extracts the user object either from Telegram SDK or parsed from initData.
 */
export const getTelegramUser = (): TelegramUser | null => {
  if (typeof window === 'undefined') return null;

  // 1. window.Telegram.WebApp.initDataUnsafe.user
  if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user as TelegramUser;
  }

  // 2. @twa-dev/sdk
  try {
    if (typeof WebApp !== 'undefined' && WebApp.initDataUnsafe?.user) {
      return WebApp.initDataUnsafe.user as TelegramUser;
    }
  } catch {
    // Ignore
  }

  // 3. Parse user from initData string
  const rawInitData = getTelegramInitData();
  if (rawInitData) {
    try {
      const params = new URLSearchParams(rawInitData);
      const userJson = params.get('user');
      if (userJson) {
        return JSON.parse(userJson) as TelegramUser;
      }
    } catch {
      // Ignore JSON parse error
    }
  }

  return null;
};

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

export interface TelegramContextType {
  user: TelegramUser | null;
  initData: string;
  isAvailable: boolean;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  ready: () => void;
  expand: () => void;
  close: () => void;
  triggerHaptic: (style?: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  triggerNotificationFeedback: (type: 'error' | 'success' | 'warning') => void;
}

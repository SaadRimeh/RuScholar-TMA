import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config/env';
import { TelegramUser } from '../types/telegram.types';
import { UserModel } from '../models/User.model';

// Expiration threshold for Telegram initData: 24 hours (in seconds)
const INIT_DATA_EXPIRATION_SECONDS = 86400;

/**
 * Validates the raw Telegram Mini App initData string against HMAC-SHA-256 signature.
 * Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export const verifyTelegramInitData = (
  rawInitData: string,
  botToken: string
): { isValid: boolean; user?: TelegramUser; authDate?: number; error?: string } => {
  if (!rawInitData || !botToken) {
    return { isValid: false, error: 'Missing initData or bot token' };
  }

  try {
    const urlParams = new URLSearchParams(rawInitData);
    const hash = urlParams.get('hash');

    if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) {
      return { isValid: false, error: 'Invalid or missing hash format in initData' };
    }

    // Extract auth_date and verify expiration
    const authDateStr = urlParams.get('auth_date');
    if (!authDateStr) {
      return { isValid: false, error: 'Missing auth_date parameter in initData' };
    }

    const authDate = parseInt(authDateStr, 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > INIT_DATA_EXPIRATION_SECONDS) {
      return { isValid: false, error: 'initData has expired (replay attack prevention)' };
    }

    // Build the data-check-string:
    // 1. Remove 'hash'
    // 2. Sort remaining key=value pairs alphabetically
    // 3. Join with newline '\n'
    const pairs: string[] = [];
    for (const [key, value] of urlParams.entries()) {
      if (key !== 'hash') {
        pairs.push(`${key}=${value}`);
      }
    }
    pairs.sort();
    const dataCheckString = pairs.join('\n');

    // Generate secret key: HMAC_SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate signature: HMAC_SHA256(secretKey, dataCheckString)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const hashBuffer = Buffer.from(hash, 'hex');
    const calculatedBuffer = Buffer.from(calculatedHash, 'hex');

    if (
      hashBuffer.length !== calculatedBuffer.length ||
      !crypto.timingSafeEqual(hashBuffer, calculatedBuffer)
    ) {
      return { isValid: false, error: 'Invalid HMAC signature' };
    }

    // Parse user object
    const userJson = urlParams.get('user');
    const user: TelegramUser | undefined = userJson ? JSON.parse(userJson) : undefined;

    return {
      isValid: true,
      user,
      authDate,
    };
  } catch (err) {
    return {
      isValid: false,
      error: `Failed to parse initData: ${(err as Error).message}`,
    };
  }
};

/**
 * Express Middleware to protect Mini App routes with Telegram initData validation.
 * Extracts initData from:
 * 1. Authorization header: "tma <initData>" or "Bearer <initData>"
 * 2. Custom header: "x-telegram-init-data"
 */
export const requireTelegramAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const customHeader = req.headers['x-telegram-init-data'];

  let rawInitData = '';

  if (typeof customHeader === 'string' && customHeader.trim().length > 0) {
    rawInitData = customHeader.trim();
  } else if (typeof authHeader === 'string') {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && (parts[0]?.toLowerCase() === 'tma' || parts[0]?.toLowerCase() === 'bearer')) {
      rawInitData = parts[1] || '';
    } else {
      rawInitData = authHeader.trim();
    }
  }

  if (!rawInitData) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing Telegram initData in authorization header',
    });
    return;
  }

  const verification = verifyTelegramInitData(rawInitData, config.telegramBotToken);

  if (!verification.isValid || !verification.user) {
    res.status(401).json({
      success: false,
      error: `Unauthorized: ${verification.error || 'Invalid Telegram credentials'}`,
    });
    return;
  }

  try {
    // Attach validated Telegram user to request
    req.telegramUser = verification.user;

    // Synchronize / Upsert user in MongoDB for seamless data access in downstream controllers
    const userDoc = await UserModel.findOneAndUpdate(
      { telegramId: verification.user.id },
      {
        $setOnInsert: {
          telegramId: verification.user.id,
        },
        $set: {
          firstName: verification.user.first_name,
          ...(verification.user.last_name ? { lastName: verification.user.last_name } : {}),
          ...(verification.user.username ? { username: verification.user.username } : {}),
          ...(verification.user.language_code ? { languageCode: verification.user.language_code } : {}),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    req.userDoc = userDoc;
    next();
  } catch (dbError) {
    console.error('[Auth Middleware] Database user sync error:', dbError);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error during user synchronization',
    });
  }
};

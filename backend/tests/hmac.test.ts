import crypto from 'crypto';
import { verifyTelegramInitData } from '../src/middlewares/validateInitData';

describe('Telegram Mini App initData HMAC Verification', () => {
  const token = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';
  const authDate = Math.floor(Date.now() / 1000);
  const userJson = JSON.stringify({ id: 987654321, first_name: 'Saad', username: 'saad_dev' });

  const createCheckStringAndHash = (timestamp: number, user: string) => {
    const params: [string, string][] = [
      ['auth_date', timestamp.toString()],
      ['query_id', 'AAHdF6IQAAAAAN0XohDhrP_V'],
      ['user', user],
    ];
    params.sort((a, b) => a[0].localeCompare(b[0]));
    const checkString = params.map(([k, v]) => `${k}=${v}`).join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const hash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
    return {
      initData: `auth_date=${timestamp}&query_id=AAHdF6IQAAAAAN0XohDhrP_V&user=${encodeURIComponent(user)}&hash=${hash}`,
      hash,
    };
  };

  const legitimate = createCheckStringAndHash(authDate, userJson);

  const testValid = verifyTelegramInitData(legitimate.initData, token);
  if (!testValid.isValid || testValid.user?.id !== 987654321) {
    throw new Error('Valid signature failed verification');
  }

  const testTampered = verifyTelegramInitData(legitimate.initData + 'tampered', token);
  if (testTampered.isValid) {
    throw new Error('Tampered hash unexpectedly passed verification');
  }

  const spoofedUser = JSON.stringify({ id: 111111111, first_name: 'Attacker' });
  const testSpoofed = verifyTelegramInitData(
    legitimate.initData.replace(encodeURIComponent(userJson), encodeURIComponent(spoofedUser)),
    token
  );
  if (testSpoofed.isValid) {
    throw new Error('Spoofed user payload unexpectedly passed verification');
  }

  const expired = createCheckStringAndHash(authDate - 90000, userJson);
  const testExpired = verifyTelegramInitData(expired.initData, token);
  if (testExpired.isValid) {
    throw new Error('Expired initData unexpectedly passed verification');
  }

  console.log('[Test Suite] All Telegram HMAC-SHA-256 verification tests passed successfully.');
});

function describe(suiteName: string, fn: () => void) {
  console.log(`Running test suite: ${suiteName}`);
  fn();
}

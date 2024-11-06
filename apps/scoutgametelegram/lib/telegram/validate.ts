import crypto from 'node:crypto';

import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import type { WebAppInitData } from '@twa-dev/types/index';

function parseInitData(initData: string) {
  const params = new URLSearchParams(initData);
  const data: { [key: string]: string } = {};
  params.forEach((value, key) => {
    data[key] = value;
  });
  return data;
}

function createDataCheckString(data: { [key: string]: string }) {
  const keys = Object.keys(data)
    .filter((key) => key !== 'hash')
    .sort();
  return keys.map((key) => `${key}=${data[key]}`).join('\n');
}

function generateSecretKey(botToken: string) {
  return crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
}

/**
 * Validates passed init data.
 * @param value - value to check.
 * @param token - bot secret token.
 * @param options - additional validation options.
 * @throws {InvalidInputError} "hash" is empty, not found or doesn't match
 * @throws {InvalidInputError} "auth_date" is empty or not found
 * @throws {InvalidInputError} Init data expired
 */
export function validateTelegramData(value: string, token: string, options?: { expiresIn: number }): WebAppInitData {
  const data = parseInitData(value);
  const dataCheckString = createDataCheckString(data);
  const secretKey = generateSecretKey(token);
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (!data.auth_date) {
    throw new DataNotFoundError('Telegram auth_date is not found');
  }
  if (!data.hash) {
    throw new InvalidInputError('Telegram hash is not found');
  }
  if (hash !== data.hash) {
    throw new InvalidInputError('Telegram hash does not match');
  }

  const authDate = parseInt(data.auth_date, 10);
  const currentTime = Math.floor(Date.now() / 1000);
  const expiresIn = options?.expiresIn ?? 86400; // Default to 24 hours if not provided

  if (currentTime - authDate > expiresIn) {
    throw new InvalidInputError('Invalid telegram data: auth_date is too old');
  }

  const response: WebAppInitData = {
    query_id: data.query_id,
    auth_date: authDate * 1000,
    hash: data.hash,
    user: data.user
      ? {
          ...JSON.parse(data.user)
        }
      : undefined,
    receiver: data.receiver
      ? {
          ...JSON.parse(data.receiver)
        }
      : undefined,
    start_param: data.start_param,
    can_send_after: data.can_send_after ? parseInt(data.can_send_after) : undefined,
    chat: data.chat
      ? {
          ...JSON.parse(data.chat)
        }
      : undefined,
    chat_type: (data.chat_type as WebAppInitData['chat_type']) || undefined,
    chat_instance: data.chat_instance || undefined
  };

  return response;
}

import { GET } from '@root/adapters/http';

import { TELEGRAM_BOT_TOKEN } from './config';

type Result<T = unknown> = { ok: boolean; result?: T; description?: string };

// https://api.telegram.org/bot<token>/METHOD_NAME
const baseApiUrl = 'https://api.telegram.org';
const baseBotUrl = `${baseApiUrl}/bot${TELEGRAM_BOT_TOKEN}`;
const baseFileUrl = `${baseApiUrl}/file/bot${TELEGRAM_BOT_TOKEN}`;

export function getFilePath(path: string) {
  return `${baseFileUrl}/${path}`;
}

export async function getUserProfilePhotos(data: { user_id: number; offser?: number; limit?: number }) {
  return GET<Result<{ total_count: number; photos: { file_id: string }[][] }>>(
    `${baseBotUrl}/getUserProfilePhotos`,
    data
  );
}

export async function getFile(data: { file_id: string }) {
  return GET<Result<{ file_id: string; file_path?: string }>>(`${baseBotUrl}/getFile`, data);
}

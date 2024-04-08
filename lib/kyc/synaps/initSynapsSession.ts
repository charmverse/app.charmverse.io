import { POST } from '@charmverse/core/http';

import { synapsUrl } from '../config';

import type { SynapsSession } from './interfaces';

export async function initSynapsSession({ userId, apiKey }: { userId: string; apiKey: string }) {
  return POST<SynapsSession>(`${synapsUrl}/session/init`, { alias: userId }, { headers: { 'Api-Key': apiKey } });
}

import { GET } from '@charmverse/core/http';

import { synapsUrl } from '../config';

import type { SynapsIndividualSession } from './interfaces';

export async function getSynapsIndividualSession({ sessionId, apiKey }: { sessionId: string; apiKey: string }) {
  return GET<SynapsIndividualSession>(`${synapsUrl}/individual/session/${sessionId}`, undefined, {
    headers: { 'Api-Key': apiKey }
  });
}

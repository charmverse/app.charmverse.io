import { POST } from '@charmverse/core/http';

import { personaUrl, personaVersion } from '../config';

import type { PersonaInquiryAPIResponse } from './interfaces';

export async function initPersonaSession({ userId, apiKey }: { userId: string; apiKey: string }) {
  return POST<PersonaInquiryAPIResponse>(
    `${personaUrl}/inquiries`,
    {
      meta: {
        'auto-create-account': true,
        'auto-create-account-reference-id': userId
      }
    },
    {
      headers: { 'persona-version': personaVersion, Authorization: `Bearer ${apiKey}` }
    }
  );
}

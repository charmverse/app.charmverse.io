import { GET } from '@charmverse/core/http';

import { personaUrl, personaVersion } from '../config';

import type { PersonaInquiry } from './interfaces';

export async function getPersonaIndividualSession({ apiKey, userId }: { apiKey: string; userId: string }) {
  return GET<PersonaInquiry>(
    `${personaUrl}/inquiries`,
    { 'filter[reference-id]': userId },
    {
      headers: { 'persona-version': personaVersion, Authorization: `Bearer ${apiKey}` }
    }
  );
}

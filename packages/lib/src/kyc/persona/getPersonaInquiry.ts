import { GET } from '@packages/core/http';

import { personaUrl, personaVersion } from '../config';

import type { PersonaInquiryAPIResponse } from './interfaces';

export async function getPersonaInquiryData({ apiKey, inquiryId }: { apiKey: string; inquiryId: string }) {
  return GET<PersonaInquiryAPIResponse>(
    `${personaUrl}/inquiries`,
    { 'inquiry-id': inquiryId },
    {
      headers: { 'persona-version': personaVersion, Authorization: `Bearer ${apiKey}` }
    }
  );
}

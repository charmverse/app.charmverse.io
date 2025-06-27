import { POST } from '@packages/core/http';

import { personaUrl, personaVersion } from '../config';

import type { PersonaInquiryAPIResponse } from './interfaces';

export async function initPersonaInquiry({
  userId,
  apiKey,
  templateId
}: {
  userId: string;
  apiKey: string;
  templateId: string;
}) {
  const resp = await POST<PersonaInquiryAPIResponse>(
    `${personaUrl}/inquiries`,
    {
      data: {
        attributes: {
          'inquiry-template-id': templateId
        }
      },
      meta: {
        'auto-create-account': true,
        'auto-create-account-reference-id': userId
      }
    },
    {
      headers: { 'Persona-Version': personaVersion, authorization: `Bearer ${apiKey}` }
    }
  );

  return resp;
}

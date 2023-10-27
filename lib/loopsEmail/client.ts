import { GET, POST } from '@charmverse/core/http';
import type { User } from '@charmverse/core/prisma';
import { RateLimit } from 'async-sema';

// Loop manages onboarding emails
// Visit the dashboard: https://app.loops.so/settings?page=api

const apiBaseUrl = 'https://app.loops.so/api/v1';
// 10 requests/second - https://loops.so/docs/api
const rateLimiter = RateLimit(10);

export type LoopsUser = {
  firstName: string;
  email: string;
  createdAt: string;
  // custom properties
  spaceName: string;
  spaceTemplate?: string;
  spaceRole: 'Admin' | 'Member';
  source: 'Web App'; // TODO: what should this be?
};

export type UserFields = Pick<User, 'createdAt' | 'email' | 'username'>;

const apiToken = process.env.LOOPS_EMAIL_API_KEY as string | undefined;

export const isEnabled = !!apiToken;

const headers = {
  Authorization: apiToken ? `Bearer ${apiToken}` : null
};

// for testing api keys
export function testApiKey() {
  return GET<{ success: true }>(`${apiBaseUrl}/api-key`, null, { headers });
}

type CreateContactResponse = {
  success: boolean;
  id: string; // user id
  status?: 409; // 409 means already exists
};

// Loop API
export async function createContact(payload: LoopsUser) {
  await rateLimiter();
  return POST<CreateContactResponse>(`${apiBaseUrl}/contacts/create`, payload, {
    headers
  });
}

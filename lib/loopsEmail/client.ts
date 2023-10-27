import { GET, POST, PUT } from '@charmverse/core/http';
import type { User } from '@charmverse/core/prisma';
import { RateLimit } from 'async-sema';

// Loop manages onboarding emails
// Visit the dashboard: https://app.loops.so/settings?page=api
// API docs: https://loops.so/docs/api

const apiBaseUrl = 'https://app.loops.so/api/v1';
// 10 requests/second - https://loops.so/docs/api
const rateLimiter = RateLimit(10);

export type LoopsUser = {
  id: string;
  firstName: string;
  email: string;
  createdAt: string;
  // custom properties
  spaceName: string;
  spaceTemplate?: string;
  spaceRole: 'Admin' | 'Member';
  source: 'Web App'; // TODO: what should this be?
  subscribed?: boolean;
  // fields we dont use
  // lastName?: null;
  // userGroup?: string;
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

export async function createContact(payload: Omit<LoopsUser, 'id'>) {
  await rateLimiter();
  return POST<CreateContactResponse>(`${apiBaseUrl}/contacts/create`, payload, {
    headers
  });
}

type UpdateContactResponse = {
  success: boolean;
  id: string; // user id
};
// Note, this endpoint will create a user if they don't already exist
export async function updateContact(payload: { userId: string; email: string; subscribed: boolean }) {
  await rateLimiter();
  return PUT<UpdateContactResponse>(`${apiBaseUrl}/contacts/update`, payload, {
    headers
  });
}

export async function findContact(payload: { email: string }) {
  await rateLimiter();
  return GET<LoopsUser[]>(`${apiBaseUrl}/contacts/find`, payload, {
    headers
  });
}

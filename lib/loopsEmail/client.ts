import { GET, POST, PUT } from '@charmverse/core/http';
import { RateLimit } from 'async-sema';

// Loop manages onboarding emails
// Visit the dashboard: https://app.loops.so/settings?page=api
// API docs: https://loops.so/docs/api

const apiBaseUrl = 'https://app.loops.so/api/v1';
const apiToken = process.env.LOOPS_EMAIL_API_KEY as string | undefined;
export const isEnabled = !!apiToken;

// 10 requests/second - https://loops.so/docs/api
const rateLimiter = RateLimit(10);

// these properties can be sent as part of events but will be applied to the LoopUser profile
export type SignupEventProperties = {
  spaceName: string;
  spaceTemplate?: string;
  spaceRole: 'Admin' | 'Member';
};

export type SignupEvent = {
  email: string;
  eventName: 'signup';
} & SignupEventProperties;

export type LoopsUser = {
  id: string;
  firstName: string;
  email: string;
  createdAt: string;
  source: 'Web App'; // TODO: what should this be?
  subscribed?: boolean;
} & Partial<SignupEventProperties>;

const headers = {
  Authorization: `Bearer ${apiToken}`
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

export async function updateContact(payload: Omit<LoopsUser, 'id'>) {
  await rateLimiter();
  return PUT<UpdateContactResponse>(`${apiBaseUrl}/contacts/update`, payload, {
    headers
  });
}

// Note: teh docs say that update will create a user if they don't exist, but it doesn't seem to work
export async function createOrUpdateContact(payload: Omit<LoopsUser, 'id'>) {
  const [existing] = await findContact(payload);
  const result = await (existing ? updateContact(payload) : createContact(payload));
  return { ...result, isNewContact: !existing };
}

// when a user deletes their email, delete them from Loops as well
export async function deleteContact(payload: { email: string }) {
  await rateLimiter();
  return POST<{ success: boolean }>(`${apiBaseUrl}/contacts/delete`, payload, {
    headers
  });
}

export async function findContact(payload: { email: string }) {
  await rateLimiter();
  return GET<LoopsUser[]>(`${apiBaseUrl}/contacts/find`, payload, {
    headers
  });
}

export async function sendEvent<T extends { email: string; eventName: SignupEvent['eventName'] }>(payload: T) {
  await rateLimiter();
  return POST<{ success: boolean }>(`${apiBaseUrl}/events/send`, payload, {
    headers
  });
}

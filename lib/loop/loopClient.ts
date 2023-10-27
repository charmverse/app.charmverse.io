import { GET, POST } from '@charmverse/core/http';
import type { Space, User } from '@charmverse/core/prisma';
import { RateLimit } from 'async-sema';

import { stringToHumanFormat } from 'lib/metrics/mixpanel/utils';

// Loop manages onboarding emails
// Visit the dashboard: https://app.loops.so/settings?page=api

const apiBaseUrl = 'https://api.loops.so/api/v1';
// 10 requests/second - https://loops.so/docs/api
const rateLimiter = RateLimit(10);

export interface LoopUser {
  firstName: string;
  email: string;
  createdAt: string;
  // custom properties
  spaceName: string;
  spaceTemplate?: string;
  spaceRole: 'Admin' | 'Member';
  source: 'Web App'; // TODO: what should this be?
}

const apiToken = process.env.LOOP_EMAILS_API_KEY as string | undefined;

const headers = {
  Authorization: apiToken ? `Bearer ${apiToken}` : null
};

// for testing api keys
export function testApiKey() {
  return GET<{ success: true }>(`${apiBaseUrl}/api-key`, null, { headers });
}

export async function registerLoopUser({
  space,
  spaceTemplate,
  isAdmin,
  user
}: {
  space: Space;
  spaceTemplate?: string;
  isAdmin: boolean;
  user: User;
}) {
  if (!apiToken) {
    return;
  }
  const payload: LoopUser = {
    ...userToLoopUser(user),
    source: 'Web App',
    spaceRole: isAdmin ? 'Admin' : 'Member',
    spaceName: space.name,
    spaceTemplate: spaceTemplate ? stringToHumanFormat(spaceTemplate) : undefined
  };
  await rateLimiter();
  return POST(`${apiBaseUrl}/contacts/create`, payload, {
    headers
  });
}

function userToLoopUser(user: User): Pick<LoopUser, 'email' | 'createdAt' | 'firstName'> {
  if (!user.email) {
    throw new Error('User does not have an email');
  }
  return {
    firstName: user.username,
    email: user.email,
    createdAt: user.createdAt.toISOString()
  };
}

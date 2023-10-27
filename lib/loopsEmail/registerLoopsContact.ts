import type { User } from '@charmverse/core/prisma';

import type { LoopsUser } from './client';
import { isEnabled, updateContact } from './client';

type UserFields = Pick<User, 'createdAt' | 'email' | 'username' | 'emailNewsletter'>;

// Creates a user if one does not exist
// Call this whenever a user toggles subscriptions, ie. "emailNewsletter", or update their email
export async function registerLoopsContact(user: UserFields) {
  if (!isEnabled) {
    return { success: false };
  }
  return updateContact({
    ...getLoopsUser(user),
    source: 'Web App'
  });
}

function getLoopsUser(user: UserFields): Pick<LoopsUser, 'email' | 'createdAt' | 'firstName' | 'subscribed'> {
  if (!user.email) {
    throw new Error('User does not have an email');
  }
  return {
    firstName: user.username,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    subscribed: !!user.emailNewsletter
  };
}

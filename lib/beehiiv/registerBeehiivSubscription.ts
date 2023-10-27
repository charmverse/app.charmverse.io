import type { User } from '@charmverse/core/prisma';

import { isEnabled, createSubscription, unsubscribeSubscription } from './client';

type UserFields = Pick<User, 'email' | 'emailNewsletter'>;

// Creates a user if one does not exist
// Call this whenever a user toggles subscriptions, ie. "emailNewsletter", or update their email
export async function registerBeehiivSubscription(user: UserFields) {
  if (!isEnabled) {
    return;
  }
  if (!user.email) {
    throw new Error('User does not have an email');
  }
  if (user.emailNewsletter) {
    return createSubscription({
      email: user.email!,
      reactivate_existing: true
    });
  } else {
    return unsubscribeSubscription({ email: user.email });
  }
}

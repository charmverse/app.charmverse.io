import type { BeehiivSubscription } from './client';
import { isEnabled, createSubscription } from './client';

// Creates a user if one does not exist
// Call this whenever a user toggles subscriptions, ie. "emailNewsletter", or update their email
export async function registerBeehiivSubscription(user: BeehiivSubscription) {
  if (!isEnabled) {
    return { success: false, isNewContact: false };
  }
  return createSubscription({
    ...user,
    reactivate_existing: true
  });
}

import { stringToHumanFormat } from '@packages/metrics/mixpanel/utils';

import type { SignupEvent } from './client';
import { isEnabled, sendEvent } from './client';

// Create a user if one does not exist
export async function sendSignupEvent({
  email,
  isAdmin,
  spaceName,
  spaceTemplate
}: {
  email: string;
  isAdmin: boolean;
  spaceName: string;
  spaceTemplate?: string;
}) {
  if (!isEnabled) {
    return { success: false };
  }
  const event: SignupEvent = {
    email,
    eventName: 'signup',
    spaceName,
    spaceRole: isAdmin ? 'Admin' : 'Member',
    spaceTemplate: spaceTemplate ? stringToHumanFormat(spaceTemplate) : undefined
  };
  return sendEvent(event);
}

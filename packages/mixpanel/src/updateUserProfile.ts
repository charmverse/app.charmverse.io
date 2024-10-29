import { POST } from '@charmverse/core/http';
import type { BuilderStatus } from '@charmverse/core/prisma';

import { getApiKey } from './mixpanel';

export type MixPanelUserProfile = {
  $name: string;
  $email: string | null;
  path: string;
  onboarded: boolean;
  'Agreed To TOS': boolean;
  'Enable Marketing': boolean;
  'Builder Status': BuilderStatus | null;
};

export function updateMixpanelUserProfile(userId: string, profile: Partial<MixPanelUserProfile>) {
  const apiKey = getApiKey();

  return POST('https://api.mixpanel.com/engage#profile-set', {
    $token: apiKey,
    $distinct_id: userId,
    $set: profile
  });
}

export function batchUpdateMixpanelUserProfiles(users: { userId: string; profile: Partial<MixPanelUserProfile> }[]) {
  const apiKey = getApiKey();

  return POST(
    'https://api.mixpanel.com/engage#profile-batch-update',
    users.map((user) => ({
      $token: apiKey,
      $distinct_id: user.userId,
      $set: user.profile
    }))
  );
}

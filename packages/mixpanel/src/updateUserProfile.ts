import { POST } from '@charmverse/core/http';

import { getApiKey } from './mixpanel';

type UserProfileUpdate = {
  $token: string;
  $distinct_id: string;
  $set: object;
};

export function updateUserProfile(userId: string, profile: object) {
  const apiKey = getApiKey();

  const userUpdate: UserProfileUpdate = {
    $token: apiKey,
    $distinct_id: userId,
    $set: profile
  };

  return POST('https://api.mixpanel.com/engage#profile-set', userUpdate);
}

import { getUserProfile } from '@packages/profile/getUser';

import { updateTrackUserProfile } from './updateTrackUserProfile';

export async function updateTrackUserProfileById(userId: string) {
  try {
    const user = await getUserProfile('id', userId);

    updateTrackUserProfile(user);
  } catch (e) {
    // Failed to update tracking profile
  }
}

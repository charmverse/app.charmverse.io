
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { getUserProfile } from 'lib/users/getUser';

export async function updateTrackUserProfileById (userId: string) {
  try {
    const user = await getUserProfile('id', userId);

    updateTrackUserProfile(user);
  }
  catch (e) {
    // Failed to update tracking profile
  }
}

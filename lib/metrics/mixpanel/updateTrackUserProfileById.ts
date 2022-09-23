import { updateTrackUserProfile } from 'lib/metrics/mixpanel/server';
import { getUserProfile } from 'lib/users/getUser';

export async function updateTrackUserProfileById (userId: string) {
  const user = await getUserProfile('id', userId);

  updateTrackUserProfile(user);
}

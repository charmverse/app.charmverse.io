import type { IdentityType } from '@charmverse/core/prisma';
import type { SignupAnalytics } from '@packages/metrics/mixpanel/interfaces/UserEvent';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfile } from '@packages/metrics/mixpanel/updateTrackUserProfile';
import type { LoggedInUser } from '@packages/profile/getUser';

export async function postUserCreate({
  user,
  identityType,
  signupAnalytics
}: {
  user: LoggedInUser;
  identityType: IdentityType;
  signupAnalytics: Partial<SignupAnalytics>;
}) {
  updateTrackUserProfile(user);
  trackUserAction('sign_up', { userId: user.id, identityType, ...signupAnalytics });
}

import type { IdentityType } from '@charmverse/core/prisma';
import type { SignupAnalytics } from '@root/lib/metrics/mixpanel/interfaces/UserEvent';
import { trackUserAction } from '@root/lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfile } from '@root/lib/metrics/mixpanel/updateTrackUserProfile';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import { processSignupReferral } from '@root/lib/users/processSignupReferral';

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

  if (signupAnalytics.referrerCode) {
    processSignupReferral({ code: signupAnalytics.referrerCode, userId: user.id });
  }
}

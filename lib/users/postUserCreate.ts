import type { IdentityType } from '@charmverse/core/prisma';

import type { SignupAnalytics } from 'lib/metrics/mixpanel/interfaces/UserEvent';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { processSignupReferral } from 'lib/users/processSignupReferral';
import type { LoggedInUser } from 'models';

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

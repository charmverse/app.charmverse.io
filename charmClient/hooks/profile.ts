import type { LoggedInUser } from 'models';
import type { EmailPreferences } from 'pages/api/profile/onboarding-email';

import { usePUT } from './helpers';

export function useSaveOnboardingEmail() {
  return usePUT<EmailPreferences, LoggedInUser>('/api/profile/onboarding-email');
}

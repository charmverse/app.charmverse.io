import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { redirect } from 'next/navigation';

import { OnboardingPage } from 'components/welcome/onboarding/OnboardingPage';

export default async function Onboarding() {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  if (user?.onboardedAt && user?.agreedToTermsAt) {
    redirect('/quests');
  }

  return <OnboardingPage />;
}

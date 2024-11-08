import { redirect } from 'next/navigation';

import { OnboardingPage } from 'components/welcome/onboarding/OnboardingPage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export default async function Onboarding() {
  const user = await getUserFromSession();

  if (user?.onboardedAt && user?.agreedToTermsAt) {
    redirect('/quests');
  }

  return <OnboardingPage />;
}

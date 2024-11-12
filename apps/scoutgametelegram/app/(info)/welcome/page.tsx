import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { redirect } from 'next/navigation';

import { WelcomePage } from 'components/welcome/WelcomePage';

export default async function Welcome() {
  const user = await getUserFromSession();

  if (user?.onboardedAt && user?.agreedToTermsAt) {
    redirect('/quests');
  }

  if (user && !user.agreedToTermsAt && !user.onboardedAt) {
    redirect('/onboarding');
  }

  return <WelcomePage />;
}

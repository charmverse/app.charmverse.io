import { redirect } from 'next/navigation';

import { WelcomePage } from 'components/welcome/WelcomePage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export default async function Welcome() {
  const user = await getUserFromSession();

  if (user?.onboardedAt && user?.agreedToTermsAt) {
    redirect('/quests');
  }

  if (!user?.agreedToTermsAt && !user?.onboardedAt) {
    redirect('/onboarding');
  }

  return <WelcomePage />;
}

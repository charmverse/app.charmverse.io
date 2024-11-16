import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { redirect } from 'next/navigation';

import { WelcomePage } from 'components/welcome/WelcomePage';

export default async function Welcome() {
  const user = await getUserFromSession();

  if (user?.onboardedAt && user?.agreedToTermsAt) {
    redirect('/scout');
  }

  return <WelcomePage />;
}

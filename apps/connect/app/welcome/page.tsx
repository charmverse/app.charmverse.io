import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { WelcomePage } from 'components/welcome/WelcomePage';
import { getUserProfile } from 'lib/profile/getUser';
import { getIronOptions } from 'lib/session/getIronOptions';
import type { SessionData } from 'lib/session/types';

export default async function Welcome() {
  const session = await getIronSession<SessionData>(cookies(), getIronOptions());
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/');
  }

  const user = await getUserProfile('id', userId);

  if (!user) {
    redirect('/');
  }

  if (user.connectOnboarded) {
    redirect('/profile');
  }

  return <WelcomePage user={user} />;
}

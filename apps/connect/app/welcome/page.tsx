import { redirect } from 'next/navigation';

import { WelcomePage } from 'components/welcome/WelcomePage';
import { getUserProfile } from 'lib/profile/getUser';
import { getSession } from 'lib/session/getSession';

export default async function Welcome() {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/');
  }

  const user = await getUserProfile('id', userId);

  if (!user) {
    redirect('/');
  }

  if (user.connectOnboarded) {
    redirect('/dashboard');
  }

  return <WelcomePage user={user} />;
}

import { redirect } from 'next/navigation';

import { HomePage } from 'components/home/HomePage';
import { LoginPage } from 'components/login/LoginPage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

// tell Next that this route loads dynamic data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getUserFromSession();
  if (!user) {
    return <LoginPage successPath='/welcome' />;
  }

  if (!user.onboarded) {
    redirect('/welcome/builder');
  }

  return <HomePage />;
}

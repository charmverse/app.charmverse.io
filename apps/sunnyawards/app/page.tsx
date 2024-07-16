import { redirect } from 'next/navigation';

import { HomePage } from 'components/home/HomePage';
import { getCurrentUserAction } from 'lib/profile/getCurrentUserAction';

// tell Next that this route loads dynamic data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getCurrentUserAction();

  if (user?.data) {
    redirect('/profile');
  }

  return <HomePage />;
}

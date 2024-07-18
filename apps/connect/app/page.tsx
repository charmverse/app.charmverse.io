import { redirect } from 'next/navigation';

import { HomePage } from 'components/home/HomePage';
import { getCurrentUser } from 'lib/actions/getCurrentUser';

// tell Next that this route loads dynamic data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getCurrentUser();

  if (user?.data) {
    redirect('/profile');
  }

  return <HomePage />;
}

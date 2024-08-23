import { getCurrentUser } from '@connect-shared/lib/profile/getCurrentUser';
import { redirect } from 'next/navigation';

import { HomePage } from 'components/home/HomePage';

// tell Next that this route loads dynamic data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/profile');
  }

  return <HomePage />;
}

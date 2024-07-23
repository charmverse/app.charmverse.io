import { redirect } from 'next/navigation';

import { HomePage } from 'components/home/HomePage';
import { getSession } from 'lib/session/getSession';

// tell Next that this route loads dynamic data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();

  if (session?.user?.id) {
    redirect('/profile');
  }

  return <HomePage />;
}

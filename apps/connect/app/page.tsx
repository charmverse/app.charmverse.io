import { getSession } from '@connect-shared/lib/session/getSession';
import { redirect } from 'next/navigation';

import { HomePage } from 'components/home/HomePage';

// tell Next that this route loads dynamic data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();

  if (session?.user?.id) {
    redirect('/feed');
  }

  return <HomePage />;
}

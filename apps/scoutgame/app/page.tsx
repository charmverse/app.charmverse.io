import { redirect } from 'next/navigation';

import { HomePage } from 'components/home/HomePage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

// tell Next that this route loads dynamic data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getUserFromSession();

  return <HomePage user={user || null} />;
}

import { HomePage } from 'components/home/HomePage';
import { getSession } from 'lib/session/getSession';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();

  return <HomePage farcasterUser={session?.farcasterUser} />;
}

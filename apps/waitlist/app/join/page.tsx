import { HomePage } from 'components/home/HomePage';
import { getSession } from 'lib/session/getSession';

export default async function JoinWaitlistPage() {
  const session = await getSession();
  return <HomePage farcasterUser={session.farcasterUser} />;
}

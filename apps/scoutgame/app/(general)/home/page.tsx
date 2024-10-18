import { HomePage } from 'components/home/HomePage';
import { getCachedUserFromSession as getUserFromSession } from 'lib/session/getUserFromSession';

export default async function Home({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = searchParams.tab as string;
  const user = await getUserFromSession();

  return <HomePage user={user || null} tab={tab || 'leaderboard'} />;
}

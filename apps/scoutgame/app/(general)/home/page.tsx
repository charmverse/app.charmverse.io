import { HomePage } from 'components/home/HomePage';

export default async function Home({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = searchParams.tab as string;

  return <HomePage tab={tab || 'leaderboard'} />;
}

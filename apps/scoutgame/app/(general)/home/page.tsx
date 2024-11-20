import { HomePage } from 'components/home/HomePage';

export default async function Home({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = searchParams.tab as string | undefined;
  const week = searchParams.week as string | undefined;

  return <HomePage tab={tab || 'leaderboard'} week={week} />;
}

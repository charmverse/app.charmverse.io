import { ScoutPage } from 'components/scout/ScoutPage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export default async function Scout({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const sort = searchParams.sort as string;
  const user = await getUserFromSession();

  return <ScoutPage user={user || null} sort={sort || 'top'} />;
}

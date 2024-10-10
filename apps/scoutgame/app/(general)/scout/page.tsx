import { ScoutPage } from 'components/scout/ScoutPage';
import type { BuildersSort } from 'lib/builders/getSortedBuilders';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export default async function Scout({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const sortParam = searchParams.tab;
  const sort = (sortParam && typeof sortParam === 'string' ? sortParam : 'top') as BuildersSort;
  const user = await getUserFromSession();

  return <ScoutPage sort={sort} user={user} />;
}

import { GrantsListPage } from '@connect/components/grants/GrantsListPage';
import { getGrants } from '@connect/lib/grants/getGrants';

export default async function GrantsPage({
  searchParams
}: {
  searchParams: {
    sort: 'new' | 'upcoming';
  };
}) {
  const sort = searchParams.sort ?? 'new';
  const grants = await getGrants({
    sort
  });

  return <GrantsListPage grants={grants} currentTab={sort} />;
}

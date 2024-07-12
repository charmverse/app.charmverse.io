import { GrantsDetailsPage } from '@connect/components/grants/GrantsDetailsPage';
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

  return <GrantsDetailsPage grants={grants} currentTab={sort} />;
}

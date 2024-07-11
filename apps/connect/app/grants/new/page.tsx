import { GrantsDetailsPage } from '@connect/components/grants/GrantsDetailsPage';
import { getGrants } from '@connect/lib/grants/getGrants';

export default async function GrantsPage() {
  const grants = await getGrants({
    sort: 'new'
  });

  return <GrantsDetailsPage grants={grants} currentTab='new' />;
}

import { GrantsList } from 'components/grants/GrantsList';

export const dynamic = 'force-dynamic';

export default function GrantsPage({
  searchParams
}: {
  searchParams: {
    sort: 'new' | 'upcoming';
  };
}) {
  return <GrantsList sort={searchParams.sort ?? 'new'} />;
}

'use client';

import type { GetGrantsResponse, Grant } from '@connect-shared/lib/grants/getGrants';
import { GET } from '@root/adapters/http';
import { useCallback, useEffect, useRef, useState } from 'react';

import { GrantsListPageSkeleton } from 'components/grants/components/GrantsListPageSkeleton';
import { GrantsList } from 'components/grants/GrantsList';

export const dynamic = 'force-dynamic';

export default function GrantsPage({
  searchParams
}: {
  searchParams: {
    sort: 'new' | 'upcoming';
  };
}) {
  const sort = searchParams.sort ?? 'new';
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchItems = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    const data = await GET<GetGrantsResponse>('/api/grants', {
      sort,
      cursor,
      limit: 5
    });
    setGrants((prevGrants) => [...prevGrants, ...data.items]);
    setCursor(data.cursor);
    setLoading(false);
  }, [sort, cursor, loading]);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchItems();
      hasFetched.current = true;
    }
  }, []);

  if (loading && !grants.length) {
    return <GrantsListPageSkeleton />;
  }

  return (
    <GrantsList loading={loading} grants={grants} currentTab={sort} fetchMoreItems={fetchItems} hasMore={!!cursor} />
  );
}

'use client';

import type { GetGrantsResponse, Grant } from '@connect-shared/lib/grants/getGrants';
import { Button, CircularProgress, Stack } from '@mui/material';
import { GET } from '@root/adapters/http';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import { GrantsListPageSkeleton } from 'components/grants/components/GrantsListPageSkeleton';

import { GrantItem } from './components/GrantCard';

export function GrantsList({ sort }: { sort: 'new' | 'upcoming' }) {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchItems = ({ sort: _sort }: { sort: 'new' | 'upcoming' }) => {
    setLoading(true);
    GET<GetGrantsResponse>('/api/grants', {
      sort: _sort,
      cursor,
      limit: 5
    })
      .then((data) => {
        setGrants((prevGrants) => [...prevGrants, ...data.items]);
        setCursor(data.cursor);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchItems({ sort });
      hasFetched.current = true;
    }
  }, []);

  const lastItemRef = (node: HTMLElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && cursor) {
        fetchItems({ sort });
      }
    });
    if (node) observer.current.observe(node);
  };

  if (loading && !grants.length) {
    return <GrantsListPageSkeleton />;
  }

  return (
    <SinglePageWrapper>
      <Stack direction='row' gap={1} justifyContent='center'>
        <Button
          size='small'
          variant={sort === 'upcoming' ? 'contained' : 'outlined'}
          LinkComponent={Link}
          onClick={() => {
            setGrants([]);
            fetchItems({ sort: 'upcoming' });
          }}
          href='/grants?sort=upcoming'
        >
          Upcoming
        </Button>
        <Button
          size='small'
          variant={sort === 'new' ? 'contained' : 'outlined'}
          LinkComponent={Link}
          href='/grants?sort=new'
          onClick={() => {
            setGrants([]);
            fetchItems({ sort: 'new' });
          }}
        >
          New
        </Button>
      </Stack>
      <Stack gap={1} my={1}>
        {grants.map((grant, index) => (
          <Stack key={grant.id} ref={index === grants.length - 1 ? lastItemRef : null}>
            <GrantItem grant={grant} />
          </Stack>
        ))}
      </Stack>
      {loading && (
        <Stack alignItems='center' justifyContent='center'>
          <CircularProgress />
        </Stack>
      )}
    </SinglePageWrapper>
  );
}

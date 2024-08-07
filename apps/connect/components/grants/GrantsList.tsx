'use client';

import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import type { Grant } from '@connect-shared/lib/grants/getGrants';
import { Button, CircularProgress, Stack } from '@mui/material';
import Link from 'next/link';
import { useRef } from 'react';

import { GrantItem } from './components/GrantCard';

export function GrantsList({
  grants,
  currentTab,
  fetchMoreItems,
  loading,
  hasMore
}: {
  grants: Grant[];
  currentTab: 'new' | 'upcoming';
  fetchMoreItems: VoidFunction;
  loading: boolean;
  hasMore?: boolean;
}) {
  const observer = useRef<IntersectionObserver | null>(null);

  const lastItemRef = (node: HTMLElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMoreItems();
      }
    });
    if (node) observer.current.observe(node);
  };

  return (
    <PageWrapper>
      <Stack direction='row' gap={1} justifyContent='center'>
        <Button
          size='small'
          variant={currentTab === 'upcoming' ? 'contained' : 'outlined'}
          LinkComponent={Link}
          href='/grants?sort=upcoming'
        >
          Upcoming
        </Button>
        <Button
          size='small'
          variant={currentTab === 'new' ? 'contained' : 'outlined'}
          LinkComponent={Link}
          href='/grants?sort=new'
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
    </PageWrapper>
  );
}

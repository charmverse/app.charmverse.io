import { PageWrapper } from '@connect/components/common/PageWrapper';
import { Button, Stack } from '@mui/material';
import Link from 'next/link';

import { GrantItem } from './GrantItem';

export type Grant = {
  id: string;
  description: string;
  name: string;
  banner?: string;
  logo?: string;
  launchDate?: string;
  createdAt: string;
  applyLink?: string;
  path: string;
};

export function GrantsDetailsPage({ grants, currentTab }: { grants: Grant[]; currentTab: 'new' | 'upcoming' }) {
  return (
    <PageWrapper>
      <Stack direction='row' gap={1} justifyContent='center'>
        <Link href='/grants/upcoming'>
          <Button size='small' variant={currentTab === 'upcoming' ? 'contained' : 'outlined'}>
            Upcoming
          </Button>
        </Link>
        <Link href='/grants/new'>
          <Button size='small' variant={currentTab === 'new' ? 'contained' : 'outlined'}>
            New
          </Button>
        </Link>
      </Stack>
      <Stack gap={1} my={1}>
        {grants.map((grant) => (
          <GrantItem key={grant.id} grant={grant} />
        ))}
      </Stack>
    </PageWrapper>
  );
}

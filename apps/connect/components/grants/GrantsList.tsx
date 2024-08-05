import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { Button, Stack } from '@mui/material';
import Link from 'next/link';

import type { Grant } from 'lib/grants/getGrants';

import { GrantItem } from './components/GrantCard';

export function GrantsList({ grants, currentTab }: { grants: Grant[]; currentTab: 'new' | 'upcoming' }) {
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
        {grants.map((grant) => (
          <GrantItem key={grant.id} grant={grant} />
        ))}
      </Stack>
    </PageWrapper>
  );
}

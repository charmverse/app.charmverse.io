import type { Space } from '@charmverse/core/prisma';
import { Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { useMembers } from 'hooks/useMembers';
import { SubscriptionUsageRecord } from 'lib/subscription/utils';

import { PaymentForm } from './PaymentForm';

export function SubscriptionSettings({ space }: { space: Space }) {
  const { data: spaceSubscription = null, isLoading } = useSWR(`${space.id}-subscription`, () => {
    return charmClient.subscription.getSpaceSubscription({ spaceId: space.id });
  });

  const [updateSpaceSubscription, setUpdateSpaceSubscription] = useState(false);

  const { members } = useMembers();

  if (isLoading) {
    return <LoadingComponent label='Fetching your space subscription' />;
  }

  return (
    <Stack>
      {spaceSubscription === null ? (
        <Stack gap={1}>
          <Typography>Space not subscribed</Typography>
          {updateSpaceSubscription ? (
            <PaymentForm />
          ) : (
            <Button
              sx={{
                width: 'fit-content'
              }}
              onClick={() => setUpdateSpaceSubscription(true)}
            >
              Upgrade
            </Button>
          )}
        </Stack>
      ) : (
        <>
          <Typography variant='h6'>{spaceSubscription.tier}</Typography>
          <Typography variant='h6'>{spaceSubscription.period}</Typography>
          <Typography variant='h6'>Blocks: 0/{SubscriptionUsageRecord[spaceSubscription.usage].totalBlocks}</Typography>
          <Typography variant='h6'>
            Blocks: {members.length}/{SubscriptionUsageRecord[spaceSubscription.usage].totalActiveUsers}
          </Typography>
          <Button color='error'>Cancel</Button>
        </>
      )}
    </Stack>
  );
}

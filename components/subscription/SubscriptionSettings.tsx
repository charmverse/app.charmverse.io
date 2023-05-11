import type { Space } from '@charmverse/core/prisma';
import { Divider, InputLabel, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { capitalize } from 'lodash';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import Legend from 'components/settings/Legend';
import { useMembers } from 'hooks/useMembers';
import { SubscriptionUsageRecord } from 'lib/subscription/utils';

import { CheckoutForm } from './CheckoutForm';

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string;

const stripePromise = loadStripe(stripePublicKey);

export function SubscriptionSettings({ space }: { space: Space }) {
  const {
    data: spaceSubscription = null,
    isLoading,
    mutate: refetchSpaceSubscription
  } = useSWR(`${space.id}-subscription`, () => {
    return charmClient.subscription.getSpaceSubscription({ spaceId: space.id });
  });

  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  const { members } = useMembers();

  if (isLoading) {
    return <LoadingComponent label='Fetching your space subscription' />;
  }

  return (
    <Stack>
      <Stack gap={1}>
        <Legend variantMapping={{ inherit: 'div' }} whiteSpace='normal'>
          Space subscription
        </Legend>
        <Stack>
          <InputLabel>Current tier</InputLabel>
          <Typography>{capitalize(spaceSubscription?.tier ?? 'free')}</Typography>
        </Stack>
        {spaceSubscription?.period && (
          <Stack>
            <InputLabel>Period</InputLabel>
            <Typography>{capitalize(spaceSubscription.period)}</Typography>
          </Stack>
        )}
        {spaceSubscription?.usage && (
          <Stack>
            <InputLabel>Usage</InputLabel>
            <Stack>
              <Typography>Blocks: 0/{SubscriptionUsageRecord[spaceSubscription.usage].totalBlocks}</Typography>
              <Typography>
                Members: {members.length}/{SubscriptionUsageRecord[spaceSubscription.usage].totalActiveUsers}
              </Typography>
            </Stack>
          </Stack>
        )}
        <Divider sx={{ mb: 1 }} />
        {showCheckoutForm && stripePromise ? (
          <Elements stripe={stripePromise}>
            <CheckoutForm
              spaceSubscription={spaceSubscription}
              refetch={refetchSpaceSubscription}
              onCancel={() => setShowCheckoutForm(false)}
            />
          </Elements>
        ) : (
          <Stack flexDirection='row' gap={1}>
            <Button
              sx={{
                width: 'fit-content'
              }}
              onClick={() => setShowCheckoutForm(true)}
            >
              Upgrade
            </Button>
            {spaceSubscription !== null && (
              <Button
                onClick={() => {
                  setShowCheckoutForm(false);
                }}
                color='error'
                variant='outlined'
              >
                Cancel Plan
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}

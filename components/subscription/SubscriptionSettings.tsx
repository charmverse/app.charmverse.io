import type { Space } from '@charmverse/core/prisma';
import { InputLabel, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { Elements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { capitalize } from 'lodash';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import Legend from 'components/settings/Legend';
import { useMembers } from 'hooks/useMembers';
import { SubscriptionUsageRecord } from 'lib/subscription/utils';

import { CheckoutForm } from './CheckoutForm';

export function SubscriptionSettings({ space }: { space: Space }) {
  const { data: spaceSubscription = null, isLoading: isFetchingSpaceSubscription } = useSWR(
    `${space.id}-subscription`,
    () => {
      return charmClient.subscription.getSpaceSubscription({ spaceId: space.id });
    }
  );

  const { data: stripePublicKey, isLoading: isFetchingStripePublicKey } = useSWRImmutable(`stripe-public-key`, () => {
    return charmClient.subscription.getStripePublicKey();
  });

  const isLoading = isFetchingSpaceSubscription || isFetchingStripePublicKey;

  const [stripePromise, setStripePromise] = useState<PromiseLike<Stripe | null> | null>(null);

  useEffect(() => {
    if (stripePublicKey && stripePublicKey.publicKey) {
      setStripePromise(loadStripe(stripePublicKey.publicKey));
    }
  }, [stripePublicKey]);

  const [updateSpaceSubscription, setUpdateSpaceSubscription] = useState(false);

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
              <Typography>Blocks: 0 / {SubscriptionUsageRecord[spaceSubscription.usage].totalBlocks}</Typography>
              <Typography>
                Members: {members.length}/{SubscriptionUsageRecord[spaceSubscription.usage].totalActiveUsers}
              </Typography>
            </Stack>
          </Stack>
        )}

        {updateSpaceSubscription && stripePromise ? (
          <Elements stripe={stripePromise}>
            <CheckoutForm onCancel={() => setUpdateSpaceSubscription(false)} />
          </Elements>
        ) : (
          <Stack flexDirection='row' gap={1}>
            <Button
              sx={{
                width: 'fit-content'
              }}
              onClick={() => setUpdateSpaceSubscription(true)}
            >
              Upgrade
            </Button>
            {spaceSubscription !== null && (
              <Button
                onClick={() => {
                  setUpdateSpaceSubscription(false);
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

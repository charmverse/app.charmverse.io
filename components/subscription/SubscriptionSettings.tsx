import type { Space } from '@charmverse/core/prisma';
import { Divider, InputLabel, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { Elements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { capitalize } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import Legend from 'components/settings/Legend';
import { useMembers } from 'hooks/useMembers';
import { SUBSCRIPTION_USAGE_RECORD } from 'lib/subscription/constants';

import { CheckoutForm } from './CheckoutForm';

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string;

export function SubscriptionSettings({ space }: { space: Space }) {
  const stripePromise = useRef<Promise<Stripe | null>>(loadStripe(stripePublicKey));
  const {
    data: spaceSubscription = null,
    isLoading,
    mutate: refetchSpaceSubscription
  } = useSWR(`${space.id}-subscription`, () => {
    return charmClient.subscription.getSpaceSubscription({ spaceId: space.id });
  });

  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  const { members } = useMembers();

  useEffect(() => {
    charmClient.track.trackAction('view_subscription', {
      spaceId: space.id
    });
  }, []);

  function handleShowCheckoutForm() {
    setShowCheckoutForm(true);
    charmClient.track.trackAction('initiate_subscription', {
      spaceId: space.id
    });
  }

  if (isLoading) {
    return <LoadingComponent label='Fetching your space subscription' />;
  }

  return (
    <Stack>
      <Stack gap={1}>
        <Legend variantMapping={{ inherit: 'div' }} whiteSpace='normal'>
          {spaceSubscription === null ? 'Upgrade to Community' : 'Space subscription'}
        </Legend>
        <Typography>
          More blocks, user roles, guests, custom domains and more.{' '}
          <Link href='https://charmverse.io/pricing' target='_blank'>
            Read about all the benefits
          </Link>
        </Typography>
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
              <Typography>Blocks: 0/{SUBSCRIPTION_USAGE_RECORD[spaceSubscription.usage].totalBlocks}</Typography>
              <Typography>
                Members: {members.length}/{SUBSCRIPTION_USAGE_RECORD[spaceSubscription.usage].totalActiveUsers}
              </Typography>
            </Stack>
          </Stack>
        )}
        <Divider sx={{ mb: 1 }} />
        {showCheckoutForm && stripePromise.current ? (
          <Elements stripe={stripePromise.current}>
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
              onClick={handleShowCheckoutForm}
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

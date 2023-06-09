import type { Space } from '@charmverse/core/prisma';
import { useTheme } from '@emotion/react';
import { Divider } from '@mui/material';
import { Stack } from '@mui/system';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { inputBackground } from 'theme/colors';

import { CheckoutForm } from './CheckoutForm';
import { loadStripe } from './loadStripe';
import { SubscriptionActions } from './SubscriptionActions';
import { SubscriptionInformation } from './SubscriptionInformation';

export function SubscriptionSettings({ space }: { space: Space }) {
  const {
    data: spaceSubscription,
    isLoading,
    mutate: refetchSpaceSubscription
  } = useSWR(
    `${space.id}-subscription`,
    () => {
      return charmClient.subscription.getSpaceSubscription({ spaceId: space.id });
    },
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false
    }
  );

  const [showPlans, setShowPlans] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

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

  const theme = useTheme();

  const stripePromise = loadStripe();

  return (
    <Stack>
      <Stack gap={1}>
        <SubscriptionInformation space={space} spaceSubscription={spaceSubscription} isLoading={isLoading} />
        {!showCheckoutForm && (
          <SubscriptionActions spaceSubscription={spaceSubscription} onCreate={handleShowCheckoutForm} />
        )}
        <Divider sx={{ mb: 1 }} />
        {!isLoading && spaceSubscription !== undefined && showCheckoutForm && (
          <Elements
            stripe={stripePromise}
            options={{
              appearance: {
                variables: {
                  colorTextPlaceholder: theme.palette.text.disabled
                },
                rules: {
                  '.Label': {
                    color: theme.palette.text.secondary
                  },
                  '.Input:focus': {
                    boxShadow: `none`,
                    borderRadius: '2px',
                    border: `1px solid ${theme.palette.primary.main}`
                  },
                  '.Input': {
                    color: theme.palette.text.primary,
                    // hex code with opacity channel doesn't work
                    backgroundColor: theme.palette.mode === 'dark' ? '#252525' : inputBackground,
                    // css variable doesn't work
                    border: `1px solid ${
                      theme.palette.mode === 'dark' ? 'rgba(15, 15, 15, 0.2)' : 'rgba(15, 15, 15, 0.1)'
                    }`
                  }
                }
              }
            }}
          >
            <CheckoutForm
              spaceSubscription={spaceSubscription}
              refetch={refetchSpaceSubscription}
              onCancel={() => setShowCheckoutForm(false)}
            />
          </Elements>
        )}
      </Stack>
    </Stack>
  );
}

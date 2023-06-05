import type { Space } from '@charmverse/core/prisma';
import { useTheme } from '@emotion/react';
import { Divider, InputLabel, Skeleton, Tooltip, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { Elements } from '@stripe/react-stripe-js';
import { capitalize } from 'lodash';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import Link from 'components/common/Link';
import Legend from 'components/settings/Legend';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMembers } from 'hooks/useMembers';
import { SUBSCRIPTION_PRODUCTS_RECORD } from 'lib/subscription/constants';
import { inputBackground } from 'theme/colors';

import { CheckoutForm } from './CheckoutForm';
import { loadStripe } from './loadStripe';

export function SubscriptionSettings({ space }: { space: Space }) {
  const {
    data: spaceSubscription = null,
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

  const isAdmin = useIsAdmin();

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

  const theme = useTheme();

  const stripePromise = loadStripe();

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
        {isLoading ? (
          <Stack gap={1} mt={2}>
            <Skeleton variant='rectangular' width={150} height={16} />
            <Skeleton variant='rectangular' width='100%' height={55} />
            <Skeleton variant='rectangular' width={150} height={16} sx={{ mt: 1 }} />
            <Skeleton variant='rectangular' width='100%' height={35} />
          </Stack>
        ) : (
          <>
            <Stack>
              <InputLabel>Current tier</InputLabel>
              <Typography>{capitalize(space.paidTier)}</Typography>
            </Stack>
            {spaceSubscription?.period && (
              <Stack>
                <InputLabel>Period</InputLabel>
                <Typography>{capitalize(spaceSubscription.period)}</Typography>
              </Stack>
            )}
            {spaceSubscription?.productId && (
              <Stack>
                <InputLabel>Plan</InputLabel>
                <Stack>
                  <Typography>
                    Blocks: 0/{SUBSCRIPTION_PRODUCTS_RECORD[spaceSubscription.productId].blockLimit}
                  </Typography>
                  <Typography>
                    Members: {members.length}/
                    {SUBSCRIPTION_PRODUCTS_RECORD[spaceSubscription.productId].monthlyActiveUserLimit}
                  </Typography>
                </Stack>
              </Stack>
            )}
            <Divider sx={{ mb: 1 }} />
            {showCheckoutForm ? (
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
            ) : (
              <Stack flexDirection='row' gap={1}>
                {spaceSubscription === null && (
                  <Tooltip title={!isAdmin ? 'Only admin is able to upgrade space subscription' : ''}>
                    <div>
                      <Button
                        disabled={!isAdmin}
                        sx={{
                          width: 'fit-content'
                        }}
                        onClick={handleShowCheckoutForm}
                      >
                        Upgrade
                      </Button>
                    </div>
                  </Tooltip>
                )}
                {/* {spaceSubscription !== null && (
                  <Button
                    onClick={() => {
                      setShowCheckoutForm(false);
                    }}
                    color='error'
                    variant='outlined'
                  >
                    Cancel Plan
                  </Button>
                )} */}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Stack>
  );
}

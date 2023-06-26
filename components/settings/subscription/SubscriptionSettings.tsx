import type { Space } from '@charmverse/core/prisma';
import { useTheme } from '@emotion/react';
import { Stack, Typography } from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { useSnackbar } from 'hooks/useSnackbar';
import type { SubscriptionPeriod } from 'lib/subscription/constants';
import type { CreateProSubscriptionRequest } from 'lib/subscription/interfaces';

import Legend from '../Legend';

import { CheckoutForm } from './CheckoutForm';
import { CreateSubscriptionInformation } from './CreateSubscriptionInformation';
import { useSpaceSubscription } from './hooks/useSpaceSubscription';
import { LoadingSubscriptionSkeleton } from './LoadingSkeleton';
import { loadStripe } from './loadStripe';
import { PlanSelection } from './PlanSelection';
import { SubscriptionInformation } from './SubscriptionInformation';

export function SubscriptionSettings({ space }: { space: Space }) {
  const { showMessage } = useSnackbar();

  const { spaceSubscription, isLoading, refetchSpaceSubscription } = useSpaceSubscription();

  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  const {
    data: initialSubscriptionData,
    trigger: createSubscription,
    isMutating: isInitialSubscriptionLoading
  } = useSWRMutation(
    `/api/spaces/${space?.id}/subscription`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string; payload: CreateProSubscriptionRequest } }>) =>
      charmClient.subscription.createSubscription(arg.spaceId, arg.payload),
    {
      onError() {
        showMessage('Checkout failed! Please try again', 'error');
      },
      async onSuccess() {
        setShowCheckoutForm(true);
      }
    }
  );

  const { data: blockCountData } = useSWR(space.id ? `space-block-count-${space.id}` : null, () =>
    charmClient.spaces.getBlockCount({ spaceId: space.id })
  );

  const blockCount = blockCountData?.count || 0;

  const minimumBlockQuota = blockCount > 10000 ? Math.ceil(blockCount / 10000) * 10 : 10;

  const [period, setPeriod] = useState<SubscriptionPeriod>('annual');
  const [blockQuota, setBlockQuota] = useState(10);

  useEffect(() => {
    charmClient.track.trackAction('view_subscription', {
      spaceId: space.id
    });
  }, []);

  async function handleShowCheckoutForm() {
    if (minimumBlockQuota > blockQuota) {
      setBlockQuota(minimumBlockQuota);
    }

    setShowCheckoutForm(true);
    charmClient.track.trackAction('initiate_subscription', {
      spaceId: space.id
    });

    await createSubscription({
      spaceId: space.id,
      payload: { period, blockQuota: minimumBlockQuota > blockQuota ? minimumBlockQuota : blockQuota }
    });
  }

  const handlePlanSelect = (_blockQuota: number | null, _period: SubscriptionPeriod | null) => {
    if (_blockQuota) {
      setBlockQuota(minimumBlockQuota > _blockQuota ? minimumBlockQuota : _blockQuota);
    } else if (_period) {
      setPeriod(_period);
    }
  };

  const handlePlanSelectCommited = async (_blockQuota: number | null, _period: SubscriptionPeriod | null) => {
    if (_blockQuota) {
      await createSubscription({
        spaceId: space.id,
        payload: { blockQuota: minimumBlockQuota > _blockQuota ? minimumBlockQuota : _blockQuota, period }
      });
    } else if (_period) {
      await createSubscription({ spaceId: space.id, payload: { blockQuota, period: _period } });
    }
  };

  const handleCoupon = async (coupon: string) => {
    await createSubscription({
      spaceId: space.id,
      payload: { blockQuota, period, coupon }
    });
  };

  const theme = useTheme();

  const stripePromise = loadStripe();

  if (!showCheckoutForm) {
    return (
      <Stack gap={1}>
        {spaceSubscription && spaceSubscription.status !== 'free_trial' ? (
          <SubscriptionInformation
            space={space}
            spaceSubscription={spaceSubscription}
            refetchSpaceSubscription={refetchSpaceSubscription}
          />
        ) : (
          <CreateSubscriptionInformation onClick={handleShowCheckoutForm} spaceSubscription={spaceSubscription} />
        )}
      </Stack>
    );
  }

  return (
    <Stack gap={1}>
      <Legend>Upgrade to Community</Legend>
      <Typography variant='h6'>Onboard & Engage Community Members</Typography>
      <Typography>Comprehensive access control, roles, guests, custom domain, API access and more.</Typography>
      {!!blockCountData && (
        <PlanSelection
          disabled={isInitialSubscriptionLoading}
          onSelect={handlePlanSelect}
          onSelectCommited={handlePlanSelectCommited}
          blockQuotaInThousands={blockQuota}
          period={period}
        />
      )}
      {spaceSubscription !== undefined && initialSubscriptionData?.clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: initialSubscriptionData.clientSecret,
            appearance: {
              theme: theme.palette.mode === 'dark' ? 'night' : 'stripe'
            }
          }}
        >
          <CheckoutForm
            show={showCheckoutForm}
            blockQuota={blockQuota}
            period={period}
            subscription={initialSubscriptionData}
            handleCoupon={handleCoupon}
            refetch={refetchSpaceSubscription}
            onCancel={() => setShowCheckoutForm(false)}
            isLoading={isLoading || isInitialSubscriptionLoading}
          />
        </Elements>
      )}
    </Stack>
  );
}

import type { Space } from '@charmverse/core/prisma';
import { useTheme } from '@emotion/react';
import { Stack, Typography } from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { useSnackbar } from 'hooks/useSnackbar';
import type { SubscriptionPeriod } from 'lib/subscription/constants';
import type { CreateProSubscriptionRequest } from 'lib/subscription/interfaces';

import Legend from '../Legend';

import { CheckoutForm } from './CheckoutForm';
import { CreateSubscriptionInformation } from './CreateSubscriptionInformation';
import { EnterpriseBillingScreen } from './EnterpriseBillingScreen';
import { useBlockCount } from './hooks/useBlockCount';
import { useSpaceSubscription } from './hooks/useSpaceSubscription';
import { LoadingSubscriptionSkeleton } from './LoadingSkeleton';
import { loadStripe } from './loadStripe';
import { PlanSelection } from './PlanSelection';
import { SubscriptionInformation } from './SubscriptionInformation';

export function SubscriptionSettings({ space }: { space: Space }) {
  const { showMessage } = useSnackbar();

  const { spaceSubscription, isLoading: isLoadingSpaceSubscription, refetchSpaceSubscription } = useSpaceSubscription();

  const [pendingPayment, setPendingPayment] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  const { trigger: createSubscription, isMutating: isSubscriptionCreationLoading } = useSWRMutation(
    `/api/spaces/${space?.id}/subscription`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string; payload: CreateProSubscriptionRequest } }>) =>
      charmClient.subscription.createSubscription(arg.spaceId, arg.payload),
    {
      onError() {
        showMessage('Checkout failed! Please try again', 'error');
      }
    }
  );

  const { blockCount: blockCountData } = useBlockCount();

  const blockCount = blockCountData?.count || 0;

  const minimumBlockQuota = blockCount > 10000 ? Math.ceil(blockCount / 10000) * 10 : 10;

  const [period, setPeriod] = useState<SubscriptionPeriod>('annual');
  const [blockQuota, setBlockQuota] = useState(10);

  useEffect(() => {
    charmClient.track.trackAction('page_view', {
      spaceId: space.id,
      type: 'billing/settings'
    });
  }, []);

  useEffect(() => {
    // Ensure that we remove the pending screen after the subscription is created
    if (pendingPayment && spaceSubscription) {
      setPendingPayment(false);
    }
  }, [spaceSubscription, pendingPayment]);

  async function handleShowCheckoutForm() {
    if (minimumBlockQuota > blockQuota) {
      setBlockQuota(minimumBlockQuota);
    }

    setShowCheckoutForm(true);
  }

  const handlePlanSelect = (_blockQuota: number | null, _period: SubscriptionPeriod | null) => {
    if (_blockQuota) {
      setBlockQuota(minimumBlockQuota > _blockQuota ? minimumBlockQuota : _blockQuota);
    } else if (_period) {
      setPeriod(_period);
    }
  };

  const theme = useTheme();

  const stripePromise = loadStripe();

  const handleCreateSubscription = async (args: { spaceId: string; payload: CreateProSubscriptionRequest }) => {
    return createSubscription(args);
  };

  if (space.paidTier === 'enterprise') {
    return <EnterpriseBillingScreen />;
  }

  if (!showCheckoutForm) {
    return (
      <Stack gap={1}>
        {isLoadingSpaceSubscription ? (
          <LoadingSubscriptionSkeleton isLoading={isLoadingSpaceSubscription} />
        ) : pendingPayment && (!spaceSubscription || spaceSubscription.status === 'free_trial') ? (
          <Typography>
            Your payment is being processed. This screen will be automatically updated as soon as the process is
            complete.
          </Typography>
        ) : spaceSubscription && spaceSubscription.status !== 'free_trial' ? (
          <SubscriptionInformation
            minimumBlockQuota={minimumBlockQuota}
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
          disabled={isSubscriptionCreationLoading}
          onSelect={handlePlanSelect}
          blockQuotaInThousands={blockQuota}
          period={period}
        />
      )}
      <Elements
        stripe={stripePromise}
        options={{
          appearance: {
            theme: theme.palette.mode === 'dark' ? 'night' : 'stripe'
          }
        }}
      >
        <CheckoutForm
          space={space}
          blockQuota={blockQuota}
          period={period}
          handlePending={() => setPendingPayment(true)}
          onCloseCheckout={() => setShowCheckoutForm(false)}
          handleCreateSubscription={handleCreateSubscription}
        />
      </Elements>
    </Stack>
  );
}

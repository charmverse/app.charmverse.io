import type { Space } from '@charmverse/core/prisma';
import { useTheme } from '@emotion/react';
import { Stack, Typography } from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { useTrackPageView } from 'charmClient/hooks/track';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSessionStorage } from 'hooks/useSessionStorage';
import { useSnackbar } from 'hooks/useSnackbar';
import type { SubscriptionPeriod } from '@packages/lib/subscription/constants';
import type { CreateProSubscriptionRequest } from '@packages/lib/subscription/interfaces';

import Legend from '../components/Legend';

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
  const isAdmin = useIsAdmin();

  const { spaceSubscription, isLoading: isLoadingSpaceSubscription, refetchSpaceSubscription } = useSpaceSubscription();

  const [pendingPayment, setPendingPayment] = useSessionStorage<boolean>(`pending-payment-${space.id}`, false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  const { trigger: createSubscription, isMutating: isSubscriptionCreationLoading } = useSWRMutation(
    `/api/spaces/${space.id}/subscription`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string; payload: CreateProSubscriptionRequest } }>) =>
      charmClient.subscription.createSubscription(arg.spaceId, arg.payload),
    {
      onError() {
        showMessage('Checkout failed! Please try again', 'error');
      }
    }
  );

  const { count: blockCount, data: blockCountData } = useBlockCount();

  const minimumBlockQuota = blockCount > 10000 ? Math.ceil(blockCount / 10000) * 10 : 10;

  const [period, setPeriod] = useState<SubscriptionPeriod>('annual');
  const [blockQuota, setBlockQuota] = useState(10);

  useTrackPageView({ type: 'billing/settings' });

  useEffect(() => {
    // Ensure that we remove the pending screen after the subscription is created
    if (pendingPayment && spaceSubscription?.id && spaceSubscription?.status === 'active') {
      setPendingPayment(false);
    }
  }, [spaceSubscription?.id, spaceSubscription?.status, pendingPayment]);

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

  if (!isAdmin) {
    return <Typography>Please talk to an administrator about this space.</Typography>;
  }

  if (space.paidTier === 'enterprise') {
    return <EnterpriseBillingScreen />;
  }

  if (!showCheckoutForm) {
    return (
      <Stack gap={1}>
        {isLoadingSpaceSubscription ? (
          <LoadingSubscriptionSkeleton isLoading={isLoadingSpaceSubscription} />
        ) : spaceSubscription && !!spaceSubscription.status ? (
          <SubscriptionInformation
            minimumBlockQuota={minimumBlockQuota}
            space={space}
            spaceSubscription={spaceSubscription}
            refetchSpaceSubscription={refetchSpaceSubscription}
          />
        ) : (
          <CreateSubscriptionInformation
            pendingPayment={pendingPayment || false}
            onUpgrade={handleShowCheckoutForm}
            spaceId={space.id}
          />
        )}
      </Stack>
    );
  }

  return (
    <Stack gap={1}>
      <Legend mb={1}>Upgrade to Community</Legend>
      <Typography>
        Community Edition includes comprehensive access control, roles, guests, custom domain, API access and more.
      </Typography>
      {!!blockCountData && (
        <PlanSelection
          disabled={isSubscriptionCreationLoading}
          onSelect={handlePlanSelect}
          blockQuotaInThousands={blockQuota}
          period={period}
          hideSelection
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

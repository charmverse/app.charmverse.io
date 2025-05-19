import type { Space } from '@charmverse/core/prisma';
import { useTheme } from '@emotion/react';
import { Stack, Typography } from '@mui/material';
import type { SubscriptionPeriod } from '@packages/lib/subscription/constants';
import type { CreateProSubscriptionRequest } from '@packages/lib/subscription/interfaces';
import { RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { useTrackPageView } from 'charmClient/hooks/track';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

import { EnterpriseBillingScreen } from './components/EnterpriseBillingScreen';
import { CancelSubscriptionModal } from './components/modals/CancelSubscriptionModal';
import { DowngradeSubscriptionModal } from './components/modals/DowngradeSubscriptionModal';
import { ReactivateSubscriptionModal } from './components/modals/ReactivateSubscriptionModal';
import { SpaceContributionForm } from './components/SpaceContributionForm';
import { SpaceSubscriptionReceiptsList } from './components/SpaceSubscriptionReceipts';
import { SubscriptionHeader } from './components/SubscriptionHeader';
import { SubscriptionTiers } from './components/SubscriptionTiers';
import { useSpaceSubscription } from './hooks/useSpaceSubscription';
import { SpaceSubscriptionUpgradeForm } from './SpaceSubscription/SpaceSubscriptionUpgradeForm';

import '@rainbow-me/rainbowkit/styles.css';

export function SubscriptionSettings({ space }: { space: Space }) {
  const { showMessage } = useSnackbar();
  const { refreshCurrentSpace } = useCurrentSpace();

  const { data: spaceTokenBalance = 0, mutate: refreshSpaceTokenBalance } = useSWR(
    space ? `space-token-balance/${space.id}` : null,
    () => (space ? charmClient.spaces.getSpaceTokenBalance(space.id) : 0)
  );

  const { data: subscriptionReceipts = [], mutate: refreshSubscriptionReceipts } = useSWR(
    space ? `space-receipts/${space.id}` : null,
    () => (space ? charmClient.subscription.getSubscriptionReceipts(space.id) : [])
  );
  const [isSendDevModalOpen, setIsSendDevModalOpen] = useState(false);
  const [isSpaceTierPurchaseModalOpen, setIsSpaceTierPurchaseModalOpen] = useState(false);
  const [isCancelSubscriptionModalOpen, setIsCancelSubscriptionModalOpen] = useState(false);
  const [isReactivateSubscriptionModalOpen, setIsReactivateSubscriptionModalOpen] = useState(false);
  const [isDowngradeSubscriptionModalOpen, setIsDowngradeSubscriptionModalOpen] = useState(false);

  const { data: subscriptionEvents = [], mutate: refreshSubscriptionEvents } = useSWR(
    space ? `space-subscription-events/${space.id}` : null,
    () => (space ? charmClient.subscription.getSubscriptionEvents(space.id) : [])
  );
  const { spaceSubscription, isLoading: isLoadingSpaceSubscription, refetchSpaceSubscription } = useSpaceSubscription();

  useTrackPageView({ type: 'billing/settings' });

  function handleShowCheckoutForm() {}

  if (space.paidTier === 'enterprise' || space.subscriptionTier === 'grant') {
    return <EnterpriseBillingScreen />;
  }

  return (
    <RainbowKitProvider>
      <Stack gap={1}>
        <SubscriptionHeader
          spaceTokenBalance={spaceTokenBalance}
          subscriptionEvents={subscriptionEvents}
          onClickSendDev={() => setIsSendDevModalOpen(true)}
          onClickUpgrade={() => setIsSpaceTierPurchaseModalOpen(true)}
        />
        <SubscriptionTiers spaceId={space.id} />
        <SpaceSubscriptionReceiptsList subscriptionReceipts={subscriptionReceipts} />
      </Stack>
      <SpaceContributionForm
        isOpen={isSendDevModalOpen}
        onClose={() => setIsSendDevModalOpen(false)}
        onSuccess={() => {
          refreshSubscriptionReceipts();
          refreshSpaceTokenBalance();
        }}
      />
      <SpaceSubscriptionUpgradeForm
        isOpen={isSpaceTierPurchaseModalOpen}
        onClose={() => setIsSpaceTierPurchaseModalOpen(false)}
        spaceTokenBalance={spaceTokenBalance}
        onSuccess={() => {
          refreshSubscriptionReceipts();
          refreshSpaceTokenBalance();
          setIsSpaceTierPurchaseModalOpen(false);
        }}
      />
      <CancelSubscriptionModal
        isOpen={isCancelSubscriptionModalOpen}
        onClose={() => setIsCancelSubscriptionModalOpen(false)}
        onSuccess={() => {
          refreshCurrentSpace();
          setIsCancelSubscriptionModalOpen(false);
        }}
      />
      <DowngradeSubscriptionModal
        isOpen={isDowngradeSubscriptionModalOpen}
        onClose={() => setIsDowngradeSubscriptionModalOpen(false)}
        onSuccess={() => {
          refreshCurrentSpace();
          refreshSubscriptionEvents();
          setIsDowngradeSubscriptionModalOpen(false);
        }}
      />
      <ReactivateSubscriptionModal
        isOpen={isReactivateSubscriptionModalOpen}
        onClose={() => setIsReactivateSubscriptionModalOpen(false)}
        onSuccess={() => {
          refreshCurrentSpace();
          setIsReactivateSubscriptionModalOpen(false);
        }}
      />
    </RainbowKitProvider>
  );
}

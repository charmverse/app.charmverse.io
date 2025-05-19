import type { Space, SpaceSubscriptionTier } from '@charmverse/core/prisma';
import { Stack, Typography } from '@mui/material';
import type { UpgradableTier } from '@packages/lib/subscription/calculateSubscriptionCost';
import { RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useTrackPageView } from 'charmClient/hooks/track';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

import { EnterpriseBillingScreen } from './components/EnterpriseBillingScreen';
import { CancelSubscriptionModal } from './components/modals/CancelSubscriptionModal';
import { ConfirmFreeDowngradeModal } from './components/modals/ConfirmFreeDowngradeModal';
import { DowngradeSubscriptionModal } from './components/modals/DowngradeSubscriptionModal';
import { ReactivateSubscriptionModal } from './components/modals/ReactivateSubscriptionModal';
import { SpaceSubscriptionUpgradeForm } from './components/modals/SpaceSubscriptionUpgradeForm';
import { SpaceContributionForm } from './components/SpaceContributionForm';
import { SpaceSubscriptionReceiptsList } from './components/SpaceSubscriptionReceipts';
import { SubscriptionHeader } from './components/SubscriptionHeader';
import { SubscriptionTiers } from './components/SubscriptionTiers';
import { useSpaceSubscription } from './hooks/useSpaceSubscription';

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
  const [isSpaceTierPurchaseModalOpen, setIsSpaceTierPurchaseModalOpen] = useState<UpgradableTier | null>(null);
  const [isCancelSubscriptionModalOpen, setIsCancelSubscriptionModalOpen] = useState(false);
  const [isReactivateSubscriptionModalOpen, setIsReactivateSubscriptionModalOpen] = useState(false);
  const [isDowngradeSubscriptionModalOpen, setIsDowngradeSubscriptionModalOpen] = useState(false);

  const { data: subscriptionEvents = [], mutate: refreshSubscriptionEvents } = useSWR(
    space ? `space-subscription-events/${space.id}` : null,
    () => (space ? charmClient.subscription.getSubscriptionEvents(space.id) : [])
  );

  const {
    isOpen: isConfirmDowngradeDialogOpen,
    close: closeConfirmFreeTierDowngradeDialog,
    open: openConfirmFreeTierDowngradeDialog
  } = usePopupState({ variant: 'popover', popupId: 'susbcription-actions' });

  const { downgradeToFreeTier, isDowngradingToFreeTier } = useSpaceSubscription();

  useTrackPageView({ type: 'billing/settings' });

  function handleShowCheckoutForm(tier: UpgradableTier | 'free') {
    if (tier === 'free') {
      openConfirmFreeTierDowngradeDialog();
    } else {
      setIsSpaceTierPurchaseModalOpen(tier);
    }
  }

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
          onClickUpgrade={() => setIsSpaceTierPurchaseModalOpen('bronze')}
        />
        <SubscriptionTiers onClickShowCheckoutForm={handleShowCheckoutForm} />
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
        isOpen={!!isSpaceTierPurchaseModalOpen}
        onClose={() => setIsSpaceTierPurchaseModalOpen(null)}
        spaceTokenBalance={spaceTokenBalance}
        newTier={isSpaceTierPurchaseModalOpen}
        onSuccess={() => {
          refreshSubscriptionReceipts();
          refreshSpaceTokenBalance();
          setIsSpaceTierPurchaseModalOpen(null);
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
      <ConfirmFreeDowngradeModal
        disabled={isDowngradingToFreeTier}
        isOpen={isConfirmDowngradeDialogOpen}
        onClose={closeConfirmFreeTierDowngradeDialog}
        onConfirmDowngrade={downgradeToFreeTier}
      />
    </RainbowKitProvider>
  );
}

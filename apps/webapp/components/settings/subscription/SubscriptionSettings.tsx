import type { Space } from '@charmverse/core/prisma';
import { Stack } from '@mui/material';
import type { UpgradableTier, DowngradeableTier } from '@packages/subscriptions/constants';
import { downgradeableTiers } from '@packages/subscriptions/constants';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useTrackPageView } from 'charmClient/hooks/track';
import MultiTabs from 'components/common/MultiTabs';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import Legend from '../components/Legend';

import { EnterpriseBillingScreen } from './components/EnterpriseBillingScreen';
import { CancelSubscriptionModal } from './components/modals/CancelSubscriptionModal';
import { ConfirmFreeTierModal } from './components/modals/ConfirmFreeTierModal';
import { DowngradeSubscriptionModal } from './components/modals/DowngradeSubscriptionModal';
import { ReactivateSubscriptionModal } from './components/modals/ReactivateSubscriptionModal';
import { UpgradeSubscriptionModal } from './components/modals/UpgradeSubscriptionModal';
import { SpaceContributionForm } from './components/SpaceContributionForm';
import { SpaceSubscriptionReceiptsList } from './components/SpaceSubscriptionReceipts';
import { SubscriptionHeader } from './components/SubscriptionHeader';
import { SubscriptionTiers } from './components/SubscriptionTiers';
import { useSpaceSubscription } from './hooks/useSpaceSubscription';

import '@rainbow-me/rainbowkit/styles.css';

export function SubscriptionSettings({ space }: { space: Space }) {
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
  const [tierToUpgrade, setTierToUpgrade] = useState<UpgradableTier | null>(null);
  const [isCancelSubscriptionModalOpen, setIsCancelSubscriptionModalOpen] = useState(false);
  const [isReactivateSubscriptionModalOpen, setIsReactivateSubscriptionModalOpen] = useState(false);
  const [tierToDowngrade, setTierToDowngrade] = useState<DowngradeableTier | null>(null);

  const { data: subscriptionEvents, mutate: refreshSubscriptionEvents } = useSWR(
    space ? `space-subscription-events/${space.id}` : null,
    () => (space ? charmClient.subscription.getSubscriptionEvents(space.id) : [])
  );

  const {
    isOpen: isFreeTierConfirmationOpen,
    close: closeConfirmFreeTierDialog,
    open: openConfirmFreeTierDialog
  } = usePopupState({ variant: 'popover', popupId: 'susbcription-actions' });

  const { switchToFreeTier, isSwitchingToFreeTier } = useSpaceSubscription();

  useTrackPageView({ type: 'billing/settings' });

  function handleShowCheckoutForm(tier: UpgradableTier | 'free') {
    if (tier === 'free') {
      openConfirmFreeTierDialog();
    } else {
      const currentTierIndex = downgradeableTiers.indexOf(space.subscriptionTier as DowngradeableTier);
      const newTierIndex = downgradeableTiers.indexOf(tier);
      if (currentTierIndex > newTierIndex) {
        setTierToDowngrade(tier);
      } else {
        setTierToUpgrade(tier);
      }
    }
  }

  if (space.paidTier === 'enterprise' || space.subscriptionTier === 'grant') {
    return <EnterpriseBillingScreen />;
  }

  return (
    <RainbowKitProvider>
      <Legend>Billing</Legend>
      <Stack gap={1}>
        <SubscriptionHeader
          spaceTokenBalance={spaceTokenBalance}
          subscriptionEvents={subscriptionEvents}
          onClickSendDev={() => setIsSendDevModalOpen(true)}
        />

        <MultiTabs
          onClick={(e) => {
            e.stopPropagation();
          }}
          tabs={[
            [
              'Subscription Plan',
              <SubscriptionTiers
                key='subscription'
                onClickShowCheckoutForm={handleShowCheckoutForm}
                subscriptionTier={space.subscriptionTier}
              />,
              { sx: { px: 0 } }
            ],
            [
              'Payment History',
              <SpaceSubscriptionReceiptsList key='payments' subscriptionReceipts={subscriptionReceipts} />,
              { sx: { px: 0 } }
            ]
          ]}
        />
      </Stack>
      <SpaceContributionForm
        isOpen={isSendDevModalOpen}
        onClose={() => setIsSendDevModalOpen(false)}
        onSuccess={() => {
          refreshSubscriptionReceipts();
          refreshSpaceTokenBalance();
        }}
      />
      <UpgradeSubscriptionModal
        spaceId={space.id}
        currentTier={space.subscriptionTier}
        isOpen={!!tierToUpgrade}
        onClose={() => setTierToUpgrade(null)}
        newTier={tierToUpgrade || 'bronze'}
        onSuccess={() => {
          refreshSubscriptionReceipts();
          refreshSpaceTokenBalance();
          refreshCurrentSpace();
        }}
      />
      <CancelSubscriptionModal
        isOpen={isCancelSubscriptionModalOpen}
        onClose={() => setIsCancelSubscriptionModalOpen(false)}
        onSuccess={() => {
          refreshCurrentSpace();
        }}
      />
      <DowngradeSubscriptionModal
        spaceId={space.id}
        isOpen={!!tierToDowngrade}
        onClose={() => setTierToDowngrade(null)}
        newTier={tierToDowngrade || 'bronze'}
        onSuccess={() => {
          refreshCurrentSpace();
          refreshSubscriptionEvents();
        }}
      />
      <ReactivateSubscriptionModal
        spaceId={space.id}
        isOpen={isReactivateSubscriptionModalOpen}
        onClose={() => setIsReactivateSubscriptionModalOpen(false)}
        onSuccess={() => {
          refreshCurrentSpace();
        }}
      />
      <ConfirmFreeTierModal
        disabled={isSwitchingToFreeTier}
        isOpen={isFreeTierConfirmationOpen}
        onClose={closeConfirmFreeTierDialog}
        onConfirm={switchToFreeTier}
      />
    </RainbowKitProvider>
  );
}

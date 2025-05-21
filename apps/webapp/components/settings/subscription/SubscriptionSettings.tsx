import type { Space } from '@charmverse/core/prisma';
import { Box, Divider, Link, Stack, Typography } from '@mui/material';
import type { DowngradeableTier, UpgradableTier } from '@packages/subscriptions/constants';
import { downgradeableTiers } from '@packages/subscriptions/constants';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useGetSubscriptionStatus, useSwitchToFreeTier } from 'charmClient/hooks/subscriptions';
import { useTrackPageView } from 'charmClient/hooks/track';
import MultiTabs from 'components/common/MultiTabs';

import Legend from '../components/Legend';

import { EnterpriseBillingScreen } from './components/EnterpriseBillingScreen';
import { CancelSubscriptionModal } from './components/modals/CancelSubscriptionModal';
import { ConfirmFreeTierModal } from './components/modals/ConfirmFreeTierModal';
import { DowngradeSubscriptionModal } from './components/modals/DowngradeSubscriptionModal';
import { ReactivateSubscriptionModal } from './components/modals/ReactivateSubscriptionModal';
import { UpgradeSubscriptionModal } from './components/modals/UpgradeSubscriptionModal';
import { SendDevToSpaceForm } from './components/SendDevToSpaceForm';
import { SpaceSubscriptionEventsList } from './components/SpaceSubscriptionEvents';
import { SubscriptionHeader } from './components/SubscriptionHeader';
import { SubscriptionTiers } from './components/SubscriptionTiers';

import '@rainbow-me/rainbowkit/styles.css';

export function SubscriptionSettings({ space: { id: spaceId, paidTier } }: { space: Space }) {
  const { data: subscriptionEvents = [], mutate: refreshSubscriptionEvents } = useSWR(
    spaceId ? `space-subscription-events/${spaceId}` : null,
    () => (spaceId ? charmClient.subscription.getSubscriptionEvents(spaceId) : [])
  );
  const [isSendDevModalOpen, setIsSendDevModalOpen] = useState(false);
  const [tierToUpgrade, setTierToUpgrade] = useState<UpgradableTier | null>(null);
  const [isCancelSubscriptionModalOpen, setIsCancelSubscriptionModalOpen] = useState(false);
  const [isReactivateSubscriptionModalOpen, setIsReactivateSubscriptionModalOpen] = useState(false);
  const [tierToDowngrade, setTierToDowngrade] = useState<DowngradeableTier | null>(null);

  const {
    isOpen: isFreeTierConfirmationOpen,
    close: closeConfirmFreeTierDialog,
    open: openConfirmFreeTierDialog
  } = usePopupState({ variant: 'popover', popupId: 'susbcription-actions' });

  const { data: subscriptionStatus, mutate: refreshSubscriptionStatus } = useGetSubscriptionStatus(spaceId);
  const { trigger: switchToFreeTier, isMutating: isSwitchingToFreeTier } = useSwitchToFreeTier(spaceId, {
    onSuccess: () => {
      refreshSubscriptionStatus();
      refreshSubscriptionEvents();
    }
  });

  useTrackPageView({ type: 'billing/settings' });

  function handleShowCheckoutForm(tier: UpgradableTier | 'free') {
    if (tier === 'free') {
      openConfirmFreeTierDialog();
    } else if (subscriptionStatus) {
      // const latestTier = subscriptionStatus.pendingTier || subscriptionStatus.tier;
      const currentTierIndex = downgradeableTiers.indexOf(subscriptionStatus.tier as DowngradeableTier);
      const newTierIndex = downgradeableTiers.indexOf(tier);
      if (currentTierIndex > newTierIndex) {
        setTierToDowngrade(tier);
      } else {
        setTierToUpgrade(tier);
      }
    }
  }

  if (!subscriptionStatus) {
    return <>&nbsp;</>;
  }

  if (paidTier === 'enterprise' || subscriptionStatus.tier === 'grant') {
    return <EnterpriseBillingScreen />;
  }

  return (
    <RainbowKitProvider>
      <Legend>Billing</Legend>
      <Stack gap={1}>
        <SubscriptionHeader
          subscriptionStatus={subscriptionStatus}
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
                currentTier={subscriptionStatus.tier}
                pendingTier={subscriptionStatus.pendingTier}
              />,
              { sx: { px: 0, pb: 1 } }
            ],
            [
              'Plan History',
              <SpaceSubscriptionEventsList key='payments' subscriptionEvents={subscriptionEvents} />,
              { sx: { px: 0, pb: 1 } }
            ]
          ]}
        />
        <Divider />
        <Box pt={2} pb={4}>
          <Typography variant='body2' align='center'>
            Read more about our new pricing tiers{' '}
            <Link href='https://charmverse.io/post/community-pricing' target='_blank'>
              here
            </Link>
            . Have questions? Contact{' '}
            <Link target='_blank' href='mailto:hello@charmverse.io'>
              hello@charmverse.io
            </Link>
          </Typography>
        </Box>
      </Stack>
      <SendDevToSpaceForm
        spaceTokenBalance={subscriptionStatus.tokenBalance.formatted}
        spaceTier={subscriptionStatus.tier}
        isOpen={isSendDevModalOpen}
        onClose={() => setIsSendDevModalOpen(false)}
        onSuccess={() => {
          refreshSubscriptionEvents();
          refreshSubscriptionStatus();
        }}
      />
      <UpgradeSubscriptionModal
        spaceId={spaceId}
        currentTier={subscriptionStatus.tier}
        isOpen={!!tierToUpgrade}
        onClose={() => setTierToUpgrade(null)}
        newTier={tierToUpgrade || 'bronze'}
        onSuccess={() => {
          refreshSubscriptionEvents();
          refreshSubscriptionStatus();
        }}
      />
      <CancelSubscriptionModal
        isOpen={isCancelSubscriptionModalOpen}
        onClose={() => setIsCancelSubscriptionModalOpen(false)}
        onSuccess={() => {
          refreshSubscriptionEvents();
          refreshSubscriptionStatus();
        }}
      />
      <DowngradeSubscriptionModal
        spaceId={spaceId}
        isOpen={!!tierToDowngrade}
        onClose={() => setTierToDowngrade(null)}
        newTier={tierToDowngrade || 'bronze'}
        onSuccess={() => {
          refreshSubscriptionEvents();
          refreshSubscriptionStatus();
        }}
      />
      <ReactivateSubscriptionModal
        spaceId={spaceId}
        isOpen={isReactivateSubscriptionModalOpen}
        onClose={() => setIsReactivateSubscriptionModalOpen(false)}
        onSuccess={() => {
          refreshSubscriptionEvents();
          refreshSubscriptionStatus();
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

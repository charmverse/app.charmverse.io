import type { Space } from '@charmverse/core/prisma';
import { Box, Divider, Link, Stack, Typography } from '@mui/material';
import type { DowngradeableTier, UpgradableTier } from '@packages/subscriptions/constants';
import { downgradeableTiers } from '@packages/subscriptions/constants';
import type { SubscriptionTierChangeEvent } from '@packages/subscriptions/getSubscriptionEvents';
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
import { SpaceSubscriptionEventsList } from './components/SpaceSubscriptionEvents';
import { SubscriptionHeader } from './components/SubscriptionHeader';
import { SubscriptionTiers } from './components/SubscriptionTiers';
import { useSpaceSubscription } from './hooks/useSpaceSubscription';

import '@rainbow-me/rainbowkit/styles.css';

export function SubscriptionSettings({ space }: { space: Space }) {
  const { refreshCurrentSpace } = useCurrentSpace();
  const { data: { formatted: spaceTokenBalance } = { formatted: 0 }, mutate: refreshSpaceTokenBalance } = useSWR(
    space ? `space-token-balance/${space.id}` : null,
    () => (space ? charmClient.spaces.getSpaceTokenBalance(space.id) : { value: '0', formatted: 0 })
  );

  const { data: subscriptionEvents = [], mutate: refreshSubscriptionEvents } = useSWR(
    space ? `space-subscription-events/${space.id}` : null,
    () => (space ? charmClient.subscription.getSubscriptionEvents(space.id) : [])
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

  const { switchToFreeTier, isSwitchingToFreeTier } = useSpaceSubscription();

  useTrackPageView({ type: 'billing/settings' });

  const subscriptionTierChangeEvents = subscriptionEvents.filter(
    (event) => event.type === 'tier-change'
  ) as SubscriptionTierChangeEvent[];

  function handleShowCheckoutForm(tier: UpgradableTier | 'free') {
    if (tier === 'free') {
      openConfirmFreeTierDialog();
    } else {
      const latestTier = subscriptionTierChangeEvents?.[0]?.tier ?? space.subscriptionTier;
      const currentTierIndex = downgradeableTiers.indexOf(latestTier as DowngradeableTier);
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
          subscriptionEvents={subscriptionTierChangeEvents}
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
      <SpaceContributionForm
        isOpen={isSendDevModalOpen}
        onClose={() => setIsSendDevModalOpen(false)}
        onSuccess={() => {
          refreshSubscriptionEvents();
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
          refreshSubscriptionEvents();
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

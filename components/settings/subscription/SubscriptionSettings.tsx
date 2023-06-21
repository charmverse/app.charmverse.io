import type { Space, SubscriptionPeriod } from '@charmverse/core/prisma';
import { useTheme } from '@emotion/react';
import { List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { subscriptionCancellationDetails } from 'lib/subscription/constants';
import type { UpdateSubscriptionRequest, CreateProSubscriptionRequest } from 'lib/subscription/interfaces';

import Legend from '../Legend';

import { CheckoutForm } from './CheckoutForm';
import { CreateSubscriptionInformation } from './CreateSubscriptionInformation';
import { useSpaceSubscription } from './hooks/useSpaceSubscription';
import { loadStripe } from './loadStripe';
import { PlanSelection } from './PlanSelection';
import { SubscriptionActions } from './SubscriptionActions';
import { SubscriptionInformation } from './SubscriptionInformation';

export function SubscriptionSettings({ space }: { space: Space }) {
  const { showMessage } = useSnackbar();
  const { setSpace } = useSpaces();

  const { spaceSubscription, isLoading, refetchSpaceSubscription } = useSpaceSubscription();

  const { trigger: updateSpaceSubscription, isMutating: isLoadingUpdate } = useSWRMutation(
    `/api/spaces/${space?.id}/subscription`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string; payload: UpdateSubscriptionRequest } }>) =>
      charmClient.subscription.updateSpaceSubscription(arg.spaceId, arg.payload),
    {
      onError() {
        showMessage('Updating failed! Please try again', 'error');
      }
    }
  );

  const { trigger: deleteSubscription, isMutating: isLoadingDeletion } = useSWRMutation(
    `/api/spaces/${space?.id}/subscription-intent`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string } }>) =>
      charmClient.subscription.deleteSpaceSubscription(arg.spaceId),
    {
      onError() {
        showMessage('Deletion failed! Please try again', 'error');
      },
      async onSuccess() {
        await refetchSpaceSubscription();
        setSpace({ ...space, paidTier: 'free' });
      }
    }
  );

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

  const [period, setPeriod] = useState<SubscriptionPeriod>('annual');
  const [blockQuota, setblockQuota] = useState(1);

  useEffect(() => {
    charmClient.track.trackAction('view_subscription', {
      spaceId: space.id
    });
  }, []);

  async function handleShowCheckoutForm() {
    setShowCheckoutForm(true);
    charmClient.track.trackAction('initiate_subscription', {
      spaceId: space.id
    });
    await createSubscription({ spaceId: space.id, payload: { period, blockQuota } });
  }

  async function handleDeleteSubs() {
    await deleteSubscription({ spaceId: space.id });
  }

  const handlePlanSelect = (_blockQuota: number | null, _period: SubscriptionPeriod | null) => {
    if (_blockQuota) {
      setblockQuota(_blockQuota);
    } else if (_period) {
      setPeriod(_period);
    }
  };

  const handlePlanSelectCommited = async (_blockQuota: number | null, _period: SubscriptionPeriod | null) => {
    if (_blockQuota) {
      await createSubscription({ spaceId: space.id, payload: { blockQuota: _blockQuota, period } });
    } else if (_period) {
      await createSubscription({ spaceId: space.id, payload: { blockQuota, period: _period } });
    }
  };
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const theme = useTheme();

  const stripePromise = loadStripe();

  if (!showCheckoutForm) {
    return (
      <Stack gap={1}>
        {spaceSubscription ? (
          <SubscriptionInformation
            space={space}
            spaceSubscription={spaceSubscription}
            isLoading={isLoading}
            blockQuota={blockQuota}
          />
        ) : (
          <CreateSubscriptionInformation onClick={handleShowCheckoutForm} />
        )}
        <SubscriptionActions
          spaceSubscription={spaceSubscription}
          loading={isLoading || isLoadingUpdate || isLoadingDeletion}
          onDelete={handleDeleteSubs}
          onCancelAtEnd={() => setShowConfirmDialog(true)}
          onReactivation={() => updateSpaceSubscription({ spaceId: space.id, payload: { status: 'active' } })}
        />
        <ConfirmDeleteModal
          title='Cancelling Community Edition'
          size='large'
          open={showConfirmDialog}
          buttonText='Yes'
          secondaryButtonText='No'
          question={
            <>
              <Typography>{subscriptionCancellationDetails.first}</Typography>
              <List dense sx={{ listStyle: 'disc' }}>
                {subscriptionCancellationDetails.list.map((item) => (
                  <ListItem key={item} sx={{ display: 'list-item', ml: '15px' }}>
                    <ListItemText>{item}</ListItemText>
                  </ListItem>
                ))}
              </List>
              <Typography>{subscriptionCancellationDetails.last}</Typography>
              <br />
              <Typography>Do you still want to Cancel?</Typography>
            </>
          }
          onConfirm={() => updateSpaceSubscription({ spaceId: space.id, payload: { status: 'cancelAtEnd' } })}
          onClose={() => setShowConfirmDialog(false)}
          disabled={isLoadingUpdate || isLoadingDeletion}
        />
      </Stack>
    );
  }

  return (
    <Stack gap={1}>
      <Legend>Upgrade to Community</Legend>
      <Typography variant='h6'>Onboard & Engage Community Members</Typography>
      <Typography>Comprehensive access control & unlimited roles, guests, custom domain and API access</Typography>
      <PlanSelection
        disabled={isInitialSubscriptionLoading}
        onSelect={handlePlanSelect}
        onSelectCommited={handlePlanSelectCommited}
        blockQuota={blockQuota}
        period={period}
      />
      <LoadingComponent isLoading={isInitialSubscriptionLoading} />
      {!isLoading &&
        !isInitialSubscriptionLoading &&
        spaceSubscription !== undefined &&
        initialSubscriptionData?.clientSecret && (
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
              subscriptionId={initialSubscriptionData.subscriptionId}
              refetch={refetchSpaceSubscription}
              onCancel={() => setShowCheckoutForm(false)}
            />
          </Elements>
        )}
    </Stack>
  );
}

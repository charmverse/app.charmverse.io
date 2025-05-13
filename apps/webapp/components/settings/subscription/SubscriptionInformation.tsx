import type { Space } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import { Divider, Grid, Stack, TextField, Typography } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import type { SubscriptionPeriod } from '@packages/lib/subscription/constants';
import { communityProduct } from '@packages/lib/subscription/constants';
import { generatePriceDetails } from '@packages/lib/subscription/generatePriceDetails';
import type { SpaceSubscriptionWithStripeData } from '@packages/lib/subscription/getActiveSpaceSubscription';
import type { UpdateSubscriptionRequest } from '@packages/lib/subscription/updateProSubscription';
import type { UpgradeSubscriptionRequest } from '@packages/lib/subscription/upgradeProSubscription';
import { formatDate } from '@packages/lib/utils/dates';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import useSWRMutation from 'swr/mutation';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import Legend from 'components/settings/components/Legend';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUserPreferences } from 'hooks/useUserPreferences';
import { useWebSocketClient } from 'hooks/useWebSocketClient';

import { PaymentMethod } from './PaymentMethod';
import { PlanSelection } from './PlanSelection';
import { SubscriptionActions } from './SubscriptionActions';

const schema = () => {
  return yup
    .object({
      email: yup.string().email().required()
    })
    .strict();
};

export function SubscriptionInformation({
  space,
  spaceSubscription,
  minimumBlockQuota,
  refetchSpaceSubscription
}: {
  space: Space;
  spaceSubscription: SpaceSubscriptionWithStripeData;
  minimumBlockQuota: number;
  refetchSpaceSubscription: () => Promise<SpaceSubscriptionWithStripeData | null | undefined>;
}) {
  const { showMessage } = useSnackbar();
  const { refreshCurrentSpace } = useCurrentSpace();
  const { userPreferences } = useUserPreferences();
  const {
    isOpen: isUpgradeDialogOpen,
    close: closeUpgradeDialog,
    open: openUpgradeDialog
  } = usePopupState({ variant: 'popover', popupId: 'upgrade-susbcription' });

  const {
    isOpen: isConfirmUpgradeDialogOpen,
    close: closeConfirmUpgradeDialog,
    open: openConfirmUpgradeDialog
  } = usePopupState({ variant: 'popover', popupId: 'confirm-upgrade-susbcription' });

  const {
    register,
    getValues,
    watch,
    formState: { errors }
  } = useForm<{ email: string }>({
    mode: 'onChange',
    defaultValues: { email: spaceSubscription.billingEmail ?? '' },
    resolver: yupResolver(schema())
  });
  const email = watch('email');

  const { subscribe } = useWebSocketClient();

  const [period, setPeriod] = useState<SubscriptionPeriod>(spaceSubscription.period);
  const [blockQuota, setBlockQuota] = useState(spaceSubscription.blockQuota);

  const handlePlanSelect = (_blockQuota: number | null, _period: SubscriptionPeriod | null) => {
    if (_blockQuota) {
      setBlockQuota(minimumBlockQuota > _blockQuota ? minimumBlockQuota : _blockQuota);
    } else if (_period) {
      setPeriod(_period);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribe('space_subscription', async () => {
      await refetchSpaceSubscription().catch();
      await refreshCurrentSpace();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const { trigger: updateSpaceSubscription, isMutating: isLoadingUpdate } = useSWRMutation(
    `/api/spaces/${space?.id}/subscription`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string; payload: UpdateSubscriptionRequest } }>) =>
      charmClient.subscription.updateSpaceSubscription(arg.spaceId, arg.payload),
    {
      onError() {
        showMessage('Updating failed! Please try again', 'error');
      },
      onSuccess() {
        refetchSpaceSubscription();
        showMessage('Subscription change succeeded!', 'success');
      }
    }
  );

  const { trigger: upgradeSpaceSubscription, isMutating: isLoadingUpgrade } = useSWRMutation(
    `/api/spaces/${space.id}/upgrade-subscription`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string; payload: UpgradeSubscriptionRequest } }>) =>
      charmClient.subscription.upgradeSpaceSubscription(arg.spaceId, arg.payload),
    {
      onError() {
        showMessage('Upgrading failed! Please try again', 'error');
      },
      onSuccess() {
        refetchSpaceSubscription();
        showMessage('Subscription change succeeded!', 'success');
      }
    }
  );

  const { trigger: switchToFreePlan, isMutating: isLoadingSwitchToFreePlan } = useSWRMutation(
    `/api/spaces/${space.id}/switch-to-free-tier`,
    () => charmClient.subscription.switchToFreeTier(space.id),
    {
      onSuccess() {
        refetchSpaceSubscription();
        refreshCurrentSpace();
        showMessage('You have successfully switch to free tier!', 'success');
      },
      onError(err) {
        showMessage(err?.message ?? 'The switch to free tier could not be made. Please try again later.', 'error');
      }
    }
  );

  const status = useMemo(() => {
    switch (spaceSubscription?.status) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'Pending';
      case 'cancel_at_end':
        return 'Your subscription was cancelled and will end on the next billing date';
      case 'past_due':
        return `Your subscription is past due. Please check your balance, update your payment details or your subscription will be cancelled.`;
      case 'unpaid':
        return `Your subscription is unpaid. Please check your balance, update your payment details or your subscription will be cancelled.`;
      case 'cancelled':
      default:
        return null;
    }
  }, [spaceSubscription?.status]);

  const pricePerMonth = period === 'annual' ? communityProduct.pricing.annual / 12 : communityProduct.pricing.monthly;
  const priceDetails = generatePriceDetails(spaceSubscription.discount, pricePerMonth * blockQuota);

  const nextBillingDate = spaceSubscription?.renewalDate
    ? formatDate(spaceSubscription.renewalDate, { withYear: true, month: 'long' }, userPreferences.locale)
    : null;

  return (
    <>
      <Legend whiteSpace='normal'>Plan & Billing</Legend>
      <Grid container spacing={5} alignItems='center'>
        <Grid item xs={12} sm={8} display='flex' flexDirection='column' alignItems='flex-start' gap={1}>
          <Typography variant='h6' mb={1}>
            Current plan
          </Typography>
          <Typography>Community Edition - {String(spaceSubscription.blockQuota)}K blocks</Typography>
          <Typography>
            ${priceDetails.total.toFixed(2)} per month billed {spaceSubscription.period}
          </Typography>
          {nextBillingDate && (
            <Typography>
              {spaceSubscription.status === 'cancel_at_end' ? 'Ends' : 'Renews'} on {nextBillingDate}
            </Typography>
          )}
          {status && <Typography>Status: {status}</Typography>}
        </Grid>
        <Grid item xs={12} sm={4}>
          <SubscriptionActions
            paidTier={space.paidTier}
            spaceSubscription={spaceSubscription}
            loading={isLoadingUpdate || isLoadingUpgrade || isLoadingSwitchToFreePlan}
            onCancelAtEnd={() =>
              updateSpaceSubscription({
                spaceId: space.id,
                payload: { status: 'cancel_at_end' }
              })
            }
            onReactivation={() =>
              updateSpaceSubscription({
                spaceId: space.id,
                payload: { status: 'active' }
              })
            }
            onUpgrade={() => openUpgradeDialog()}
            confirmFreeTierDowngrade={switchToFreePlan}
          />
          <ModalWithButtons
            title='Upgrade Community Edition'
            size='large'
            open={isUpgradeDialogOpen}
            buttonText='Change subscription'
            secondaryButtonText='Cancel'
            onConfirm={openConfirmUpgradeDialog}
            onClose={closeUpgradeDialog}
            disabled={
              isLoadingUpgrade || (period === spaceSubscription.period && blockQuota === spaceSubscription.blockQuota)
            }
          >
            <PlanSelection
              blockQuotaInThousands={blockQuota}
              period={period}
              disabled={false}
              onSelect={handlePlanSelect}
            />
          </ModalWithButtons>
          <ModalWithButtons
            title='Confirm plan changes'
            size='large'
            open={isConfirmUpgradeDialogOpen}
            buttonText='Confirm'
            secondaryButtonText='Cancel'
            onConfirm={() => upgradeSpaceSubscription({ spaceId: space.id, payload: { period, blockQuota } })}
            onClose={closeConfirmUpgradeDialog}
            disabled={isLoadingUpgrade}
          >
            <Typography>
              You are about to change your plan.{' '}
              {spaceSubscription.blockQuota < blockQuota ? 'This will automatically charge your payment method.' : ''}
            </Typography>
          </ModalWithButtons>
        </Grid>
      </Grid>
      <Divider sx={{ my: 2 }} />
      {(!spaceSubscription.paymentMethod || spaceSubscription.paymentMethod.type === 'card') && (
        <>
          <PaymentMethod
            paymentMethod={spaceSubscription.paymentMethod}
            spaceId={space.id}
            refetchSubscription={refetchSpaceSubscription}
          />
          <Divider sx={{ my: 2 }} />
        </>
      )}
      <Grid container alignItems='center'>
        <Grid item xs={12} sm={6}>
          <Typography variant='h6' mb={1}>
            Billing Information
          </Typography>
          <Stack gap={0.5} my={2}>
            <InputLabel>Email</InputLabel>
            <TextField
              {...register('email')}
              error={!!errors.email}
              placeholder='johndoe@gmail.com'
              disabled={isLoadingUpdate}
            />
            <Button
              disabled={
                isLoadingUpdate || email.length === 0 || !!errors.email || email === spaceSubscription.billingEmail
              }
              onClick={() =>
                updateSpaceSubscription({
                  spaceId: space.id,
                  payload: { billingEmail: getValues().email }
                })
              }
              sx={{ maxWidth: '100px', mt: 2 }}
              fullWidth={false}
            >
              Update
            </Button>
          </Stack>
        </Grid>
        <Grid item xs={12} sm={6} />
      </Grid>
    </>
  );
}

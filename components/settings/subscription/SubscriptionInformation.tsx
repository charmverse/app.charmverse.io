import type { Space } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import { Divider, Grid, List, ListItem, ListItemText, Stack, TextField, Typography } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import useSWRMutation from 'swr/mutation';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import Legend from 'components/settings/Legend';
import { useSnackbar } from 'hooks/useSnackbar';
import { subscriptionCancellationDetails, communityProduct } from 'lib/subscription/constants';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';
import type { UpdateSubscriptionRequest } from 'lib/subscription/interfaces';

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
  refetchSpaceSubscription
}: {
  space: Space;
  spaceSubscription: SpaceSubscription;
  refetchSpaceSubscription: () => Promise<SpaceSubscription | null | undefined>;
}) {
  const { showMessage } = useSnackbar();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const {
    register,
    getValues,
    watch,
    formState: { errors }
  } = useForm<{ email: string }>({
    mode: 'onChange',
    defaultValues: { email: '' },
    resolver: yupResolver(schema())
  });
  const email = watch('email');

  const { trigger: updateSpaceSubscription, isMutating: isLoadingUpdate } = useSWRMutation(
    `/api/spaces/${space?.id}/subscription`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string; payload: UpdateSubscriptionRequest } }>) =>
      charmClient.subscription.updateSpaceSubscription(arg.spaceId, arg.payload),
    {
      onError() {
        showMessage('Updating failed! Please try again', 'error');
      },
      async onSuccess() {
        await refetchSpaceSubscription();
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
      }
    }
  );

  async function handleDeleteSubs() {
    await deleteSubscription({ spaceId: space.id });
  }

  const status = useMemo(() => {
    switch (spaceSubscription?.status) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'Pending';
      case 'cancelAtEnd':
        return 'Your subscription was cancelled and will end on the next billing date. You can reactivate it by clicking the button below.';
      case 'cancelled':
      default:
        return null;
    }
  }, [spaceSubscription?.status]);

  const price =
    spaceSubscription.period === 'annual' ? communityProduct.pricing.annual / 12 : communityProduct.pricing.monthly;

  return (
    <>
      <Legend whiteSpace='normal'>Plan & Billing</Legend>
      <Grid container spacing={5} alignItems='center'>
        <Grid item xs={12} sm={8} display='flex' flexDirection='column' alignItems='flex-start' gap={1}>
          <Typography variant='h6' mb={1}>
            Current plan
          </Typography>
          <Typography>
            Community Edition - {String((communityProduct.blockLimit ?? 0) * spaceSubscription.blockQuota).slice(0, -3)}
            K blocks
          </Typography>
          <Typography>
            ${price * spaceSubscription.blockQuota} per month billed {spaceSubscription.period}
          </Typography>
          <Typography>Your plan renews on July 3, 2024</Typography>
          {status && <Typography>Status: {status}</Typography>}
        </Grid>
        <Grid item xs={12} sm={4}>
          <SubscriptionActions
            spaceSubscription={spaceSubscription}
            loading={isLoadingUpdate || isLoadingDeletion}
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
        </Grid>
      </Grid>
      <Divider sx={{ my: 2 }} />
      <Grid container alignItems='center'>
        <Grid item xs={12} sm={8} display='flex' flexDirection='column' alignItems='flex-start' gap={1}>
          <Typography variant='h6' mb={1}>
            Payment Method
          </Typography>
          <Typography>Visa **** 4641</Typography>
          <Typography>
            <u>change payment method</u>
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4} />
      </Grid>
      <Divider sx={{ my: 2 }} />
      <Grid container alignItems='center'>
        <Grid item xs={12} sm={6}>
          <Typography variant='h6' mb={1}>
            Billing Information
          </Typography>
          <Stack gap={0.5} my={2}>
            <InputLabel>Email</InputLabel>
            <TextField
              error={!!errors.email}
              disabled={isLoadingUpdate}
              placeholder='johndoe@gmail.com'
              {...register('email')}
            />
            <Button
              disabled={isLoadingUpdate || email.length === 0 || !!errors.email}
              onClick={() => updateSpaceSubscription({ spaceId: space.id, payload: { email: getValues().email } })}
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

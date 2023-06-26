import CheckIcon from '@mui/icons-material/Check';
import { Chip, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';
import { subscriptionDetails } from 'lib/subscription/constants';
import type { SpaceSubscriptionWithStripeData } from 'lib/subscription/getActiveSpaceSubscription';
import { getTimeDifference } from 'lib/utilities/dates';
import Community from 'public/images/subscriptions/community.svg';
import Enterprise from 'public/images/subscriptions/enterprise.svg';
import Free from 'public/images/subscriptions/free.svg';

import Legend from '../Legend';

export function CreateSubscriptionInformation({
  onClick,
  spaceSubscription
}: {
  onClick: () => void;
  spaceSubscription?: SpaceSubscriptionWithStripeData | null;
}) {
  const { showMessage } = useSnackbar();

  const { trigger: switchToFreeTier, isMutating: isSwitchLoading } = useSWRMutation(
    `/api/spaces/${spaceSubscription?.spaceId}/subscription`,
    (_url, { arg }: Readonly<{ arg: string }>) => charmClient.subscription.switchToFreeTier(arg),
    {
      onError() {
        showMessage('Updating failed! Please try again', 'error');
      }
    }
  );

  const freeTrialEnds =
    spaceSubscription?.status === 'free_trial'
      ? getTimeDifference(spaceSubscription?.expiresOn ?? new Date(), 'day', new Date())
      : 0;

  const freeTrialLabel =
    spaceSubscription?.status === 'free_trial'
      ? freeTrialEnds > 0
        ? `Free trial - ${freeTrialEnds} days left`
        : `Free trial finished`
      : '';

  return (
    <>
      <Legend variantMapping={{ inherit: 'div' }} whiteSpace='normal'>
        Upgrade CharmVerse
      </Legend>
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4} display='flex' flexDirection='column' alignItems='flex-start' gap={1}>
          <Typography variant='h6' mb={1}>
            Free Plan
          </Typography>
          {spaceSubscription?.status === 'free_trial' ? null : <Chip size='small' label='Current Plan' />}
          <Free width='140px' height='140px' />
          {/* <Typography variant='body1' mb={1}>
            You can cancel the free trial and go directly to a free plan.
          </Typography> */}
          {spaceSubscription?.status === 'free_trial' && (
            <Button disabled={isSwitchLoading} onClick={() => switchToFreeTier(spaceSubscription.spaceId)}>
              Use free plan
            </Button>
          )}
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography variant='h6' mb={1}>
            Collaborate in public
          </Typography>
          <List dense>
            {subscriptionDetails.free.map((detail) => (
              <ListItem key={detail} sx={{ py: 0 }}>
                <ListItemIcon>
                  <CheckIcon fontSize='small' />
                </ListItemIcon>
                <ListItemText primary={detail} />
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
      <Divider sx={{ mb: 1 }} />
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4} display='flex' flexDirection='column' alignItems='flex-start' gap={1}>
          <Typography variant='h6' mb={1}>
            Community Edition
          </Typography>
          {spaceSubscription?.status === 'free_trial' ? (
            <Chip size='small' color={freeTrialEnds > 0 ? 'green' : 'orange'} label={freeTrialLabel} />
          ) : (
            <Chip size='small' label='Recommended Plan' variant='outlined' />
          )}
          <Community width='150px' height='150px' />
          <Typography variant='body1' mb={1}>
            Starts at $10/month
          </Typography>
          <Button onClick={onClick}>Upgrade</Button>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography variant='h6' mb={1}>
            Onboard & Engage Community Members
          </Typography>
          <List dense>
            {subscriptionDetails.community.map((detail) => (
              <ListItem key={detail} sx={{ py: 0 }}>
                <ListItemIcon>
                  <CheckIcon fontSize='small' />
                </ListItemIcon>
                <ListItemText primary={detail} />
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
      <Divider sx={{ mb: 1 }} />
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4} display='flex' flexDirection='column' alignItems='flex-start' gap={1}>
          <Typography variant='h6' mb={1}>
            Enterprise Edition
          </Typography>
          <Enterprise width='150px' height='150px' />
          <Button variant='text' href='mailto:hello@charmverse.io'>
            Contact us
          </Button>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography variant='h6' mb={1}>
            Advanced control and support for large Communities
          </Typography>
          <List dense>
            {subscriptionDetails.enterprise.map((detail) => (
              <ListItem key={detail} sx={{ py: 0 }}>
                <ListItemIcon>
                  <CheckIcon fontSize='small' />
                </ListItemIcon>
                <ListItemText primary={detail} />
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
    </>
  );
}

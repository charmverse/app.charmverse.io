import CheckIcon from '@mui/icons-material/Check';
import { Chip, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';

import Button from 'components/common/Button';
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
          <Free width='140px' height='140px' style={{ margin: 'auto' }} />
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
          <Community width='150px' height='150px' style={{ margin: 'auto' }} />
          <Button fullWidth onClick={onClick}>
            Upgrade $10/month
          </Button>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography variant='h6' mb={1}>
            Onboard & engage community members
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
        <Grid item xs={12} sm={4} display='flex' flexDirection='column' gap={1}>
          <Typography variant='h6' mb={1}>
            Enterprise Edition
          </Typography>
          <Enterprise width='150px' height='150px' style={{ margin: 'auto' }} />
          <Button variant='outlined' fullWidth href='mailto:hello@charmverse.io'>
            Contact us
          </Button>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography variant='h6' mb={1}>
            Advanced control and support for large communities
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

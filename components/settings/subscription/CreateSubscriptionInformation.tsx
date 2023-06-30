import CheckIcon from '@mui/icons-material/Check';
import { Box, Chip, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { useEffect } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { subscriptionDetails } from 'lib/subscription/constants';
import type { SpaceSubscriptionWithStripeData } from 'lib/subscription/getActiveSpaceSubscription';
import { getTimeDifference } from 'lib/utilities/dates';
import CommunityIcon from 'public/images/subscriptions/community.svg';
import EnterpriseIcon from 'public/images/subscriptions/enterprise.svg';
import FreeIcon from 'public/images/subscriptions/free.svg';

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

  const { space } = useCurrentSpace();

  useEffect(() => {
    if (space) {
      charmClient.track.trackAction('page_view', {
        spaceId: space.id,
        type: 'billing/marketing'
      });
    }
  }, [space]);

  return (
    <>
      <Legend variantMapping={{ inherit: 'div' }} whiteSpace='normal'>
        Upgrade CharmVerse
      </Legend>
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4.5}>
          <Box style={{ float: 'left' }} mt={-1} width='100px'>
            <FreeIcon width='100px' height='100px' />
          </Box>
          <Typography variant='h6' mb={1}>
            Free Plan
          </Typography>
          {spaceSubscription?.status === 'free_trial' ? null : <Chip size='small' label='Current Plan' />}
        </Grid>
        <Grid item xs={12} sm={7.5}>
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
        <Grid item xs={12} sm={4.5} display='flex' flexDirection='column' justifyContent='space-between'>
          <div>
            <Box style={{ float: 'left' }} width='100px'>
              <CommunityIcon width='100px' height='100px' />
            </Box>
            <Typography variant='h6' mb={1}>
              Community Edition
            </Typography>
            {spaceSubscription?.status === 'free_trial' ? (
              <Chip size='small' color={freeTrialEnds > 0 ? 'green' : 'orange'} label={freeTrialLabel} />
            ) : (
              <Chip size='small' label='Recommended Plan' variant='outlined' />
            )}
          </div>
          <Button fullWidth onClick={onClick}>
            Upgrade $10/month
          </Button>
        </Grid>
        <Grid item xs={12} sm={7.5}>
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
      <Divider sx={{ mb: 1, mt: 2 }} />
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4.5} display='flex' flexDirection='column' justifyContent='space-between'>
          <div>
            <Box style={{ float: 'left' }} width='100px'>
              <EnterpriseIcon width='90px' height='90px' />
            </Box>
            <Typography variant='h6' mb={1}>
              Enterprise Edition
            </Typography>
          </div>
          <Button variant='outlined' fullWidth href='mailto:hello@charmverse.io'>
            Contact us
          </Button>
        </Grid>
        <Grid item xs={12} sm={7.5}>
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

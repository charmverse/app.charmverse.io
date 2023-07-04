import CheckIcon from '@mui/icons-material/Check';
import { Box, Chip, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import type { ReactNode } from 'react';
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

function MobileIconContainer({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: { xs: 'flex', lg: 'none' } }} my={2} justifyContent='center'>
      {children}
    </Box>
  );
}

function DesktopIconContainer({ children }: { children: ReactNode }) {
  return (
    <Box style={{ float: 'left' }} sx={{ display: { xs: 'none', lg: 'block' } }} width='100px'>
      {children}
    </Box>
  );
}

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
          <DesktopIconContainer>
            <Box mt={-1}>
              <FreeIcon width='100px' height='100px' />
            </Box>
          </DesktopIconContainer>
          <Typography variant='h6' mb={1}>
            Free Plan
          </Typography>
          {spaceSubscription?.status === 'free_trial' ? null : <Chip size='small' label='Current Plan' />}
          <MobileIconContainer>
            <FreeIcon width='140px' height='140px' />
          </MobileIconContainer>
        </Grid>
        <Grid item xs={12} sm={7.5}>
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
            <DesktopIconContainer>
              <CommunityIcon width='100px' height='100px' />
            </DesktopIconContainer>
            <Typography variant='h6' mb={1}>
              Community Edition
            </Typography>
            {spaceSubscription?.status === 'free_trial' ? (
              <Chip size='small' color={freeTrialEnds > 0 ? 'green' : 'orange'} label={freeTrialLabel} />
            ) : (
              <Chip size='small' label='Recommended Plan' variant='outlined' />
            )}
          </div>
          <MobileIconContainer>
            <CommunityIcon width='150px' height='150px' />
          </MobileIconContainer>
          <Button onClick={onClick}>Upgrade $10/month</Button>
        </Grid>
        <Grid item xs={12} sm={7.5}>
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
            <DesktopIconContainer>
              <EnterpriseIcon width='90px' height='90px' />
            </DesktopIconContainer>
            <Typography variant='h6' mb={1}>
              Enterprise Edition
            </Typography>
            <MobileIconContainer>
              <EnterpriseIcon width='150px' height='150px' />
            </MobileIconContainer>
          </div>
          <Button variant='outlined' href='mailto:hello@charmverse.io'>
            Contact us
          </Button>
        </Grid>
        <Grid item xs={12} sm={7.5}>
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

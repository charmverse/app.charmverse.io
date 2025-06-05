import type { SpaceSubscriptionTier } from '@charmverse/core/prisma';
import CheckIcon from '@mui/icons-material/Check';
import { Box, Chip, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import type { UpgradableTier } from '@packages/subscriptions/constants';
import { subscriptionDetails, tierConfig } from '@packages/subscriptions/constants';
import Image from 'next/image';
import type { ReactNode } from 'react';

import { Button } from 'components/common/Button';
import { useIsAdmin } from 'hooks/useIsAdmin';

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

export function SubscriptionTiers({
  onClickShowCheckoutForm,
  currentTier,
  pendingTier
}: {
  onClickShowCheckoutForm: (tier: UpgradableTier | 'free') => void;
  currentTier: SpaceSubscriptionTier | null;
  pendingTier?: SpaceSubscriptionTier;
}) {
  const isAdmin = useIsAdmin();
  return (
    <>
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4.5} display='flex' flexDirection='column' justifyContent='space-between'>
          <div>
            <DesktopIconContainer>
              <Box mt={-1}>
                <Image width={100} height={100} src={tierConfig.free.iconPath} alt='Free' />
              </Box>
            </DesktopIconContainer>
            <Typography variant='h6'>{tierConfig.free.name}</Typography>
            <Typography variant='body2' sx={{ mb: 1, fontStyle: 'italic', fontWeight: 'bold' }}>
              Free
            </Typography>
            <TierStatusChip currentTier={currentTier} pendingTier={pendingTier} tier='free' />
          </div>
          <MobileIconContainer>
            <Image width={140} height={140} src={tierConfig.free.iconPath} alt='Free' />
          </MobileIconContainer>
          <SelectTierButton
            currentTier={currentTier}
            pendingTier={pendingTier}
            tier='free'
            onClick={onClickShowCheckoutForm}
            isAdmin={isAdmin}
          />
        </Grid>
        <Grid item xs={12} sm={7.5}>
          <Typography fontWeight='bold'>Features included</Typography>
          <List dense sx={{ mt: -1 }}>
            {subscriptionDetails.public.map((detail) => (
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
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4.5} display='flex' flexDirection='column' justifyContent='space-between'>
          <div>
            <DesktopIconContainer>
              <Image width={100} height={100} src={tierConfig.bronze.iconPath} alt='Bronze' />
            </DesktopIconContainer>
            <Typography variant='h6'>{tierConfig.bronze.name}</Typography>
            <Typography variant='body2' sx={{ mb: 1, fontStyle: 'italic', fontWeight: 'bold' }}>
              {tierConfig.bronze.tokenPrice.toLocaleString()} DEV / month
            </Typography>
            <TierStatusChip currentTier={currentTier} pendingTier={pendingTier} tier='bronze' />
          </div>
          <MobileIconContainer>
            <Image width={150} height={150} src={tierConfig.bronze.iconPath} alt='Bronze' />
          </MobileIconContainer>
          <SelectTierButton
            currentTier={currentTier}
            pendingTier={pendingTier}
            tier='bronze'
            onClick={onClickShowCheckoutForm}
            isAdmin={isAdmin}
          />
        </Grid>
        <Grid item xs={12} sm={7.5}>
          <Typography fontWeight='bold'>Features included</Typography>
          <List dense sx={{ mt: -1 }}>
            {subscriptionDetails.bronze.map((detail) => (
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
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4.5} display='flex' flexDirection='column' justifyContent='space-between'>
          <div>
            <DesktopIconContainer>
              <Image width={100} height={100} src={tierConfig.silver.iconPath} alt='Silver' />
            </DesktopIconContainer>
            <Typography variant='h6'>{tierConfig.silver.name}</Typography>
            <Typography variant='body2' sx={{ mb: 1, fontStyle: 'italic', fontWeight: 'bold' }}>
              {tierConfig.silver.tokenPrice.toLocaleString()} DEV / month
            </Typography>
            <TierStatusChip currentTier={currentTier} pendingTier={pendingTier} tier='silver' />
          </div>
          <MobileIconContainer>
            <Image width={150} height={150} src={tierConfig.silver.iconPath} alt='Free' />
          </MobileIconContainer>
          <SelectTierButton
            currentTier={currentTier}
            pendingTier={pendingTier}
            tier='silver'
            onClick={onClickShowCheckoutForm}
            isAdmin={isAdmin}
          />
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Grid item xs={12} sm={7.5}>
          <Typography fontWeight='bold'>Features included</Typography>
          <List dense sx={{ mt: -1 }}>
            {subscriptionDetails.silver.map((detail) => (
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
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4.5} display='flex' flexDirection='column' justifyContent='space-between'>
          <div>
            <DesktopIconContainer>
              <Image width={95} height={95} src={tierConfig.gold.iconPath} alt='Gold' />
            </DesktopIconContainer>
            <Typography variant='h6'>{tierConfig.gold.name}</Typography>
            <Typography variant='body2' sx={{ mb: 1, fontStyle: 'italic', fontWeight: 'bold' }}>
              {tierConfig.gold.tokenPrice.toLocaleString()} DEV / month
            </Typography>
            <TierStatusChip currentTier={currentTier} pendingTier={pendingTier} tier='gold' />
          </div>
          <MobileIconContainer>
            <Image width={150} height={150} src={tierConfig.gold.iconPath} alt='Gold' />
          </MobileIconContainer>
          <SelectTierButton
            currentTier={currentTier}
            pendingTier={pendingTier}
            tier='gold'
            onClick={onClickShowCheckoutForm}
            isAdmin={isAdmin}
          />
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Grid item xs={12} sm={7.5}>
          <Typography fontWeight='bold'>Features included</Typography>
          <List dense sx={{ mt: -1 }}>
            {subscriptionDetails.gold.map((detail) => (
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
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4.5} display='flex' flexDirection='column' justifyContent='space-between'>
          <div>
            <DesktopIconContainer>
              <Image width={95} height={95} src='/images/subscriptions/grant.webp' alt='Grants' />
            </DesktopIconContainer>
            <Typography variant='h6' mb={1}>
              Grants
            </Typography>
            <Typography variant='body2' sx={{ mb: 1, fontStyle: 'italic', fontWeight: 'bold' }}>
              Annual fee starts at 1% of grant size
            </Typography>
            <MobileIconContainer>
              <Image width={150} height={150} src='/images/subscriptions/grant.webp' alt='Grants' />
            </MobileIconContainer>
          </div>
          <Button
            fullWidth
            variant='outlined'
            href='mailto:hello@charmverse.io'
            external
            sx={{ whiteSpace: 'normal', textAlign: 'left' }}
          >
            Contact hello@charmverse.io
          </Button>
        </Grid>
        <Grid item xs={12} sm={7.5}>
          <Typography fontWeight='bold'>Features included</Typography>
          <List dense sx={{ mt: -1 }}>
            {subscriptionDetails.grant.map((detail) => (
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

function TierStatusChip({
  currentTier,
  pendingTier,
  tier
}: {
  currentTier: SpaceSubscriptionTier | null;
  pendingTier?: SpaceSubscriptionTier;
  tier: UpgradableTier | 'free';
}) {
  if (currentTier === tier) {
    return <Chip size='small' label='Current Plan' variant='outlined' />;
  }
  if (pendingTier === tier) {
    return <Chip size='small' label='Pending' variant='outlined' />;
  }
  return null;
}

function SelectTierButton({
  isAdmin,
  currentTier,
  pendingTier,
  tier,
  onClick
}: {
  isAdmin: boolean;
  currentTier: SpaceSubscriptionTier | null;
  pendingTier?: SpaceSubscriptionTier;
  tier: UpgradableTier | 'free';
  onClick: (tier: UpgradableTier | 'free') => void;
}) {
  // only admins can select a tier
  if (!isAdmin) {
    return null;
  }
  // if the tier is pending, don't show the button
  if (pendingTier === tier) {
    return null;
  }
  // if the tier is the current tier, don't show the button unless a new tier is pending
  if (currentTier === tier && !pendingTier) {
    return null;
  }
  return (
    <Button variant='outlined' onClick={() => onClick(tier)}>
      Select
    </Button>
  );
}

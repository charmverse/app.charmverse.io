import type { SpaceSubscriptionTier } from '@charmverse/core/prisma';
import CheckIcon from '@mui/icons-material/Check';
import { Box, Chip, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { subscriptionDetails } from '@packages/lib/subscription/constants';
import Image from 'next/image';
import type { ReactNode } from 'react';

import { Button } from 'components/common/Button';

import Legend from '../../components/Legend';

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
  pendingPayment,
  onClickShowCheckoutForm,
  onClickFreeTier,
  subscriptionTier
}: {
  pendingPayment?: boolean;
  onClickShowCheckoutForm: (tier: SpaceSubscriptionTier) => void;
  onClickFreeTier: () => void;
  subscriptionTier?: SpaceSubscriptionTier;
}) {
  return (
    <>
      <Legend variantMapping={{ inherit: 'div' }} whiteSpace='normal' mb={1}>
        Upgrade CharmVerse
      </Legend>
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4.5} display='flex' flexDirection='column' justifyContent='space-between'>
          <div>
            <DesktopIconContainer>
              <Box mt={-1}>
                <Image width={100} height={100} src='/images/subscriptions/public.webp' alt='Free' />
              </Box>
            </DesktopIconContainer>
            <Typography variant='h6'>Public</Typography>
            <Typography variant='body2' sx={{ mb: 1, fontStyle: 'italic', fontWeight: 'bold' }}>
              Free
            </Typography>
            {subscriptionTier === 'free' ? <Chip size='small' label='Current Plan' /> : null}
          </div>
          <MobileIconContainer>
            <Image width={140} height={140} src='/images/subscriptions/public.webp' alt='Free' />
          </MobileIconContainer>
          {subscriptionTier !== 'free' && (
            <Button fullWidth variant='outlined' onClick={onClickFreeTier} disabled={pendingPayment}>
              Select
            </Button>
          )}
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
      <Divider sx={{ mb: 1 }} />
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4.5} display='flex' flexDirection='column' justifyContent='space-between'>
          <div>
            <DesktopIconContainer>
              <Image width={100} height={100} src='/images/subscriptions/bronze.svg' alt='Bronze' />
            </DesktopIconContainer>
            <Typography variant='h6'>Bronze</Typography>
            <Typography variant='body2' sx={{ mb: 1, fontStyle: 'italic', fontWeight: 'bold' }}>
              1,000 $DEV / month
            </Typography>

            {subscriptionTier === 'bronze' && <Chip size='small' label='Current Plan' variant='outlined' />}
          </div>
          <MobileIconContainer>
            <Image width={150} height={150} src='/images/subscriptions/bronze.svg' alt='Bronze' />
          </MobileIconContainer>
          {subscriptionTier !== 'bronze' && (
            <Button variant='outlined' onClick={() => onClickShowCheckoutForm('bronze')} disabled={pendingPayment}>
              Select
            </Button>
          )}
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
      <Divider sx={{ mb: 1, mt: 2 }} />
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4.5} display='flex' flexDirection='column' justifyContent='space-between'>
          <div>
            <DesktopIconContainer>
              <Image width={100} height={100} src='/images/subscriptions/silver.svg' alt='Silver' />
            </DesktopIconContainer>
            <Typography variant='h6'>Silver</Typography>
            <Typography variant='body2' sx={{ mb: 1, fontStyle: 'italic', fontWeight: 'bold' }}>
              2,500 $DEV / month
            </Typography>
            {subscriptionTier === 'silver' && <Chip size='small' label='Current Plan' variant='outlined' />}
          </div>
          <MobileIconContainer>
            <Image width={150} height={150} src='/images/subscriptions/silver.svg' alt='Free' />
          </MobileIconContainer>
          {subscriptionTier !== 'silver' && (
            <Button variant='outlined' onClick={() => onClickShowCheckoutForm('silver')} disabled={pendingPayment}>
              Select
            </Button>
          )}
        </Grid>
        <Divider sx={{ mb: 1, mt: 2 }} />
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
      <Divider sx={{ mb: 1, mt: 2 }} />
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4.5} display='flex' flexDirection='column' justifyContent='space-between'>
          <div>
            <DesktopIconContainer>
              <Image width={95} height={95} src='/images/subscriptions/gold.svg' alt='Gold' />
            </DesktopIconContainer>
            <Typography variant='h6'>Gold</Typography>
            <Typography variant='body2' sx={{ mb: 1, fontStyle: 'italic', fontWeight: 'bold' }}>
              10,000 $DEV / month
            </Typography>
            {subscriptionTier === 'gold' && <Chip size='small' label='Current Plan' variant='outlined' />}
          </div>
          <MobileIconContainer>
            <Image width={150} height={150} src='/images/subscriptions/gold.svg' alt='Gold' />
          </MobileIconContainer>
          {subscriptionTier !== 'gold' && (
            <Button variant='outlined' onClick={() => onClickShowCheckoutForm('gold')} disabled={pendingPayment}>
              Select
            </Button>
          )}
        </Grid>
        <Divider sx={{ mb: 1, mt: 2 }} />
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
      <Divider sx={{ mb: 1, mt: 2 }} />
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

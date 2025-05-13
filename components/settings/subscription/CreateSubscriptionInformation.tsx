import CheckIcon from '@mui/icons-material/Check';
import { Box, Chip, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import Image from 'next/image';
import type { ReactNode } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { subscriptionDetails } from 'lib/subscription/constants';

import Legend from '../components/Legend';

import { ConfirmFreeDowngradeModal } from './ConfirmFreeDowngradeModal';
import { DevPurchaseButton } from './DevPurchaseForm';
import { useSpaceSubscription } from './hooks/useSpaceSubscription';

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
  onUpgrade,
  pendingPayment,
  spaceId
}: {
  onUpgrade: () => void;
  pendingPayment?: boolean;
  spaceId: string;
}) {
  const { refetchSpaceSubscription, subscriptionTier } = useSpaceSubscription();
  const { isFreeSpace } = useIsFreeSpace();
  const { showMessage } = useSnackbar();
  const { refreshCurrentSpace } = useCurrentSpace();

  const { trigger: switchToFreePlan, isMutating: isSwitchToFreeLoading } = useSWRMutation(
    `spaces/${spaceId}/switch-to-free-tier`,
    () => charmClient.subscription.switchToFreeTier(spaceId),
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

  const { trigger: switchToCommunityPlan, isMutating: isSwitchToCommunityLoading } = useSWRMutation(
    `spaces/${spaceId}/switch-to-community-tier`,
    () => charmClient.subscription.switchToCommunityTier(spaceId),
    {
      onSuccess() {
        refetchSpaceSubscription();
        refreshCurrentSpace();
        showMessage('You have successfully switch to community tier!', 'success');
      },
      onError(err) {
        showMessage(err?.message ?? 'The switch to community tier could not be made. Please try again later.', 'error');
      }
    }
  );

  const {
    isOpen: isConfirmDowngradeDialogOpen,
    close: closeConfirmFreeTierDowngradeDialog,
    open: openConfirmFreeTierDowngradeDialog
  } = usePopupState({ variant: 'popover', popupId: 'susbcription-actions' });

  useTrackPageView({ type: 'billing/marketing' });

  return (
    <>
      <Legend variantMapping={{ inherit: 'div' }} whiteSpace='normal' mb={1}>
        Upgrade CharmVerse
      </Legend>
      <DevPurchaseButton />
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4.5}>
          <DesktopIconContainer>
            <Box mt={-1}>
              <Image width={100} height={100} src='/images/subscriptions/public.webp' alt='Free' />
            </Box>
          </DesktopIconContainer>
          <Typography variant='h6'>Public</Typography>
          <Typography variant='body2' sx={{ mb: 1, fontStyle: 'italic', fontWeight: 'bold' }}>
            Free
          </Typography>
          {!isFreeSpace ? <Chip size='small' label='Current Plan' /> : null}
          <MobileIconContainer>
            <Image width={140} height={140} src='/images/subscriptions/public.webp' alt='Free' />
          </MobileIconContainer>
          {!isFreeSpace && (
            <>
              <Button
                fullWidth
                variant='outlined'
                onClick={openConfirmFreeTierDowngradeDialog}
                disabled={pendingPayment || isSwitchToFreeLoading}
              >
                Switch to Public
              </Button>
              <ConfirmFreeDowngradeModal
                isOpen={isConfirmDowngradeDialogOpen}
                onClose={closeConfirmFreeTierDowngradeDialog}
                disabled={isSwitchToFreeLoading}
                onConfirmDowngrade={switchToFreePlan}
              />
            </>
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
            <Button
              variant='outlined'
              onClick={switchToCommunityPlan}
              disabled={pendingPayment || isSwitchToCommunityLoading}
            >
              Switch to Bronze
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
            <Button
              variant='outlined'
              onClick={switchToCommunityPlan}
              disabled={pendingPayment || isSwitchToCommunityLoading}
            >
              Switch to Silver
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
            <Button
              variant='outlined'
              onClick={switchToCommunityPlan}
              disabled={pendingPayment || isSwitchToCommunityLoading}
            >
              Switch to Gold
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
              Grant
            </Typography>
            <Typography variant='body2' sx={{ mb: 1, fontStyle: 'italic', fontWeight: 'bold' }}>
              Annual fee starts at 1% of grant size*
            </Typography>
            <MobileIconContainer>
              <Image width={150} height={150} src='/images/subscriptions/grant.webp' alt='Grant' />
            </MobileIconContainer>
          </div>
          {subscriptionTier !== 'grant' && (
            <Button
              variant='outlined'
              onClick={switchToCommunityPlan}
              disabled={pendingPayment || isSwitchToCommunityLoading}
            >
              Switch to Grant
            </Button>
          )}
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

import CheckIcon from '@mui/icons-material/Check';
import { Box, Chip, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { subscriptionDetails } from 'lib/subscription/constants';
import CommunityIcon from 'public/images/subscriptions/community.svg';
import EnterpriseIcon from 'public/images/subscriptions/enterprise.svg';
import FreeIcon from 'public/images/subscriptions/free.svg';

import Legend from '../Legend';

import { ConfirmFreeDowngradeModal } from './ConfirmFreeDowngradeModal';
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
  const { refetchSpaceSubscription, paidTier } = useSpaceSubscription();
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
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4.5}>
          <DesktopIconContainer>
            <Box mt={-1}>
              <FreeIcon width='100px' height='100px' />
            </Box>
          </DesktopIconContainer>
          <Typography variant='h6' mb={1}>
            Public Good
          </Typography>
          {isFreeSpace ? <Chip size='small' label='Current Plan' /> : null}
          <MobileIconContainer>
            <FreeIcon width='140px' height='140px' />
          </MobileIconContainer>
          {!isFreeSpace && (
            <>
              <Button
                fullWidth
                variant='outlined'
                onClick={openConfirmFreeTierDowngradeDialog}
                disabled={pendingPayment || isSwitchToFreeLoading}
              >
                Switch to public good
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
              Community
            </Typography>

            <Chip
              size='small'
              label={paidTier === 'community' ? 'Current Plan' : 'Recommended Plan'}
              variant='outlined'
            />
          </div>
          <MobileIconContainer>
            <CommunityIcon width='150px' height='150px' />
          </MobileIconContainer>
          <Button onClick={onUpgrade} disabled={pendingPayment}>
            {pendingPayment ? 'Payment pending' : 'Get more blocks'}
          </Button>
        </Grid>
        <Grid item xs={12} sm={7.5}>
          <Typography fontWeight='bold'>Features included</Typography>
          <List dense sx={{ mt: -1 }}>
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
              Enterprise
            </Typography>
            <MobileIconContainer>
              <EnterpriseIcon width='150px' height='150px' />
            </MobileIconContainer>
          </div>
          <Button fullWidth variant='outlined' href='mailto:hello@charmverse.io'>
            Contact us for pricing
          </Button>
        </Grid>
        <Grid item xs={12} sm={7.5}>
          <Typography fontWeight='bold'>Features included</Typography>
          <List dense sx={{ mt: -1 }}>
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

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { bindPopover } from 'material-ui-popup-state';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import { Button } from 'components/common/Button';
import { TwoFactorAuthSetupModal } from 'components/settings/account/components/otp/components/TwoFactorAuthModal';
import { TwoFactorAuthProvider } from 'components/settings/account/components/otp/hooks/useTwoFactorAuth';
import Legend from 'components/settings/Legend';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { useUser } from 'hooks/useUser';

export function TwoFactorAuthUser() {
  const otpSetupModal = usePopupState({ variant: 'popover', popupId: 'otp-setup' });
  const { user } = useUser();
  const activeOtp = !!user?.userOTP?.activatedAt;

  const isCharmverseSpace = useIsCharmverseSpace();

  if (!isCharmverseSpace) {
    return null;
  }

  return (
    <TwoFactorAuthProvider onClose={otpSetupModal.close}>
      <Box mt={4}>
        <Legend
          noBorder
          helperText='Use a mobile authentication app to get a verification code to enter CharmVerse everytime you login.'
        >
          Two-factor Authentication
        </Legend>
        {activeOtp ? (
          <Typography>You have configured 2fa.</Typography>
        ) : (
          <Button sx={{ mt: 1, display: 'block' }} {...bindTrigger(otpSetupModal)}>
            Click here to configure 2fa
          </Button>
        )}
        <TwoFactorAuthSetupModal {...bindPopover(otpSetupModal)} />
      </Box>
    </TwoFactorAuthProvider>
  );
}

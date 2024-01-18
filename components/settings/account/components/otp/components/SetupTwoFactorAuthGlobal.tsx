import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { useUser } from 'hooks/useUser';

import { TwoFactorAuthSetupModal } from './TwoFactorAuthSetupModal';

export function SetupTwoFactorAuthGlobal() {
  const otpSetupModal = usePopupState({ variant: 'popover', popupId: 'otp-setup' });
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const activeOtp = !!user?.userOTP?.activatedAt;
  const spaceRequiresOtp = !!space?.requireMembersTwoFactorAuth;
  const isCharmverseSpace = useIsCharmverseSpace();

  useEffect(() => {
    if (!activeOtp && spaceRequiresOtp && otpSetupModal.isOpen === false && isCharmverseSpace) {
      otpSetupModal.open();
    }
  }, [activeOtp, spaceRequiresOtp, isCharmverseSpace]);

  if (
    !isCharmverseSpace ||
    !user ||
    !space?.requireMembersTwoFactorAuth ||
    (user.userOTP?.activatedAt && !otpSetupModal.isOpen)
  ) {
    return null;
  }

  const onClose = activeOtp && spaceRequiresOtp ? otpSetupModal.close : undefined;

  return (
    <TwoFactorAuthSetupModal
      {...bindPopover(otpSetupModal)}
      onClose={onClose}
      title={
        <Box>
          <Typography variant='h5' mb={1}>
            Secure your account
          </Typography>
          <Typography variant='body2'>This space requires two factor authentication</Typography>
        </Box>
      }
    />
  );
}

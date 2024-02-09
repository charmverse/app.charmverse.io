import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';

import { TwoFactorAuthSetupModal } from './TwoFactorAuthSetupModal';

export function SetupTwoFactorAuthGlobal() {
  const otpSetupModal = usePopupState({ variant: 'popover', popupId: 'otp-setup' });
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const activeOtp = !!user?.otp?.activatedAt;
  const spaceRequiresOtp = !!space?.requireMembersTwoFactorAuth;

  useEffect(() => {
    if (!activeOtp && spaceRequiresOtp && otpSetupModal.isOpen === false) {
      otpSetupModal.open();
    }
  }, [activeOtp, spaceRequiresOtp]);

  if (!user || !space?.requireMembersTwoFactorAuth || (user.otp?.activatedAt && !otpSetupModal.isOpen)) {
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

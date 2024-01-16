import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { bindPopover } from 'material-ui-popup-state';
import { bindPopper, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import { Button } from 'components/common/Button';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { TwoFactorAuthSetupModal } from 'components/settings/account/components/otp/components/TwoFactorAuthSetupModal';
import { TwoFactorAuthProvider } from 'components/settings/account/components/otp/hooks/useTwoFactorAuth';
import Legend from 'components/settings/Legend';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { useUser } from 'hooks/useUser';

import { GetQrCodeModal } from './otp/components/GetQrCodeModal';
import { ResetRecoveryCodeModal } from './otp/components/ResetRecoveryCodeModal';

export function TwoFactorAuthUser() {
  const otpSetupModal = usePopupState({ variant: 'popover', popupId: 'otp-setup' });
  const getQrCodeModal = usePopupState({ variant: 'popover', popupId: 'qr-code' });
  const resetRecoveryCodeModal = usePopupState({ variant: 'popover', popupId: 'reset-recovery-code' });
  const confirmResetRecoveryCodeModal = usePopupState({ variant: 'popover', popupId: 'confirm-reset-recovery-code' });
  const { user, refreshUser } = useUser();
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
          <>
            <Typography mb={1}>You have configured 2fa.</Typography>
            <Typography mb={1}>Available actions:</Typography>
            <Button
              variant='text'
              sx={{ px: 0, display: 'block', '&:hover': { background: 'transparent' } }}
              {...bindTrigger(getQrCodeModal)}
            >
              Scan your QR code
            </Button>
            <Button
              variant='text'
              sx={{ px: 0, display: 'block', '&:hover': { background: 'transparent' } }}
              {...bindTrigger(confirmResetRecoveryCodeModal)}
            >
              Reset recovery code
            </Button>
          </>
        ) : (
          <Button sx={{ mt: 1, display: 'block' }} {...bindTrigger(otpSetupModal)}>
            Click here to configure 2fa
          </Button>
        )}
        <TwoFactorAuthSetupModal {...bindPopover(otpSetupModal)} />
        <GetQrCodeModal {...bindPopover(getQrCodeModal)} />
        <ResetRecoveryCodeModal {...bindPopover(resetRecoveryCodeModal)} />
        <ConfirmDeleteModal
          title='Reset backup code'
          buttonText='Reset'
          question='This action will replace your existing recovery code. Continue?'
          onConfirm={resetRecoveryCodeModal.open}
          onClose={confirmResetRecoveryCodeModal.close}
          {...bindPopper(confirmResetRecoveryCodeModal)}
        />
      </Box>
    </TwoFactorAuthProvider>
  );
}

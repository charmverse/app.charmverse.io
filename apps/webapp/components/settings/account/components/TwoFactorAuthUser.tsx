import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { bindPopover } from 'material-ui-popup-state';
import { bindPopper, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import { Button } from 'components/common/Button';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { TwoFactorAuthSetupModal } from 'components/settings/account/components/otp/components/TwoFactorAuthSetupModal';
import Legend from 'components/settings/components/Legend';
import { useUser } from 'hooks/useUser';

import { DeleteOtpModal } from './otp/components/DeleteOtpModal';
import { GetQrCodeModal } from './otp/components/GetQrCodeModal';
import { ResetRecoveryCodeModal } from './otp/components/ResetRecoveryCodeModal';

export function TwoFactorAuthUser() {
  const otpSetupModal = usePopupState({ variant: 'popover', popupId: 'otp-setup' });
  const getQrCodeModal = usePopupState({ variant: 'popover', popupId: 'qr-code' });
  const resetRecoveryCodeModal = usePopupState({ variant: 'popover', popupId: 'reset-recovery-code' });
  const confirmResetRecoveryCodeModal = usePopupState({ variant: 'popover', popupId: 'confirm-reset-recovery-code' });
  const confirmDisableOtpModal = usePopupState({ variant: 'popover', popupId: 'confirm-disable-otp' });
  const deleteOtpModal = usePopupState({ variant: 'popover', popupId: 'delete-otp' });
  const { user } = useUser();
  const activeOtp = !!user?.otp?.activatedAt;

  return (
    <Box mt={4}>
      <Legend
        noBorder
        wrap
        helperText='Use a mobile authentication app to get a verification code to enter CharmVerse everytime you login.'
      >
        Two-factor Authentication
      </Legend>
      {activeOtp ? (
        <>
          <Typography mb={1}>Two-factor authentication is On.</Typography>
          <Button
            variant='text'
            sx={{ px: 0, display: 'block', '&:hover': { background: 'transparent' } }}
            data-test='account-get-qr-code-btn'
            {...bindTrigger(getQrCodeModal)}
          >
            Scan your QR code
          </Button>
          <Button
            variant='text'
            sx={{ px: 0, display: 'block', '&:hover': { background: 'transparent' } }}
            data-test='account-reset-recovery-code-btn'
            {...bindTrigger(confirmResetRecoveryCodeModal)}
          >
            Reset recovery code
          </Button>
          <Button
            variant='text'
            sx={{ px: 0, display: 'block', '&:hover': { background: 'transparent' }, textAlign: 'left' }}
            data-test='account-disable-otp-btn'
            {...bindTrigger(confirmDisableOtpModal)}
          >
            Turn off
          </Button>
        </>
      ) : (
        <Button sx={{ mt: 1, display: 'block' }} {...bindTrigger(otpSetupModal)} data-test='account-config-twofa-btn'>
          Get Started
        </Button>
      )}
      <TwoFactorAuthSetupModal {...bindPopover(otpSetupModal)} />
      <GetQrCodeModal {...bindPopover(getQrCodeModal)} />
      <ResetRecoveryCodeModal {...bindPopover(resetRecoveryCodeModal)} />
      <DeleteOtpModal {...bindPopover(deleteOtpModal)} />
      <ConfirmDeleteModal
        title='Reset backup code'
        buttonText='Reset'
        question='This action will replace your existing recovery code. Continue?'
        onConfirm={resetRecoveryCodeModal.open}
        onClose={confirmResetRecoveryCodeModal.close}
        {...bindPopper(confirmResetRecoveryCodeModal)}
      />
      <ConfirmDeleteModal
        title='Turn off two factor authentication'
        buttonText='Confirm'
        question='This action will remove your current configuration. Continue?'
        onConfirm={deleteOtpModal.open}
        onClose={confirmDisableOtpModal.close}
        {...bindPopper(confirmDisableOtpModal)}
      />
    </Box>
  );
}

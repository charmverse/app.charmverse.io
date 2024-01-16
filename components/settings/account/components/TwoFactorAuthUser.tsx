import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { bindPopover } from 'material-ui-popup-state';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import { useDeleteUserOtp } from 'charmClient/hooks/profile';
import { Button } from 'components/common/Button';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { TwoFactorAuthSetupModal } from 'components/settings/account/components/otp/components/TwoFactorAuthSetupModal';
import { TwoFactorAuthProvider } from 'components/settings/account/components/otp/hooks/useTwoFactorAuth';
import Legend from 'components/settings/Legend';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { useUser } from 'hooks/useUser';

import { GetQrCodeModal } from './otp/components/GetQrCodeModal';

export function TwoFactorAuthUser() {
  const otpSetupModal = usePopupState({ variant: 'popover', popupId: 'otp-setup' });
  const getQrCodeModal = usePopupState({ variant: 'popover', popupId: 'qr-code' });
  const deleteOtpModal = usePopupState({ variant: 'popover', popupId: 'delete-otp' });
  const { space } = useCurrentSpace();
  const { user, refreshUser } = useUser();
  const activeOtp = !!user?.userOTP?.activatedAt;
  const { trigger: deleteOtp, isMutating: isDeleteOtpLoading } = useDeleteUserOtp();

  const isCharmverseSpace = useIsCharmverseSpace();

  const onDelete = async () => {
    await deleteOtp();
    await refreshUser();
    otpSetupModal.close();

    if (space?.requireMembersTwoFactorAuth) {
      otpSetupModal.open();
    }
  };

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
              {...bindTrigger(deleteOtpModal)}
            >
              Delete 2fa
            </Button>
          </>
        ) : (
          <Button sx={{ mt: 1, display: 'block' }} {...bindTrigger(otpSetupModal)}>
            Click here to configure 2fa
          </Button>
        )}
        <TwoFactorAuthSetupModal {...bindPopover(otpSetupModal)} />
        <GetQrCodeModal {...bindPopover(getQrCodeModal)} />
        <ConfirmDeleteModal
          title='Delete 2fa configuration'
          buttonText='Delete'
          secondaryButtonText='Cancel'
          question='Are you sure you want delete your 2fa configuration? If your space requires 2fa you will need to configure it again.'
          disabled={isDeleteOtpLoading}
          onConfirm={onDelete}
          {...bindPopover(deleteOtpModal)}
        />
      </Box>
    </TwoFactorAuthProvider>
  );
}

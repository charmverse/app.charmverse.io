import { useRouter } from 'next/router';
import type { Ref } from 'react';
import { forwardRef, useState } from 'react';

import { useVerifyRecoveryCode, useVerifyOtp } from 'charmClient/hooks/profile';
import type { ModalProps } from 'components/common/Modal';
import Modal from 'components/common/Modal';
import { BackupCodes } from 'components/settings/account/components/otp/components/BackupCodes';
import { ConfirmAuthCode } from 'components/settings/account/components/otp/components/ConfirmAuthCode';
import { ConfirmRecoveryCode } from 'components/settings/account/components/otp/components/ConfirmRecoveryCode';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

export function CustomModal({ onClose, ...props }: Omit<ModalProps, 'children'>, ref: Ref<HTMLDivElement>) {
  const { trigger: validateOtp, error: otpError, isMutating: otpIsLoading } = useVerifyOtp();
  const {
    data: validateRecoveryCodeData,
    trigger: validateRecoveryCode,
    error: validateRecoveryCodeError,
    isMutating: validateRecoveryCodeIsLoading
  } = useVerifyRecoveryCode();
  const { setUser } = useUser();
  const router = useRouter();
  const { showMessage } = useSnackbar();
  const [type, setType] = useState<'otp' | 'recovery' | 'success'>('otp');

  const user = validateRecoveryCodeData?.user;

  const handleRedirect = () => {
    // If user is in an authenticate page we need to push the user to the login page where RouteGuard will handle the user redirect
    if (router.pathname.startsWith('/authenticate')) {
      router.push('/');
    } else {
      // When user is populated, we just need to reload the page
      router.reload();
    }
  };

  const handleClose = () => {
    onClose?.();
    setType('otp');
  };

  const handleSubmitOtp = async (authCode: string) => {
    await validateOtp(
      { authCode },
      {
        onSuccess: (_user) => {
          // User will be redirected to his space after we populate the user state. Check RouteGuard for more details.
          showMessage(`Logged in. Redirecting you now`, 'success');
          handleClose();
          setUser(_user);
          handleRedirect();
        }
      }
    );
  };

  const handleSubmitBackupCode = async (backupCode: string) => {
    await validateRecoveryCode({ backupCode }, { onSuccess: () => setType('success') });
  };

  const handleLogin = async () => {
    if (user) {
      handleClose();
      setUser(user);
      handleRedirect();
    }
  };

  return (
    <Modal
      title='Two factor authentication'
      size='small'
      ref={ref}
      onClose={type !== 'success' ? handleClose : undefined}
      {...props}
    >
      {type === 'otp' && (
        <ConfirmAuthCode
          errorMessage={otpError?.message}
          loading={otpIsLoading}
          onSubmit={handleSubmitOtp}
          changeType={() => setType('recovery')}
        />
      )}
      {type === 'recovery' && (
        <ConfirmRecoveryCode
          errorMessage={validateRecoveryCodeError?.message}
          loading={validateRecoveryCodeIsLoading}
          onSubmit={handleSubmitBackupCode}
          changeType={() => setType('otp')}
        />
      )}
      {type === 'success' && validateRecoveryCodeData && (
        <BackupCodes recoveryCode={validateRecoveryCodeData.backupCode} onSubmit={handleLogin} />
      )}
    </Modal>
  );
}

export const VerifyLoginOtpModal = forwardRef<HTMLDivElement, Omit<ModalProps, 'children'>>(CustomModal);

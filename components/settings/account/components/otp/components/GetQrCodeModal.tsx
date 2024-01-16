import { forwardRef } from 'react';

import { useGetUserOtp } from 'charmClient/hooks/profile';
import type { ModalProps } from 'components/common/Modal';
import Modal from 'components/common/Modal';

import { CodeDetails } from './CodeDetails';
import { ConfirmAuthCode } from './ConfirmAuthCode';

export function CustomModal({ onClose, ...props }: Omit<ModalProps, 'children'>) {
  const {
    data: otpData,
    trigger: getOtp,
    error: getOtpError,
    isMutating: isOtpLoading,
    reset: resetOtpData
  } = useGetUserOtp();

  const onSubmit = async (authCode: string) => {
    await getOtp({ authCode });
  };

  const handleClose = () => {
    resetOtpData();
    onClose?.();
  };

  return (
    <Modal title='Two factor authentication' size='medium' onClose={handleClose} {...props}>
      {otpData ? (
        <CodeDetails onSubmit={handleClose} uri={otpData.uri} code={otpData.code} btnText='Close' />
      ) : (
        <ConfirmAuthCode errorMessage={getOtpError?.message} loading={isOtpLoading} onSubmit={onSubmit} />
      )}
    </Modal>
  );
}

export const GetQrCodeModal = forwardRef(CustomModal);

import type { Ref } from 'react';
import { forwardRef } from 'react';

import { useGetOtp } from 'charmClient/hooks/profile';
import type { ModalProps } from 'components/common/Modal';
import Modal from 'components/common/Modal';

import { CodeDetails } from './CodeDetails';
import { ConfirmAuthCode } from './ConfirmAuthCode';

export function CustomModal({ onClose, ...props }: Omit<ModalProps, 'children'>, ref: Ref<HTMLDivElement>) {
  const {
    data: otpData,
    trigger: getOtp,
    error: getOtpError,
    isMutating: isOtpLoading,
    reset: resetOtpData
  } = useGetOtp();

  const onSubmit = async (authCode: string) => {
    await getOtp({ authCode });
  };

  const handleClose = () => {
    resetOtpData();
    onClose?.();
  };

  return (
    <Modal title='Two factor authentication' size='medium' onClose={handleClose} ref={ref} {...props}>
      {otpData ? (
        <CodeDetails onSubmit={handleClose} uri={otpData.uri} code={otpData.code} btnText='Close' />
      ) : (
        <ConfirmAuthCode errorMessage={getOtpError?.message} loading={isOtpLoading} onSubmit={onSubmit} />
      )}
    </Modal>
  );
}

export const GetQrCodeModal = forwardRef<HTMLDivElement, Omit<ModalProps, 'children'>>(CustomModal);

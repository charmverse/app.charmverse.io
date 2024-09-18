import type { Ref } from 'react';
import { forwardRef } from 'react';

import { useResetRecoveryCode } from 'charmClient/hooks/profile';
import type { ModalProps } from 'components/common/Modal';
import Modal from 'components/common/Modal';

import { BackupCodes } from './BackupCodes';
import { ConfirmAuthCode } from './ConfirmAuthCode';

export function CustomModal({ onClose, ...props }: Omit<ModalProps, 'children'>, ref: Ref<HTMLDivElement>) {
  const {
    data: recoveryCodeData,
    trigger: getRecoveryCode,
    error: recoveryCodeError,
    isMutating: isLoadingRecoveryCode,
    reset: resetRecoveryData
  } = useResetRecoveryCode();

  const onSubmit = async (authCode: string) => {
    await getRecoveryCode({ authCode });
  };

  const handleClose = () => {
    resetRecoveryData();
    onClose?.();
  };

  return (
    <Modal title='Two factor authentication' size='medium' onClose={handleClose} ref={ref} {...props}>
      {recoveryCodeData ? (
        <BackupCodes recoveryCode={recoveryCodeData.recoveryCode} onSubmit={handleClose} />
      ) : (
        <ConfirmAuthCode
          errorMessage={recoveryCodeError?.message}
          loading={isLoadingRecoveryCode}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

export const ResetRecoveryCodeModal = forwardRef<HTMLDivElement, Omit<ModalProps, 'children'>>(CustomModal);

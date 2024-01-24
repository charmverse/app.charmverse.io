import type { Ref } from 'react';
import { forwardRef } from 'react';

import { useDeleteOtp } from 'charmClient/hooks/profile';
import type { ModalProps } from 'components/common/Modal';
import Modal from 'components/common/Modal';
import { useUser } from 'hooks/useUser';

import { ConfirmAuthCode } from './ConfirmAuthCode';

export function CustomModal({ onClose, ...props }: Omit<ModalProps, 'children'>, ref: Ref<HTMLDivElement>) {
  const { trigger: deleteOtp, error: deleteOtpError, isMutating: isLoadingDeleteOtp } = useDeleteOtp();
  const { refreshUser } = useUser();

  const onSubmit = async (authCode: string) => {
    await deleteOtp({ authCode });
    refreshUser();
    onClose?.();
  };

  return (
    <Modal title='Two factor authentication' size='medium' onClose={onClose} ref={ref} {...props}>
      <ConfirmAuthCode errorMessage={deleteOtpError?.message} loading={isLoadingDeleteOtp} onSubmit={onSubmit} />
    </Modal>
  );
}

export const DeleteOtpModal = forwardRef(CustomModal);

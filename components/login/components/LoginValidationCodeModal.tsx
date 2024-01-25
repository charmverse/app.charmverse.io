import { useRouter } from 'next/router';
import type { Ref } from 'react';
import { forwardRef } from 'react';

import { useVerifyOtp } from 'charmClient/hooks/profile';
import type { ModalProps } from 'components/common/Modal';
import Modal from 'components/common/Modal';
import { ConfirmAuthCode } from 'components/settings/account/components/otp/components/ConfirmAuthCode';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

export function CustomModal({ onClose, ...props }: Omit<ModalProps, 'children'>, ref: Ref<HTMLDivElement>) {
  const { trigger, error, isMutating } = useVerifyOtp();
  const { setUser } = useUser();
  const router = useRouter();

  const { showMessage } = useSnackbar();

  const onSubmit = async (authCode: string) => {
    await trigger(
      { authCode },
      {
        onSuccess: (_user) => {
          // User will be redirected to his space after we populate the user state. Check RouteGuard for more details.
          showMessage(`Logged in. Redirecting you now`, 'success');
          setUser(_user);
          onClose?.();
          router.push('/');
        }
      }
    );
  };

  return (
    <Modal title='Two factor authentication' size='medium' ref={ref} {...props}>
      <ConfirmAuthCode errorMessage={error?.message} loading={isMutating} onSubmit={onSubmit} />
    </Modal>
  );
}

export const LoginValidationCodeModal = forwardRef(CustomModal);

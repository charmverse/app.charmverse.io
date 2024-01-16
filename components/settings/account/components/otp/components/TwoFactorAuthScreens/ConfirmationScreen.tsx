import { useActivateOtp, useVerifyOtp } from 'charmClient/hooks/profile';
import { useUser } from 'hooks/useUser';

import { useTwoFactorAuth } from '../../hooks/useTwoFactorAuth';
import { ConfirmAuthCode } from '../ConfirmAuthCode';

export function ConfirmationScreen() {
  const { trigger: verifyOtp, error: verifyOtpError, isMutating: isValidationLoading } = useVerifyOtp();
  const { trigger: activateOtp, error: activateOtpError, isMutating: isActivationLoading } = useActivateOtp();
  const { setFlow } = useTwoFactorAuth();
  const { refreshUser } = useUser();

  const onSubmit = async (code: string) => {
    await verifyOtp({ code });
    await activateOtp(undefined, {
      onSuccess: () => {
        setFlow('finish');
        refreshUser();
      }
    });
  };

  const isLoading = isValidationLoading || isActivationLoading;
  const error = verifyOtpError?.message || activateOtpError?.message;

  return <ConfirmAuthCode errorMessage={error} loading={isLoading} onSubmit={onSubmit} />;
}

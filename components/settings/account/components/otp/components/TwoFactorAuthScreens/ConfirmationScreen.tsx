import { useActivateOtp } from 'charmClient/hooks/profile';
import { useUser } from 'hooks/useUser';

import { useTwoFactorAuth } from '../../hooks/useTwoFactorAuth';
import { ConfirmAuthCode } from '../ConfirmAuthCode';

export function ConfirmationScreen() {
  const { trigger: activateOtp, error: activateOtpError, isMutating: isActivationLoading } = useActivateOtp();
  const { setFlow } = useTwoFactorAuth();
  const { refreshUser } = useUser();

  const onSubmit = async (authCode: string) => {
    await activateOtp(
      { authCode },
      {
        onSuccess: () => {
          setFlow('finish');
          refreshUser();
        }
      }
    );
  };

  return <ConfirmAuthCode errorMessage={activateOtpError?.message} loading={isActivationLoading} onSubmit={onSubmit} />;
}

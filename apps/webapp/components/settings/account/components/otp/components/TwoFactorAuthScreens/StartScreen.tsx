import { useTwoFactorAuth } from '../../hooks/useTwoFactorAuth';
import { StartSetup } from '../StartSetup';

export function StartScreen() {
  const { setFlow, trigger, isLoading, error } = useTwoFactorAuth();

  const onSubmit = async () => {
    await trigger(undefined, { onSuccess: () => setFlow('link') });
  };

  return <StartSetup onSubmit={onSubmit} loading={isLoading} errorMessage={error?.message} />;
}

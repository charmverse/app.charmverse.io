import { useTwoFactorAuth } from '../../hooks/useTwoFactorAuth';
import { BackupCodes } from '../BackupCodes';

export function FinishScreen({ onClose }: { onClose?: () => void }) {
  const { data, error, isLoading } = useTwoFactorAuth();

  return (
    <BackupCodes
      recoveryCode={data?.recoveryCode}
      errorMessage={error?.message}
      onSubmit={onClose}
      loading={isLoading}
    />
  );
}

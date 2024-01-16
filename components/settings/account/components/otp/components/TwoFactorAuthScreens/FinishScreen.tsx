import { useTwoFactorAuth } from '../../hooks/useTwoFactorAuth';
import { BackupCodes } from '../BackupCodes';

export function FinishScreen() {
  const { handleClose, data, error, isLoading } = useTwoFactorAuth();

  return (
    <BackupCodes
      recoveryCode={data?.recoveryCode}
      errorMessage={error?.message}
      onSubmit={handleClose}
      loading={isLoading}
    />
  );
}

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useForm } from 'react-hook-form';

import { useActivateOtp, useVerifyOtp } from 'charmClient/hooks/profile';
import { Button } from 'components/common/Button';
import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import { useUser } from 'hooks/useUser';

import { useTwoFactorAuth } from '../hooks/useTwoFactorAuth';

export function ConfirmationScreen() {
  const { trigger: verifyOtp, error: verifyOtpError, isMutating: isValidationLoading } = useVerifyOtp();
  const { trigger: activateOtp, error: activateOtpError, isMutating: isActivationLoading } = useActivateOtp();
  const { setFlow } = useTwoFactorAuth();
  const { refreshUser } = useUser();

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors }
  } = useForm<{ code: string }>({
    defaultValues: { code: '' }
  });

  const code = watch('code');

  const onSubmit = async () => {
    await verifyOtp({ code });
    await activateOtp(undefined, {
      onSuccess: () => {
        setFlow('finish');
        refreshUser();
      }
    });
  };

  const isLoading = isValidationLoading || isActivationLoading;
  const error = verifyOtpError?.message || activateOtpError?.message || errors.code?.message;

  return (
    <Box>
      <Typography variant='h5' mb={2}>
        Enter the confirmation code
      </Typography>
      <Typography mb={2}>
        Follow the instructions on the authenticator app to link your CharmVerse account. Once the authenticator app
        generates a confirmation code enter it here.
      </Typography>
      <Box maxWidth={300}>
        <NumberInputField
          error={error}
          disabled={isLoading}
          helperText={error}
          {...register('code', {
            required: true,
            validate: (val) => String(val).length === 6 || 'Must be exactly 6 characters'
          })}
        />
      </Box>
      <Button sx={{ mt: 2 }} onClick={handleSubmit(onSubmit)} loading={isLoading} disabled={isLoading}>
        CONFIRM
      </Button>
    </Box>
  );
}

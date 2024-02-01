import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useForm } from 'react-hook-form';

import { Button } from 'components/common/Button';
import { NumberInputField } from 'components/common/form/fields/NumberInputField';

export type Props = {
  loading?: boolean;
  errorMessage?: string;
  onSubmit: (code: string) => Promise<void>;
};

export function ConfirmAuthCode({ onSubmit, errorMessage, loading }: Props) {
  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors }
  } = useForm<{ code: string }>({
    defaultValues: { code: '' }
  });
  const error = errors.code?.message || errorMessage;

  const onSubmitCode = async () => {
    const code = getValues('code');
    await onSubmit(code);
  };

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
          disabled={loading}
          helperText={error}
          data-test='confirm-auth-code-input'
          disableArrows
          placeholder='e.g. 123456'
          {...register('code', {
            required: true,
            validate: (val) => String(val).length === 6 || 'Must be exactly 6 characters'
          })}
        />
      </Box>
      <Button
        sx={{ mt: 2 }}
        onClick={handleSubmit(onSubmitCode)}
        loading={loading}
        disabled={loading}
        data-test='two-factor-auth-next'
      >
        Confirm
      </Button>
    </Box>
  );
}

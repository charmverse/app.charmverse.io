import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { charmverseDiscordInvite } from '@packages/config/constants';
import { useForm } from 'react-hook-form';

import { Button } from 'components/common/Button';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import Link from 'components/common/Link';

type Props = {
  changeType?: () => void;
  loading?: boolean;
  errorMessage?: string;
  onSubmit: (code: string) => Promise<void>;
};

export function ConfirmRecoveryCode({ onSubmit, errorMessage, loading, changeType }: Props) {
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
        Enter your backup code
      </Typography>
      <Box maxWidth={300} mb={1}>
        <TextInputField
          error={error}
          disabled={loading}
          helperText={error}
          data-test='confirm-reset-code-input'
          placeholder='e.g. 1B3423G6VCI01F'
          {...register('code', { required: true })}
        />
      </Box>
      <Box mb={1}>
        {changeType && (
          <Button
            sx={{ display: 'block', px: 0, '&:hover': { background: 'transparent' } }}
            variant='text'
            onClick={changeType}
          >
            Use authenticator app
          </Button>
        )}
        <Link href={charmverseDiscordInvite} variant='body2' external target='_blank'>
          Contact Charmverse Support
        </Link>
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

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { charmverseDiscordInvite } from '@packages/config/constants';
import { useForm } from 'react-hook-form';

import { Button } from 'components/common/Button';
import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import Link from 'components/common/Link';

type Props = {
  changeType?: () => void;
  loading?: boolean;
  errorMessage?: string;
  onSubmit: (code: string) => Promise<void>;
};

export function ConfirmAuthCode({ onSubmit, errorMessage, loading, changeType }: Props) {
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
      <Box maxWidth={300} mb={1}>
        <NumberInputField
          error={error}
          disabled={loading}
          fullWidth
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
      <Box mb={1}>
        {changeType && (
          <Button
            sx={{ display: 'block', px: 0, '&:hover': { background: 'transparent' } }}
            variant='text'
            onClick={changeType}
          >
            Use backup code
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

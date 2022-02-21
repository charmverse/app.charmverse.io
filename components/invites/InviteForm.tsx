import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/settings/FieldLabel';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { Prisma, Space } from '@prisma/client';
import { DialogTitle } from 'components/common/Modal';
import { useForm } from 'react-hook-form';
import { DOMAIN_BLACKLIST } from 'models/Space';
import charmClient from 'charmClient';

export const schema = yup.object({
  maxAge: yup.number().required(),
  maxUses: yup.number().required()
});

export type FormValues = yup.InferType<typeof schema>;

interface Props {
  defaultValues?: { name: string, domain: string };
  onCancel?: () => void;
  onSubmit: (values: FormValues) => void;
  submitText?: string;
}

export default function WorkspaceSettings ({ onSubmit: _onSubmit, onCancel }: Props) {

  const [space] = useCurrentSpace();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<FormValues & { apiError?: string }>({
    resolver: yupResolver(schema)
  });

  function onSubmit (values: FormValues) {
    try {
      _onSubmit(values);
    }
    catch (e) {
      setError('apiError', {
        message: (e as Error).message || e as string
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle onClose={onCancel}>
        Invite friends to
        {' '}
        {space?.name}
      </DialogTitle>
      <Divider />
      <br />
      <Grid container direction='column' spacing={3}>
        <Grid item>
          <FieldLabel>Expire after</FieldLabel>
          <TextField
            {...register('maxAge')}
            autoFocus
            fullWidth
            error={!!errors.maxAge}
            helperText={errors.maxAge?.message}
          />
        </Grid>
        <Grid item>
          <FieldLabel>Max number of uses</FieldLabel>
          <TextField
            {...register('maxUses')}
            fullWidth
            error={!!errors.maxUses}
            helperText={errors.maxUses?.message}
          />
        </Grid>
        <Grid item>
          <PrimaryButton type='submit'>
            Generate a New Link
          </PrimaryButton>
        </Grid>
        {errors.apiError && (
          <Grid item>
            <Typography color='danger'>{errors.apiError.message}</Typography>
          </Grid>
        )}
      </Grid>
    </form>
  );

}

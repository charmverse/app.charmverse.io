import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from 'components/common/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/settings/FieldLabel';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { Prisma, Space } from '@prisma/client';
import { DialogTitle } from 'components/common/Modal';
import { useForm } from 'react-hook-form';
import charmClient from 'charmClient';

export const schema = yup.object({
  maxAgeMinutes: yup.number().required(),
  maxUses: yup.number().required()
});

export type FormValues = yup.InferType<typeof schema>;

interface Props {
  defaultValues?: { name: string, domain: string };
  onClose?: () => void;
  onSubmit: (values: FormValues) => void;
  submitText?: string;
}

const maxAgeOptions: { value: FormValues['maxAgeMinutes'], label: string }[] = [
  { value: 1 * 30, label: '30 minutes' },
  { value: 1 * 60, label: '1 hour' },
  { value: 6 * 60, label: '6 hours' },
  { value: 12 * 60, label: '12 hours' },
  { value: 24 * 60, label: '1 day' },
  { value: 7 * 24 * 60, label: '7 days' },
  { value: -1, label: 'Never' }
];

const maxUsesOptions: { value: FormValues['maxUses'], label: string }[] = [
  { value: -1, label: 'No limit' },
  { value: 1, label: '1 use' },
  { value: 5, label: '5 uses' },
  { value: 10, label: '10 uses' },
  { value: 25, label: '25 uses' },
  { value: 50, label: '50 uses' },
  { value: 100, label: '100 uses' }
];

export default function WorkspaceSettings ({ onSubmit: _onSubmit, onClose }: Props) {

  const defaultMaxAge = maxAgeOptions[maxAgeOptions.length - 2].value; // the longest duration thats not infinite
  const defaultMaxUses = maxUsesOptions[0].value; // no limit

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<FormValues & { apiError?: string }>({
    defaultValues: {
      maxAgeMinutes: defaultMaxAge,
      maxUses: defaultMaxUses
    },
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
      <DialogTitle onClose={onClose}>
        Create an invite link
      </DialogTitle>
      <Divider />
      <br />
      <Grid container direction='column' spacing={3}>
        <Grid item>
          <FieldLabel>Expire after</FieldLabel>
          <Select
            {...register('maxAgeMinutes')}
            fullWidth
            defaultValue={defaultMaxAge}
          >
            {maxAgeOptions.map(({ value, label }) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item>
          <FieldLabel>Max number of uses</FieldLabel>
          <Select
            {...register('maxUses')}
            fullWidth
            defaultValue={defaultMaxUses}
          >
            {maxUsesOptions.map(({ value, label }) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item container justifyContent='space-between'>
          <Button variant='outlined' color='secondary' onClick={onClose}>
            Cancel
          </Button>
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

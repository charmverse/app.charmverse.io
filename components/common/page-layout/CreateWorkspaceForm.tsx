import { ChangeEvent } from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useForm } from 'react-hook-form';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/settings/FieldLabel';
import Avatar from 'components/settings/LargeAvatar';
import Legend from 'components/settings/Legend';
import { useUser } from 'hooks/useUser';
import { yupResolver } from '@hookform/resolvers/yup';
import { Space } from 'models';

import { schema, FormValues } from 'pages/[domain]/settings/workspace';

interface Props {
  onCancel: () => void;
  onSubmit: (values: Space) => void;
}

export default function WorkspaceSettings ({ onSubmit: _onSubmit, onCancel }: Props) {

  const [user] = useUser();

  const defaultName = `${user!.username}'s Workspace`;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, touchedFields }
  } = useForm<FormValues>({
    defaultValues: {
      name: defaultName,
      domain: getDomainFromName(defaultName)
    },
    resolver: yupResolver(schema)
  });

  const watchName = watch('name');
  const watchDomain = watch('domain');

  function onSubmit (values: FormValues) {
    const newId = Math.random().toString().replace('0.', '');
    try {
      _onSubmit({ id: newId, ...values });
    }
    catch (e) {
      console.error(e);
    }
  }

  function onChangeName (event: ChangeEvent<HTMLInputElement>) {
    const name = event.target.value;
    if (!touchedFields.domain) {
      setValue('domain', getDomainFromName(name));
    }

  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Legend sx={{ marginTop: '0 !important' }}>Create a workspace</Legend>
      <Grid container direction='column' spacing={3}>
        <Grid item display='flex' justifyContent='center'>
          <Avatar name={watchName} variant='rounded' />
        </Grid>
        <Grid item>
          <FieldLabel>Name</FieldLabel>
          <TextField
            {...register('name', { onChange: onChangeName })}
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        </Grid>
        <Grid item>
          <FieldLabel>Domain</FieldLabel>
          <TextField
            {...register('domain')}
            fullWidth
            error={!!errors.domain}
            helperText={errors.domain?.message}
          />
        </Grid>
        <Grid item>
          <PrimaryButton disabled={!watchName || !watchDomain} type='submit'>
            Create Workspace
          </PrimaryButton>
        </Grid>
      </Grid>
    </form>
  );

}

function getDomainFromName (name: string) {
  return name.replace(/[\p{P}\p{S}]/gu, '').replace(/\s/g, '-').toLowerCase();
}

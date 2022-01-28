import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useForm } from 'react-hook-form';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/settings/FieldLabel';
import Legend from 'components/settings/Legend';
import Avatar from 'components/settings/LargeAvatar';
import { setTitle } from 'components/common/page-layout/PageTitle';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { useRouter } from 'next/router';
import { yupResolver } from '@hookform/resolvers/yup';
import { Space } from 'models';

import { schema, FormValues } from 'pages/[domain]/settings/workspace';

interface Props {
  onCancel: () => void;
  onSubmit: (values: Space) => void;
}

export default function WorkspaceSettings ({ onSubmit: _onSubmit, onCancel }: Props) {

  const [user] = useUser();
  const [spaces] = useSpaces();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: `${user?.username}'s Workspace`,
    },
    resolver: yupResolver(schema),
  });

  const watchName = watch('name');
  const watchDomain = watch('domain');

  function onSubmit (values: FormValues) {
    const newId = '' + (spaces.length + 1);
    _onSubmit({ id: newId, ...values });
  }

  return (<>
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container direction={'column'} spacing={3}>
        <Grid item display='flex' justifyContent='center'>
          <Avatar name={watchName} variant='rounded' />
        </Grid>
        <Grid item>
          <FieldLabel>Name</FieldLabel>
          <TextField
            {...register('name')}
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        </Grid>
        <Grid item>
          <FieldLabel>Domain</FieldLabel>
          <TextField
            {...register('domain', { required: true })}
            fullWidth
            error={!!errors.domain}
            helperText={errors.domain?.message}
          />
        </Grid>
        <Grid item>
          <PrimaryButton disabled={!watchName || !watchDomain} type='submit'>
            Save
          </PrimaryButton>
        </Grid>
      </Grid>
    </form>
  </>);

}

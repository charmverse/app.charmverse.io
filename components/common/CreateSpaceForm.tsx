import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { IconButton, Tooltip, InputAdornment } from '@mui/material';
import Grid from '@mui/material/Grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/common/form/FieldLabel';
import Avatar from 'components/settings/workspace/LargeAvatar';
import Divider from '@mui/material/Divider';
import { useUser } from 'hooks/useUser';
import type { Prisma } from '@prisma/client';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { DialogTitle } from 'components/common/Modal';
import { useForm } from 'react-hook-form';
import { DOMAIN_BLACKLIST } from 'lib/spaces';
import charmClient from 'charmClient';
import log from 'lib/log';
import randomName from 'lib/utilities/randomName';

export const schema = yup.object({
  id: yup.string(),
  domain: yup.string().ensure().trim().lowercase()
    .min(3, 'Domain must be at least 3 characters')
    .matches(/^[0-9a-z-]*$/, 'Domain must be only lowercase hyphens, letters, and numbers')
    .notOneOf(DOMAIN_BLACKLIST, 'Domain is not allowed')
    .required('Domain is required')
    .test('domain-exists', 'Domain already exists', async function checkDomain (domain) {
      const { ok } = await charmClient.checkDomain({ domain, spaceId: this.parent.id });
      return !ok;
    }),
  name: yup.string().ensure().trim()
    .min(3, 'Name must be at least 3 characters')
    .required('Name is required'),
  spaceImage: yup.string().nullable(true)
});

export type FormValues = yup.InferType<typeof schema>;

interface Props {
  defaultValues?: { name: string; domain: string; };
  onCancel?: () => void;
  onSubmit: (values: Prisma.SpaceCreateInput) => void;
  submitText?: string;
}

export default function WorkspaceSettings ({ defaultValues, onSubmit: _onSubmit, onCancel, submitText }: Props) {

  const { user } = useUser();
  const [saveError, setSaveError] = useState<any | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, touchedFields }
  } = useForm<FormValues>({
    defaultValues: defaultValues || getDefaultName(),
    resolver: yupResolver(schema)
  });

  const watchName = watch('name');
  const watchDomain = watch('domain');
  const watchSpaceImage = watch('spaceImage');

  function onSubmit (values: FormValues) {
    try {
      setSaveError(null);
      _onSubmit({
        author: {
          connect: {
            id: user!.id
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: user!.id,
        spaceRoles: {
          create: [{
            isAdmin: true,
            user: {
              connect: {
                id: user!.id
              }
            }
          }]
        },
        ...values
      });
    }
    catch (err) {
      log.error('Error creating space', err);
      setSaveError((err as Error).message || err);
    }
  }

  function onChangeName (event: ChangeEvent<HTMLInputElement>) {
    const name = event.target.value;
    if (!touchedFields.domain) {
      setValue('domain', getDomainFromName(name));
    }

  }

  function randomizeName () {
    const { name, domain } = getDefaultName();
    setValue('name', name);
    setValue('domain', domain);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle onClose={onCancel}>Create a workspace</DialogTitle>
      <Divider />
      <br />
      <Grid container direction='column' spacing={2}>
        <Grid item display='flex' justifyContent='center'>
          <Avatar
            name={watchName}
            variant='rounded'
            image={watchSpaceImage}
            updateImage={(url) => setValue('spaceImage', url, { shouldDirty: true })}
            editable={true}
          />
        </Grid>
        <Grid item>
          <FieldLabel>Name</FieldLabel>
          <TextField
            {...register('name', {
              onChange: onChangeName
            })}
            autoFocus
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
            InputProps={defaultValues ? {} : {
              endAdornment: (
                <InputAdornment position='end'>
                  <Tooltip arrow placement='top' title='Regenerate random name'>
                    <IconButton size='small' onClick={randomizeName}>
                      <RefreshIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )
            }}
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
        <Grid item sx={{ display: 'flex', justifyContent: 'center' }}>
          <PrimaryButton disabled={!watchName || !watchDomain} type='submit'>
            {submitText || 'Create Workspace'}
          </PrimaryButton>
        </Grid>
        {saveError && (
          <Grid item>
            <Alert severity='error'>
              {saveError}
            </Alert>
          </Grid>
        )}
      </Grid>
    </form>
  );

}

export function getDomainFromName (name: string) {
  return name.replace(/[\p{P}\p{S}]/gu, '').replace(/\s/g, '-').toLowerCase();
}

function getDefaultName (): { name: string; domain: string; } {
  const name = randomName();
  return {
    name,
    domain: name
  };
}

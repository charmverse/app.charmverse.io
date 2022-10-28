import { yupResolver } from '@hookform/resolvers/yup';
import RefreshIcon from '@mui/icons-material/Refresh';
import { IconButton, Tooltip, InputAdornment } from '@mui/material';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import type { Prisma, Space } from '@prisma/client';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import FieldLabel from 'components/common/form/FieldLabel';
import { DialogTitle } from 'components/common/Modal';
import PrimaryButton from 'components/common/PrimaryButton';
import Avatar from 'components/settings/workspace/LargeAvatar';
import { useOnboarding } from 'hooks/useOnboarding';
import { useUser } from 'hooks/useUser';
import log from 'lib/log';
import { DOMAIN_BLACKLIST } from 'lib/spaces';
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
  defaultValues?: { name: string, domain: string };
  onCancel?: () => void;
  onSubmit: (values: Prisma.SpaceCreateInput) => Promise<Space | null>;
  submitText?: string;
  isSubmitting: boolean;
}

export default function WorkspaceSettings ({ defaultValues, onSubmit: _onSubmit, onCancel, submitText, isSubmitting }: Props) {
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
  const { showOnboarding } = useOnboarding();

  const watchName = watch('name');
  const watchDomain = watch('domain');
  const watchSpaceImage = watch('spaceImage');

  async function onSubmit (values: FormValues) {
    try {
      setSaveError(null);
      const space = await _onSubmit({
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
      if (space) {
        showOnboarding(space.id);
      }
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
    <form data-test='create-space-form' onSubmit={handleSubmit(onSubmit)}>
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
            data-test='workspace-name-input'
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
            inputProps={{
              'data-test': 'workspace-domain-input'
            }}
          />
        </Grid>
        <Grid item sx={{ display: 'flex', justifyContent: 'center' }}>
          <PrimaryButton disabled={!watchName || !watchDomain} type='submit' data-test='create-workspace' loading={isSubmitting}>
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

function getDefaultName (): { name: string, domain: string } {
  const name = randomName();
  return {
    name,
    domain: name
  };
}

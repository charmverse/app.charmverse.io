import type { StatusAPIResponse } from '@farcaster/auth-kit';
import { yupResolver } from '@hookform/resolvers/yup';
import { DeleteOutline } from '@mui/icons-material';
import { Card, IconButton, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { isTruthy } from '@root/lib/utils/types';
import { useState } from 'react';
import type { Control, FieldArrayPath } from 'react-hook-form';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { useCreateOptimismProject } from 'charmClient/hooks/optimism';
import { Avatar } from 'components/common/Avatar';
import { Button } from 'components/common/Button';
import { useUser } from 'hooks/useUser';

import { SearchFarcasterUser } from '../../SearchFarcasterUser';
import { FieldWrapper } from '../FieldWrapper';
import { TextInputField } from '../TextInputField';

import type { OptimismProjectFormValues } from './optimismProjectFormValues';
import { OPTIMISM_PROJECT_CATEGORIES, optimismProjectSchema } from './optimismProjectFormValues';
import { ProjectMultiTextValueFields } from './ProjectMultiTextValueFields';

type FarcasterProfile = Pick<StatusAPIResponse, 'fid' | 'pfpUrl' | 'bio' | 'displayName' | 'username'>;

function FarcasterCard({
  avatar,
  name,
  onDelete,
  username
}: {
  avatar?: string;
  name?: string;
  username?: string;
  onDelete?: VoidFunction;
}) {
  return (
    <Card>
      <Stack gap={2} p={2} direction='row'>
        <Avatar avatar={avatar} name={username} size='large' />
        <Stack width='100%'>
          <Stack direction='row' justifyContent='space-between'>
            <Typography variant='h6'>{name}</Typography>
            {onDelete && (
              <IconButton size='small'>
                <DeleteOutline color='error' onClick={onDelete} fontSize='small' />
              </IconButton>
            )}
          </Stack>
          <Typography variant='subtitle1' color='secondary'>
            @{username}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
}

function OptimismProjectMembersForm({ control }: { control: Control<OptimismProjectFormValues> }) {
  const [selectedFarcasterProfiles, setSelectedFarcasterProfiles] = useState<FarcasterProfile[]>([]);
  const { user } = useUser();
  const userFarcasterAccount = user?.farcasterUser?.account as unknown as StatusAPIResponse;
  const { append, remove } = useFieldArray({
    name: 'projectMembers' as FieldArrayPath<OptimismProjectFormValues>,
    control
  });

  if (!userFarcasterAccount) {
    return null;
  }

  return (
    <>
      <FarcasterCard
        avatar={userFarcasterAccount.pfpUrl}
        name={userFarcasterAccount.displayName}
        username={userFarcasterAccount.username}
      />
      <Stack gap={1}>
        <SearchFarcasterUser
          filteredFarcasterIds={[
            userFarcasterAccount.fid!,
            ...selectedFarcasterProfiles.map((profile) => profile.fid).filter(isTruthy)
          ]}
          setSelectedProfile={(farcasterProfile) => {
            if (farcasterProfile) {
              append({
                farcasterId: farcasterProfile.fid!,
                name: farcasterProfile.displayName!
              });
              setSelectedFarcasterProfiles([...selectedFarcasterProfiles, farcasterProfile]);
            }
          }}
        />
      </Stack>
      <Stack gap={1} mb={2}>
        {selectedFarcasterProfiles.map((farcasterProfile) => (
          <FarcasterCard
            key={farcasterProfile.fid}
            avatar={farcasterProfile.pfpUrl}
            name={farcasterProfile.displayName}
            username={farcasterProfile.username}
            onDelete={() => {
              remove(selectedFarcasterProfiles.findIndex((profile) => profile.fid === farcasterProfile.fid));
              setSelectedFarcasterProfiles(
                selectedFarcasterProfiles.filter((profile) => profile.fid !== farcasterProfile.fid)
              );
            }}
          />
        ))}
      </Stack>
    </>
  );
}

export function OptimismProjectForm({
  onCreateProject,
  onCancel
}: {
  onCreateProject: (projectInfo: { title: string; projectRefUID: string }) => void;
  onCancel: VoidFunction;
}) {
  const { trigger: createOptimismProject, isMutating } = useCreateOptimismProject();
  const { user } = useUser();

  const {
    control,
    formState: { isValid },
    getValues
  } = useForm<OptimismProjectFormValues>({
    defaultValues: {
      name: '',
      websites: [],
      farcasterValues: [],
      projectMembers: [
        {
          farcasterId: user?.farcasterUser?.fid,
          name: (user?.farcasterUser?.account as unknown as StatusAPIResponse)?.displayName
        }
      ]
    },
    resolver: yupResolver(optimismProjectSchema)
  });

  return (
    <Stack gap={2} my={2}>
      <Controller
        control={control}
        name='name'
        render={({ field, fieldState }) => (
          <TextInputField label='Name' placeholder='Acme Inc.' required {...field} error={fieldState.error?.message} />
        )}
      />

      <Controller
        control={control}
        name='description'
        render={({ field, fieldState }) => (
          <TextInputField
            label='Description'
            placeholder='A description of your project'
            {...field}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name='category'
        render={({ field, fieldState }) => (
          <FieldWrapper label='Category'>
            <Select
              displayEmpty
              fullWidth
              renderValue={(value) => value || <Typography color='secondary'>Select a category</Typography>}
              error={!!fieldState.error}
              {...field}
            >
              {OPTIMISM_PROJECT_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FieldWrapper>
        )}
      />

      <ProjectMultiTextValueFields
        control={control}
        name='websites'
        label='Websites'
        placeholder='https://acme-inc.com'
      />

      <ProjectMultiTextValueFields
        control={control}
        name='farcasterValues'
        label='Farcaster'
        placeholder='https://warpcast.com/acme-inc'
      />

      <FieldWrapper label='X'>
        <Stack direction='row' gap={1} alignItems='center'>
          <Typography color='secondary' width={250}>
            https://x.com/
          </Typography>
          <Controller
            control={control}
            name='twitter'
            render={({ field, fieldState }) => (
              <TextField fullWidth placeholder='acme-inc' error={!!fieldState.error} {...field} />
            )}
          />
        </Stack>
      </FieldWrapper>

      <FieldWrapper label='Github'>
        <Stack direction='row' gap={1} alignItems='center'>
          <Typography color='secondary' width={250}>
            https://github.com/
          </Typography>
          <Controller
            control={control}
            name='github'
            render={({ field, fieldState }) => (
              <TextField fullWidth placeholder='acme-inc' error={!!fieldState.error} {...field} />
            )}
          />
        </Stack>
      </FieldWrapper>

      <FieldWrapper label='Mirror'>
        <Stack direction='row' gap={1} alignItems='center'>
          <Typography color='secondary' width={250}>
            https://mirror.xyz/
          </Typography>
          <Controller
            control={control}
            name='mirror'
            render={({ field, fieldState }) => (
              <TextField fullWidth placeholder='acme-inc' error={!!fieldState.error} {...field} />
            )}
          />
        </Stack>
      </FieldWrapper>

      <Typography variant='h6'>Team members</Typography>

      <OptimismProjectMembersForm control={control} />

      <Stack direction='row' justifyContent='space-between'>
        <Button
          disabled={!isValid || isMutating}
          onClick={() => createOptimismProject(getValues()).then(onCreateProject)}
        >
          Create
        </Button>
        <Button color='secondary' variant='outlined' onClick={onCancel}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  );
}

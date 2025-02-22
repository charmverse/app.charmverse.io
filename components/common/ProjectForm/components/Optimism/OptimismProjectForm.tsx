import type { StatusAPIResponse } from '@farcaster/auth-kit';
import { yupResolver } from '@hookform/resolvers/yup';
import { DeleteOutline } from '@mui/icons-material';
import ImageIcon from '@mui/icons-material/Image';
import { Box, Card, CircularProgress, IconButton, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { isTruthy } from '@packages/utils/types';
import Image from 'next/image';
import { useState } from 'react';
import type { Control, FieldArrayPath } from 'react-hook-form';
import { Controller, useController, useFieldArray, useForm } from 'react-hook-form';

import { Avatar } from 'components/common/Avatar';
import { Button } from 'components/common/Button';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { MultiTextInputField } from 'components/common/form/fields/MultiTextInputField';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import { SearchFarcasterUser } from 'components/common/form/SearchFarcasterUser';
import { useS3UploadInput } from 'hooks/useS3UploadInput';
import { useUser } from 'hooks/useUser';
import { projectSchema, PROJECT_CATEGORIES } from 'lib/optimism/projectSchema';
import type { FormValues } from 'lib/optimism/projectSchema';

export type FarcasterProfile = {
  username: string;
  name: string;
  avatar: string;
  fid: number;
};

export function FarcasterCard({
  avatar,
  name,
  onDelete,
  username,
  disabled
}: {
  avatar?: string;
  name?: string;
  username?: string;
  onDelete?: VoidFunction;
  disabled?: boolean;
}) {
  return (
    <Card>
      <Stack gap={2} p={2} direction='row'>
        <Avatar avatar={avatar} name={username} size='large' />
        <Stack width='100%'>
          <Stack direction='row' justifyContent='space-between'>
            <Typography variant='h6'>{name}</Typography>
            {onDelete && (
              <IconButton size='small' onClick={onDelete} disabled={disabled}>
                <DeleteOutline color='error' fontSize='small' />
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

function OptimismProjectMembersForm({
  disabled,
  control,
  initialFarcasterProfiles = []
}: {
  initialFarcasterProfiles?: FarcasterProfile[];
  disabled: boolean;
  control: Control<FormValues>;
}) {
  const [selectedFarcasterProfiles, setSelectedFarcasterProfiles] =
    useState<FarcasterProfile[]>(initialFarcasterProfiles);
  const { user } = useUser();
  const userFarcasterAccount = user?.farcasterUser?.account as unknown as StatusAPIResponse;
  const { append, remove } = useFieldArray({
    name: 'projectMembers' as FieldArrayPath<FormValues>,
    control
  });

  if (!userFarcasterAccount) {
    return null;
  }

  return (
    <Stack gap={1}>
      <FarcasterCard
        avatar={userFarcasterAccount.pfpUrl}
        name={userFarcasterAccount.displayName}
        username={userFarcasterAccount.username}
      />
      <Stack gap={1}>
        <SearchFarcasterUser
          disabled={disabled}
          filteredFarcasterIds={[
            userFarcasterAccount.fid!,
            ...selectedFarcasterProfiles.map((profile) => profile.fid).filter(isTruthy)
          ]}
          setSelectedProfile={(farcasterProfile) => {
            if (farcasterProfile) {
              append({
                farcasterId: farcasterProfile.fid!
              });
              setSelectedFarcasterProfiles([
                ...selectedFarcasterProfiles,
                {
                  avatar: farcasterProfile.pfpUrl as string,
                  name: farcasterProfile.displayName as string,
                  username: farcasterProfile.username as string,
                  fid: farcasterProfile.fid!
                }
              ]);
            }
          }}
        />
      </Stack>
      {selectedFarcasterProfiles.map((farcasterProfile) => (
        <FarcasterCard
          key={farcasterProfile.fid}
          avatar={farcasterProfile.avatar}
          name={farcasterProfile.name}
          username={farcasterProfile.username}
          disabled={disabled}
          onDelete={() => {
            // + 1 since the first member is the team lead
            remove(selectedFarcasterProfiles.findIndex((profile) => profile.fid === farcasterProfile.fid) + 1);
            setSelectedFarcasterProfiles(
              selectedFarcasterProfiles.filter((profile) => profile.fid !== farcasterProfile.fid)
            );
          }}
        />
      ))}
    </Stack>
  );
}

function OptimismProjectImageField({
  control,
  name,
  type,
  disabled
}: {
  disabled?: boolean;
  control: Control<FormValues>;
  name: keyof FormValues;
  type: 'avatar' | 'cover';
}) {
  const { field } = useController({
    name,
    control
  });

  const { inputRef, isUploading, onFileChange } = useS3UploadInput({
    onFileUpload: ({ url }) => {
      field.onChange(url);
    }
  });

  return (
    <Controller
      name={name}
      control={control}
      render={() => (
        <Box
          sx={{
            position: 'relative',
            width: type === 'avatar' ? 125 : '100%',
            height: 96,
            borderRadius: 2
          }}
        >
          <input
            title={`Add ${type}`}
            disabled={isUploading || disabled}
            type='file'
            accept={'image/*'}
            ref={inputRef}
            onChange={onFileChange}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              opacity: 0,
              zIndex: 1,
              cursor: disabled ? 'inherit' : 'pointer'
            }}
          />

          <Box
            borderRadius={2}
            height='100%'
            display='flex'
            alignItems='center'
            justifyContent='center'
            bgcolor={(theme) => theme.palette.background.light}
            flexDirection='column'
            overflow='hidden'
            gap={0}
          >
            {isUploading ? (
              <CircularProgress color='secondary' size={40} />
            ) : field.value ? (
              <Image
                src={field.value as string}
                alt={`Add ${type}`}
                width={500}
                height={96}
                sizes='100vw'
                style={{
                  width: '100%',
                  height: 96,
                  objectFit: 'cover'
                }}
              />
            ) : (
              <>
                <ImageIcon color='secondary' />
                <Typography color='secondary' variant='caption'>
                  Add {type === 'avatar' ? 'avatar' : 'cover'}
                </Typography>
              </>
            )}
          </Box>
        </Box>
      )}
    />
  );
}

export function OptimismProjectForm({
  onSubmit,
  onCancel,
  isMutating,
  optimismValues,
  submitButtonText = 'Create',
  initialFarcasterProfiles
}: {
  initialFarcasterProfiles?: FarcasterProfile[];
  optimismValues?: FormValues;
  isMutating: boolean;
  onSubmit: (projectValues: FormValues) => void;
  onCancel: VoidFunction;
  submitButtonText?: string;
}) {
  const { user } = useUser();

  const {
    control,
    watch,
    formState: { isValid },
    getValues
  } = useForm<FormValues>({
    defaultValues: optimismValues ?? {
      name: '',
      projectMembers: [
        {
          farcasterId: user?.farcasterUser?.fid
        }
      ]
    },
    resolver: yupResolver(projectSchema)
  });

  return (
    <Stack gap={2} my={2}>
      <Controller
        control={control}
        name='name'
        render={({ field, fieldState }) => (
          <TextInputField
            disabled={isMutating}
            label='Name'
            placeholder='Acme Inc.'
            required
            {...field}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name='description'
        render={({ field, fieldState }) => (
          <TextInputField
            disabled={isMutating}
            label='Description'
            rows={5}
            multiline
            placeholder='A description of your project'
            {...field}
            error={fieldState.error?.message}
          />
        )}
      />

      <FieldWrapper label='Project avatar and cover image'>
        <Stack direction='row' gap={1}>
          <OptimismProjectImageField disabled={isMutating} type='avatar' name='avatar' control={control} />
          <OptimismProjectImageField disabled={isMutating} type='cover' name='coverImage' control={control} />
        </Stack>
      </FieldWrapper>

      <Controller
        control={control}
        name='optimismCategory'
        render={({ field, fieldState }) => (
          <FieldWrapper label='Category'>
            <Select
              displayEmpty
              fullWidth
              disabled={isMutating}
              renderValue={(value) => value || <Typography color='secondary'>Select a category</Typography>}
              error={!!fieldState.error}
              {...field}
            >
              {PROJECT_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FieldWrapper>
        )}
      />

      <MultiTextInputField
        control={control}
        name='websites'
        watch={watch}
        disabled={isMutating}
        label='Websites'
        placeholder='https://acme-inc.com'
      />

      <MultiTextInputField
        control={control}
        name='farcasterValues'
        disabled={isMutating}
        label='Farcaster'
        watch={watch}
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
              <TextField disabled={isMutating} fullWidth placeholder='acme-inc' error={!!fieldState.error} {...field} />
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
              <TextField disabled={isMutating} fullWidth placeholder='acme-inc' error={!!fieldState.error} {...field} />
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
              <TextField disabled={isMutating} fullWidth placeholder='acme-inc' error={!!fieldState.error} {...field} />
            )}
          />
        </Stack>
      </FieldWrapper>

      <Typography variant='h6'>Team members</Typography>

      <OptimismProjectMembersForm
        initialFarcasterProfiles={initialFarcasterProfiles}
        disabled={isMutating}
        control={control}
      />

      <Stack direction='row' justifyContent='space-between'>
        <Button color='secondary' variant='outlined' onClick={onCancel} disabled={isMutating}>
          Cancel
        </Button>
        <Button
          disabled={!isValid || isMutating}
          onClick={() => {
            onSubmit(getValues());
          }}
        >
          {submitButtonText}
        </Button>
      </Stack>
    </Stack>
  );
}

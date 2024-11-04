'use client';

import type { Scout } from '@charmverse/core/prisma';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import { Box, CircularProgress, IconButton, Stack, TextField, Typography } from '@mui/material';
import Image from 'next/image';
import { useRef, useState } from 'react';
import type { Control } from 'react-hook-form';
import { Controller, useController } from 'react-hook-form';

import { useIsMounted } from 'hooks/useIsMounted';
import { useMdScreen } from 'hooks/useMediaScreens';
import { useS3UploadInput } from 'hooks/useS3UploadInput';

import { ProfileLinks } from './ProfileLinks';

type UserProfileData = Pick<Scout, 'id' | 'path'> & {
  avatar?: string | null;
  displayName: string;
  githubLogin?: string;
  farcasterName?: string | null;
  bio?: string | null;
};

type UserProfileProps = {
  user: UserProfileData;
  avatarSize?: number;
  control: Control<
    {
      avatar: string;
      displayName: string;
    } & any,
    any
  >;
  onAvatarChange?: (url: string) => void;
  onDisplayNameChange?: (displayName: string) => void;
  isLoading?: boolean;
};

export function EditableUserProfile({
  user,
  control,
  onAvatarChange,
  onDisplayNameChange,
  isLoading,
  avatarSize = 100
}: UserProfileProps) {
  const isDesktop = useMdScreen();
  const { bio, githubLogin, farcasterName } = user;
  const isMounted = useIsMounted();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isDisplayNameDirty, setIsDisplayNameDirty] = useState(false);
  const previousDisplayNameRef = useRef<string>(user.displayName);
  const { field: avatarField } = useController({
    name: 'avatar',
    control
  });
  const { field: displayNameField } = useController({
    name: 'displayName',
    control
  });

  const { inputRef, isUploading, onFileChange } = useS3UploadInput({
    onFileUpload: ({ url }) => {
      avatarField.onChange(url);
      onAvatarChange?.(url);
    }
  });

  const updateDisplayName = (displayName: string) => {
    setIsEditingName(false);
    setIsDisplayNameDirty(false);
    onDisplayNameChange?.(displayName);
    previousDisplayNameRef.current = displayName;
  };

  const resetDisplayName = () => {
    setIsEditingName(false);
    setIsDisplayNameDirty(false);
    displayNameField.onChange(previousDisplayNameRef.current);
  };

  // We are using the mounted flag here because MUI media query returns false on the server and true on the client and it throws warnings
  if (!isMounted) {
    return null;
  }

  return (
    <Stack
      display='flex'
      gap={2}
      alignItems='center'
      flexDirection='row'
      my={1}
      p={{
        xs: 1,
        md: 2
      }}
    >
      <Controller
        name='avatar'
        control={control}
        render={({ field: _avatarField }) => (
          <Box
            sx={{
              position: 'relative',
              width: avatarSize,
              minWidth: avatarSize,
              height: avatarSize,
              minHeight: avatarSize,
              borderRadius: '50%',
              backgroundColor: 'inputBackground.main'
            }}
          >
            <input
              disabled={isUploading || isLoading}
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
                cursor: 'pointer',
                borderRadius: '50%'
              }}
            />
            {isUploading ? null : (
              <IconButton
                sx={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  zIndex: 20,
                  backgroundColor: 'background.light',
                  p: 0.5
                }}
                disabled={isLoading}
                onClick={() => {
                  inputRef.current?.click();
                }}
                color='primary'
              >
                <EditIcon fontSize='small' />
              </IconButton>
            )}
            {isUploading ? (
              <CircularProgress color='secondary' size={25} sx={{ position: 'absolute', top: '35%', left: '35%' }} />
            ) : (
              <Image
                src={_avatarField.value as string}
                alt='avatar'
                width={avatarSize}
                height={avatarSize}
                sizes='100vw'
                style={{
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
              />
            )}
          </Box>
        )}
      />
      <Stack width='100%'>
        <Controller
          name='displayName'
          control={control}
          render={({ field: _displayNameField, fieldState: { error } }) => (
            <Stack
              direction='row'
              alignItems='center'
              flexWrap='nowrap'
              justifyContent='space-between'
              width='100%'
              gap={1}
            >
              <Stack width={isEditingName ? '80%' : '100%'}>
                {isEditingName ? (
                  <TextField
                    required
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateDisplayName(_displayNameField.value);
                      } else if (e.key === 'Escape') {
                        resetDisplayName();
                      }
                    }}
                    {..._displayNameField}
                    onChange={(event) => {
                      setIsDisplayNameDirty(true);
                      _displayNameField.onChange(event);
                    }}
                    fullWidth
                    autoFocus
                    error={!!error?.message}
                    sx={{
                      my: 0.5,
                      '& .MuiInputBase-input': {
                        padding: 0.5,
                        paddingLeft: 1
                      }
                    }}
                  />
                ) : (
                  <Stack direction='row' alignItems='center' gap={1}>
                    <Typography variant='h6'>{displayNameField.value}</Typography>
                    {farcasterName || githubLogin ? (
                      <ProfileLinks farcasterName={farcasterName} githubLogin={githubLogin} />
                    ) : null}
                    <EditIcon
                      sx={{ cursor: 'pointer' }}
                      fontSize='small'
                      onClick={() => {
                        setIsEditingName(true);
                      }}
                    />
                  </Stack>
                )}
              </Stack>
              {isEditingName && (
                <Stack direction='row' gap={0.5}>
                  {isDisplayNameDirty && !error?.message && displayNameField.value ? (
                    <CheckCircleIcon
                      sx={{ cursor: 'pointer' }}
                      color='success'
                      fontSize='small'
                      onClick={() => updateDisplayName(displayNameField.value)}
                    />
                  ) : null}
                  <CancelIcon
                    sx={{ cursor: 'pointer' }}
                    color='error'
                    fontSize='small'
                    onClick={() => {
                      resetDisplayName();
                    }}
                  />
                </Stack>
              )}
            </Stack>
          )}
        />
        {bio ? (
          <Typography
            variant={isDesktop ? 'body2' : 'caption'}
            overflow='hidden'
            textOverflow='ellipsis'
            maxWidth='500px'
          >
            {bio}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
}

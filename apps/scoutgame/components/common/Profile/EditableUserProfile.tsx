'use client';

import type { Scout } from '@charmverse/core/prisma';
import EditIcon from '@mui/icons-material/Edit';
import { Box, CircularProgress, IconButton, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { Controller, useController, type Control } from 'react-hook-form';

import { useIsMounted } from 'hooks/useIsMounted';
import { useMdScreen } from 'hooks/useMediaScreens';
import { useS3UploadInput } from 'hooks/useS3UploadInput';

import type { AvatarSize } from '../Avatar';

import { ProfileLinks } from './ProfileLinks';

export type UserProfileData = Pick<Scout, 'id' | 'path'> & {
  bio?: string | null;
  avatar: string;
  displayName: string;
  githubLogin?: string;
  farcasterUsername?: string | null;
};

type UserProfileProps = {
  user: UserProfileData;
  avatarSize?: AvatarSize;
  control: Control<
    {
      avatar: string;
      displayName: string;
    } & any,
    any
  >;
};

export function EditableUserProfile({ user, avatarSize = 'xLarge', control }: UserProfileProps) {
  const isDesktop = useMdScreen();
  const { displayName, bio, githubLogin, farcasterUsername } = user;
  const isMounted = useIsMounted();

  const { field } = useController({
    name: 'avatar',
    control
  });

  const { inputRef, isUploading, onFileChange } = useS3UploadInput({
    onFileUpload: ({ url }) => {
      field.onChange(url);
    }
  });

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
      p={{
        xs: 0,
        md: 2
      }}
    >
      <Controller
        name='avatar'
        control={control}
        render={() => (
          <Box
            sx={{
              position: 'relative',
              width: 75,
              height: 75,
              borderRadius: '50%',
              backgroundColor: 'inputBackground.main'
            }}
          >
            <input
              disabled={isUploading}
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
            <IconButton
              sx={{
                position: 'absolute',
                top: -5,
                right: -5,
                zIndex: 1,
                backgroundColor: 'white',
                p: 0.25
              }}
              color='primary'
            >
              <EditIcon fontSize='small' />
            </IconButton>
            {isUploading ? (
              <CircularProgress color='secondary' size={25} sx={{ position: 'absolute', top: '35%', left: '35%' }} />
            ) : (
              <Image
                src={field.value as string}
                alt='avatar'
                width={75}
                height={75}
                sizes='100vw'
                style={{
                  borderRadius: '50%'
                }}
              />
            )}
          </Box>
        )}
      />
      <Stack>
        <Stack direction='row' alignItems='center' flexWrap='wrap'>
          <Typography variant={isDesktop ? 'h5' : 'h6'}>{displayName}</Typography>
          <ProfileLinks farcasterUsername={farcasterUsername} githubLogin={githubLogin} />
        </Stack>
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

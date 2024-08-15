import { LoadingComponent } from '@connect-shared/components/common/Loading/LoadingComponent';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { isTruthy } from '@root/lib/utils/types';
import { useState } from 'react';
import type { Control, FieldArrayPath, UseFormHandleSubmit } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';

import type { FormValues } from 'lib/projects/form';

import { FarcasterCard } from '../../common/FarcasterCard';

import { SearchFarcasterUser } from './SearchFarcasterUser';

type FarcasterProfile = Pick<FarcasterBody, 'fid' | 'pfpUrl' | 'bio' | 'displayName' | 'username'>;

export function AddProjectMembersForm({
  control,
  isValid,
  handleSubmit,
  onBack,
  user,
  initialFarcasterProfiles = [],
  execute,
  isExecuting,
  error
}: {
  initialFarcasterProfiles?: FarcasterProfile[];
  user: LoggedInUser;
  onBack: VoidFunction;
  control: Control<FormValues>;
  isValid: boolean;
  handleSubmit: UseFormHandleSubmit<FormValues>;
  execute: (data: FormValues) => void;
  isExecuting: boolean;
  error?: string | null;
}) {
  const { append, remove, fields } = useFieldArray({
    name: 'projectMembers' as FieldArrayPath<FormValues>,
    control
  });
  const [selectedFarcasterProfiles, setSelectedFarcasterProfiles] =
    useState<FarcasterProfile[]>(initialFarcasterProfiles);

  const farcasterDetails = user.farcasterUser?.account as Required<FarcasterBody> | undefined;

  return (
    <form
      onSubmit={handleSubmit((data) => {
        execute(data);
      })}
    >
      <Stack gap={1}>
        <Typography variant='h6'>Team</Typography>
        <FarcasterCard
          fid={user.farcasterUser?.fid}
          name={farcasterDetails?.displayName}
          username={farcasterDetails?.username}
          avatar={farcasterDetails?.pfpUrl}
          avatarSize='large'
        />
        <Stack gap={1}>
          <SearchFarcasterUser
            disabled={isExecuting}
            filteredFarcasterIds={selectedFarcasterProfiles.map((profile) => profile.fid).filter(isTruthy)}
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
              avatarSize='large'
              fid={farcasterProfile.fid}
              key={farcasterProfile.fid}
              name={farcasterProfile.displayName}
              username={farcasterProfile.username}
              avatar={farcasterProfile.pfpUrl}
              bio=''
              onDelete={() => {
                remove(fields.findIndex((profile) => profile.farcasterId === farcasterProfile.fid));
                setSelectedFarcasterProfiles(
                  selectedFarcasterProfiles.filter((profile) => profile.fid !== farcasterProfile.fid)
                );
              }}
            />
          ))}
        </Stack>
        <Stack direction='row' justifyContent='space-between'>
          <Button
            variant='outlined'
            color='secondary'
            onClick={() => {
              onBack();
              setSelectedFarcasterProfiles([]);
            }}
          >
            Back
          </Button>
          <Stack direction='row' gap={1}>
            {isExecuting && (
              <LoadingComponent
                height={20}
                size={20}
                minHeight={20}
                label='Submitting your project onchain'
                flexDirection='row-reverse'
              />
            )}
            {error && !isExecuting && (
              <Typography alignContent='center' variant='caption' color='error'>
                {error}
              </Typography>
            )}
            <Button data-test='project-form-publish' disabled={!isValid || isExecuting} type='submit'>
              Publish
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </form>
  );
}

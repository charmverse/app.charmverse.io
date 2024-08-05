import { LoadingComponent } from '@connect-shared/components/common/Loading/LoadingComponent';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import type { FormValues } from '@connect-shared/lib/projects/form';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { Button, Stack, Typography } from '@mui/material';
import { isTruthy } from '@root/lib/utils/types';
import { useState } from 'react';
import type { Control, FieldArrayPath, UseFormHandleSubmit } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';

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
  isExecuting
}: {
  initialFarcasterProfiles?: FarcasterProfile[];
  user: LoggedInUser;
  onBack: VoidFunction;
  control: Control<FormValues>;
  isValid: boolean;
  handleSubmit: UseFormHandleSubmit<FormValues>;
  execute: (data: FormValues) => void;
  isExecuting: boolean;
}) {
  const { append, remove } = useFieldArray({
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
            filteredFarcasterIds={selectedFarcasterProfiles.map((profile) => profile.fid).filter(isTruthy)}
            setSelectedProfile={(farcasterProfile) => {
              if (farcasterProfile) {
                append({
                  farcasterId: farcasterProfile.fid!
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
                remove(selectedFarcasterProfiles.findIndex((profile) => profile.fid === farcasterProfile.fid));
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
            <Button data-test='project-form-publish' disabled={!isValid || isExecuting} type='submit'>
              Publish
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </form>
  );
}

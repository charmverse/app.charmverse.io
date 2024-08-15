import { LoadingComponent } from '@connect-shared/components/common/Loading/LoadingComponent';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { Button, FormLabel, Stack, Typography } from '@mui/material';
import { isTruthy } from '@root/lib/utils/types';
import Link from 'next/link';
import { useState } from 'react';
import type { Control, FieldArrayPath, UseFormHandleSubmit } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';

import type { FormValues } from 'lib/projects/form';

import { FarcasterCard } from '../../common/FarcasterCard';

import { SearchFarcasterUser } from './SearchFarcasterUser';

type FarcasterProfile = Pick<FarcasterBody, 'fid' | 'pfpUrl' | 'bio' | 'displayName' | 'username'>;

export function AddProjectMembersForm({
  control,
  user,
  initialFarcasterProfiles = [],
  disabled
}: {
  initialFarcasterProfiles?: FarcasterProfile[];
  user: LoggedInUser;
  control: Control<FormValues>;
  disabled?: boolean;
}) {
  const { append, remove } = useFieldArray({
    name: 'projectMembers' as FieldArrayPath<FormValues>,
    control
  });
  const [selectedFarcasterProfiles, setSelectedFarcasterProfiles] =
    useState<FarcasterProfile[]>(initialFarcasterProfiles);

  const farcasterDetails = user.farcasterUser?.account as Required<FarcasterBody> | undefined;

  return (
    <Stack gap={1}>
      <FormLabel id='search-farcaster-user'>Team</FormLabel>
      <FarcasterCard
        fid={user.farcasterUser?.fid}
        name={farcasterDetails?.displayName}
        username={farcasterDetails?.username}
        avatar={farcasterDetails?.pfpUrl}
        avatarSize='large'
      />
      <Stack gap={1}>
        <SearchFarcasterUser
          disabled={disabled}
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
              remove(selectedFarcasterProfiles.findIndex((profile) => profile.fid === farcasterProfile.fid));
              setSelectedFarcasterProfiles(
                selectedFarcasterProfiles.filter((profile) => profile.fid !== farcasterProfile.fid)
              );
            }}
          />
        ))}
      </Stack>
    </Stack>
  );
}

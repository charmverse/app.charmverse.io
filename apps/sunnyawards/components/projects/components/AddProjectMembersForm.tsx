import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { FormLabel, Stack } from '@mui/material';
import type { LoggedInUser } from '@packages/connect-shared/lib/profile/getCurrentUserAction';
import { isTruthy } from '@root/lib/utils/types';
import type { Control, FieldArrayPath } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';

import { FarcasterCard } from 'components/common/FarcasterCard';
import type { FormValues } from 'lib/projects/schema';

import { SearchFarcasterUser } from './SearchFarcasterUser';

export type FarcasterProfile = Pick<FarcasterBody, 'fid' | 'pfpUrl' | 'bio' | 'displayName' | 'username'>;

export function AddProjectMembersForm({
  control,
  user,
  disabled
}: {
  user: LoggedInUser;
  control: Control<FormValues>;
  disabled?: boolean;
}) {
  const { append, remove, fields } = useFieldArray({
    name: 'projectMembers' as FieldArrayPath<FormValues>,
    control
  });

  const farcasterDetails = user.farcasterUser?.account as Required<FarcasterBody> | undefined;

  const additionalMembers = fields.filter((profile) => profile.farcasterId !== user.farcasterUser?.fid);

  return (
    <Stack gap={1}>
      <FormLabel id='search-farcaster-user'>Team</FormLabel>
      <FarcasterCard
        fid={user.farcasterUser?.fid}
        name={farcasterDetails?.displayName || farcasterDetails?.username}
        username={farcasterDetails?.username}
        avatar={farcasterDetails?.pfpUrl}
        avatarSize='large'
      />
      <Stack gap={1}>
        <SearchFarcasterUser
          disabled={disabled}
          filteredFarcasterIds={fields.map((profile) => profile.farcasterId).filter(isTruthy)}
          setSelectedProfile={(farcasterProfile) => {
            if (farcasterProfile) {
              append({
                farcasterId: farcasterProfile.fid!,
                name: farcasterProfile.displayName!,
                farcasterUser: farcasterProfile as Required<FarcasterProfile>
              });
            }
          }}
        />
      </Stack>
      <Stack gap={1} mb={2}>
        {additionalMembers.map(({ farcasterUser }) => (
          <FarcasterCard
            avatarSize='large'
            fid={farcasterUser.fid}
            key={farcasterUser.fid}
            name={farcasterUser.displayName}
            username={farcasterUser.username}
            avatar={farcasterUser.pfpUrl}
            bio=''
            onDelete={() => {
              remove(fields.findIndex((profile) => profile.farcasterId === farcasterUser.fid));
            }}
          />
        ))}
      </Stack>
    </Stack>
  );
}

import { log } from '@charmverse/core/log';
import { actionCreateProject } from '@connect/lib/actions/createProject';
import type { LoggedInUser } from '@connect/lib/profile/interfaces';
import type { FormValues } from '@connect/lib/projects/form';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { Button, Stack, Typography } from '@mui/material';
import { useAction } from 'next-safe-action/hooks';
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
  onSuccess
}: {
  user: LoggedInUser;
  onBack: VoidFunction;
  control: Control<FormValues>;
  isValid: boolean;
  handleSubmit: UseFormHandleSubmit<FormValues>;
  onSuccess: ({ projectPath, projectId }: { projectPath: string; projectId: string }) => void;
}) {
  const { append, remove } = useFieldArray({
    name: 'projectMembers' as FieldArrayPath<FormValues>,
    control
  });
  const [selectedFarcasterProfiles, setSelectedFarcasterProfiles] = useState<FarcasterProfile[]>([]);
  // @ts-ignore
  const { execute, isExecuting } = useAction(actionCreateProject, {
    onSuccess: (data) => {
      onSuccess({ projectId: data.data?.projectId as string, projectPath: data.data?.projectPath as string });
    },
    onError(err) {
      log.error(err.error.serverError?.message || 'Something went wrong', err.error.serverError);
    }
  });

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
          <Button disabled={!isValid || isExecuting} type='submit'>
            Publish
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}

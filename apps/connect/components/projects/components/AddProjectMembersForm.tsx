import { log } from '@charmverse/core/log';
import { Avatar } from '@connect/components/common/Avatar';
import { SearchFarcasterUser } from '@connect/components/projects/components/SearchFarcasterUser';
import { actionCreateProject } from '@connect/lib/actions/createProject';
import type { FormValues } from '@connect/lib/projects/form';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import AddIcon from '@mui/icons-material/AddOutlined';
import { Button, Card, Divider, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import type { Control, FieldArrayPath, UseFormHandleSubmit } from 'react-hook-form';
import { useFieldArray, useWatch } from 'react-hook-form';

import type { LoggedInUser } from 'models/User';

import { FarcasterCard } from '../../common/FarcasterCard';

type FarcasterProfile = Pick<FarcasterBody, 'fid' | 'pfpUrl' | 'bio' | 'displayName' | 'username'>;

export function AddProjectMembersForm({
  control,
  isValid,
  handleSubmit,
  onBack,
  user
}: {
  user: LoggedInUser;
  onBack: VoidFunction;
  control: Control<FormValues>;
  isValid: boolean;
  handleSubmit: UseFormHandleSubmit<FormValues>;
}) {
  const router = useRouter();

  const formValues = useWatch({ control });

  const { append } = useFieldArray({
    name: 'projectMembers' as FieldArrayPath<FormValues>,
    control
  });
  const [selectedFarcasterProfiles, setSelectedFarcasterProfiles] = useState<FarcasterProfile[]>([]);
  const [selectedFarcasterProfile, setSelectedFarcasterProfile] = useState<FarcasterProfile | null>(null);
  // @ts-ignore
  const { execute, isExecuting } = useAction(actionCreateProject, {
    onSuccess() {
      router.push('/profile');
    },
    onError(err) {
      log.error(err.error.serverError?.message || 'Something went wrong', err.error.serverError);
    }
  });

  const farcasterDetails = user.farcasterUser?.account as Required<
    Pick<FarcasterBody, 'bio' | 'username' | 'displayName' | 'pfpUrl'>
  >;

  return (
    <form
      onSubmit={handleSubmit((data) => {
        execute(data);
      })}
    >
      <Stack gap={1}>
        <Typography variant='h6'>Team</Typography>
        <FarcasterCard
          name={formValues.name || 'Untitled'}
          username=''
          avatar={formValues.avatar || farcasterDetails.pfpUrl}
          bio=''
        />
        <Stack gap={2}>
          <SearchFarcasterUser
            selectedProfile={selectedFarcasterProfile}
            setSelectedProfile={(farcasterProfile) => {
              if (farcasterProfile) {
                setSelectedFarcasterProfile(farcasterProfile);
              }
            }}
          />
          <Stack flexDirection='row' justifyContent='center'>
            <Button
              disabled={!selectedFarcasterProfile}
              onClick={() => {
                if (selectedFarcasterProfile) {
                  append({
                    farcasterId: selectedFarcasterProfile.fid!,
                    name: selectedFarcasterProfile.username!
                  });
                  setSelectedFarcasterProfiles([...selectedFarcasterProfiles, selectedFarcasterProfile]);
                  setSelectedFarcasterProfile(null);
                }
              }}
              startIcon={<AddIcon fontSize='small' />}
            >
              Add a team member
            </Button>
          </Stack>
        </Stack>
        <Stack gap={2} mb={2}>
          {selectedFarcasterProfiles.map((farcasterProfile) => (
            <Card
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flexDirection: 'row',
                p: 2
              }}
              key={farcasterProfile.fid}
            >
              <Avatar src={farcasterProfile.pfpUrl} size='large' />
              <Stack gap={0}>
                <Typography variant='h6'>{farcasterProfile.displayName}</Typography>
                <Typography variant='subtitle1' color='secondary'>
                  {farcasterProfile.username} #{farcasterProfile.fid}
                </Typography>
              </Stack>
            </Card>
          ))}
        </Stack>
        <Stack direction='row' justifyContent='space-between'>
          <Button
            variant='outlined'
            color='secondary'
            onClick={() => {
              onBack();
              setSelectedFarcasterProfiles([]);
              setSelectedFarcasterProfile(null);
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

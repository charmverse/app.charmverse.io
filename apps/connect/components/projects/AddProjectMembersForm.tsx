import { Avatar } from '@connect/components/common/Avatar';
import { SearchFarcasterUser } from '@connect/components/farcaster/SearchFarcasterUser';
import type { FarcasterProfile } from '@connect/lib/farcaster/getFarcasterUser';
import { actionCreateProject } from '@connect/lib/projects/createProjectAction';
import AddIcon from '@mui/icons-material/AddOutlined';
import { Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useFieldArray, type Control, type UseFormHandleSubmit } from 'react-hook-form';

import type { FormValues } from './utils/form';

export function AddProjectMembersForm({
  control,
  isValid,
  handleSubmit,
  onBack
}: {
  onBack: VoidFunction;
  control: Control<FormValues>;
  isValid: boolean;
  handleSubmit: UseFormHandleSubmit<FormValues>;
}) {
  const { append } = useFieldArray({
    name: 'projectMembers',
    control
  });
  const [selectedFarcasterProfiles, setSelectedFarcasterProfiles] = useState<FarcasterProfile[]>([]);
  const [selectedFarcasterProfile, setSelectedFarcasterProfile] = useState<FarcasterProfile | null>(null);
  const { execute, isExecuting } = useAction(actionCreateProject);

  return (
    <form
      onSubmit={handleSubmit((data) => {
        execute(data);
      })}
    >
      <Stack gap={1}>
        <Card>
          <CardContent sx={{ display: 'flex', gap: 2 }}>
            <Avatar
              size='xLarge'
              name='ccarella.eth'
              avatar='https://cdn.charmverse.io/user-content/d5b4e5db-868d-47b0-bc78-ebe9b5b2c835/0925e1d3-5d71-4bea-a9d2-274e9cfab80d/Noun-839.jpg'
            />
            <Box>
              <Typography>Ccarella</Typography>
              <Typography>Memetic-Artist. Techno-Optimist.</Typography>
              <Typography>Purple. Energy. Nouns. Optimism</Typography>
              <Typography>@CharmVerse</Typography>
            </Box>
          </CardContent>
        </Card>
        <Stack gap={2}>
          <Typography variant='h6'>Team</Typography>
          <Divider />
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
                    farcasterId: selectedFarcasterProfile.body.id,
                    name: selectedFarcasterProfile.body.username
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
              key={farcasterProfile.body.id}
            >
              <Avatar src={farcasterProfile.body.avatarUrl} size='large' />
              <Stack gap={0}>
                <Typography variant='h6'>{farcasterProfile.body.displayName}</Typography>
                <Typography variant='subtitle1' color='secondary'>
                  {farcasterProfile.body.username} #{farcasterProfile.body.id}
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

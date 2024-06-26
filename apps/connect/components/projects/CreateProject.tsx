'use client';

import type { FormValues } from '@connect/lib/projects/form';
import { schema } from '@connect/lib/projects/form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import type { FarcasterProfile } from 'lib/farcaster/getFarcasterProfile';
import type { LoggedInUser } from 'models/User';

import { PageWrapper } from '../common/PageWrapper';

import { AddProjectMembersForm } from './AddProjectMembersForm';
import { CreateProjectForm } from './CreateProjectForm';

export default function CreateProject({ user }: { user: LoggedInUser }) {
  const [showTeamMemberForm, setShowTeamMemberForm] = useState(false);

  const {
    control,
    formState: { isValid },
    handleSubmit
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      projectMembers: [
        {
          farcasterId: user?.farcasterUser?.fid,
          name: (user?.farcasterUser?.account as FarcasterProfile['body'])?.displayName
        }
      ]
    },
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  if (!showTeamMemberForm) {
    return (
      <PageWrapper>
        <Box mt={2} gap={2} display='flex' flexDirection='column'>
          <Typography variant='h5'>Create a Project</Typography>
          <CreateProjectForm
            control={control}
            isValid={isValid}
            onNext={() => {
              setShowTeamMemberForm(true);
            }}
          />
        </Box>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Box mt={2} gap={2} display='flex' flexDirection='column'>
        <Typography variant='h5'>Add Team Members</Typography>
        <AddProjectMembersForm
          user={user}
          onBack={() => {
            setShowTeamMemberForm(false);
          }}
          control={control}
          isValid={isValid}
          handleSubmit={handleSubmit}
        />
      </Box>
    </PageWrapper>
  );
}

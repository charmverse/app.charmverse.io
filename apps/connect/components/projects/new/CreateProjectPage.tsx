'use client';

import { PageTitle } from '@connect/components/common/PageTitle';
import { PageWrapper } from '@connect/components/common/PageWrapper';
import type { FormValues } from '@connect/lib/projects/form';
import { schema } from '@connect/lib/projects/form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box } from '@mui/system';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import type { FarcasterProfile } from 'lib/farcaster/getFarcasterProfile';
import type { LoggedInUser } from 'models/User';

import { AddProjectMembersForm } from '../components/AddProjectMembersForm';

import { CreateProjectForm } from './components/CreateProjectForm';

export function CreateProjectPage({ user }: { user: LoggedInUser }) {
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
        <Box gap={2} display='flex' flexDirection='column'>
          <PageTitle>Create a Project</PageTitle>
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
      <Box gap={2} display='flex' flexDirection='column'>
        <PageTitle>Add Team Members</PageTitle>
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

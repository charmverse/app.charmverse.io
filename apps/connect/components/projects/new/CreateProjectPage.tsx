'use client';

import { PageWrapper } from '@connect/components/common/PageWrapper';
import type { ProjectData } from '@connect/lib/actions/fetchProject';
import type { FormValues } from '@connect/lib/projects/form';
import { schema } from '@connect/lib/projects/form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import type { FarcasterProfile } from 'lib/farcaster/getFarcasterProfile';
import { isTruthy } from 'lib/utils/types';
import type { LoggedInUser } from 'models/User';

import { AddProjectMembersForm } from '../components/AddProjectMembersForm';
import { ProjectDetails } from '../components/ProjectDetails';
import { ProjectHeader } from '../components/ProjectHeader';

import { CreateProjectForm } from './components/CreateProjectForm';

export function CreateProjectPage({ user }: { user: LoggedInUser }) {
  const [showTeamMemberForm, setShowTeamMemberForm] = useState(false);

  const {
    control,
    formState: { isValid },
    handleSubmit,
    getValues
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

  const values = getValues();
  const { farcasterIds, ...restProject } = values;
  const project = {
    ...restProject,
    id: '',
    farcasterValues: farcasterIds?.filter(isTruthy) || [],
    farcasterFrameImage: '',
    projectMembers: []
  } as NonNullable<ProjectData>;

  return (
    <PageWrapper header={<ProjectHeader name={project.name} avatar={project.avatar} coverImage={project.coverImage} />}>
      <Box gap={2} display='flex' flexDirection='column'>
        <ProjectDetails project={project} />
        <Typography variant='h5'>Add team members</Typography>
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

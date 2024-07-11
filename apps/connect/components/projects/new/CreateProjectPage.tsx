'use client';

import { PageCoverHeader } from '@connect/components/common/PageCoverHeader';
import { PageWrapper } from '@connect/components/common/PageWrapper';
import type { LoggedInUser } from '@connect/lib/profile/interfaces';
import type { FormValues } from '@connect/lib/projects/form';
import { schema } from '@connect/lib/projects/form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import type { FarcasterProfile } from 'lib/farcaster/getFarcasterProfile';

import { AddProjectMembersForm } from '../components/AddProjectMembersForm';
import type { ProjectDetailsProps } from '../components/ProjectDetails';
import { ProjectDetails } from '../components/ProjectDetails';

import { CreateProjectForm } from './components/CreateProjectForm';

export function CreateProjectPage({ user }: { user: LoggedInUser }) {
  const [showTeamMemberForm, setShowTeamMemberForm] = useState(false);

  const router = useRouter();

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

  const project = getValues();
  const projectDetails = {
    id: '',
    name: project.name,
    description: project.description,
    farcasterValues: project.farcasterValues,
    github: project.github,
    mirror: project.mirror,
    twitter: project.twitter,
    websites: project.websites
  } as ProjectDetailsProps['project'];

  return (
    <PageWrapper
      header={<PageCoverHeader name={project.name} avatar={project.avatar} coverImage={project.coverImage} />}
    >
      <Box gap={2} display='flex' flexDirection='column'>
        <ProjectDetails project={projectDetails} />
        <Typography variant='h5' data-test='project-form-add-team'>
          Add team members
        </Typography>
        <AddProjectMembersForm
          user={user}
          onBack={() => {
            setShowTeamMemberForm(false);
          }}
          control={control}
          isValid={isValid}
          handleSubmit={handleSubmit}
          onSuccess={({ projectPath }) => {
            router.push(`/p/${projectPath}/publish`);
          }}
        />
      </Box>
    </PageWrapper>
  );
}

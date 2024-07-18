'use client';

import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { PageWrapper } from 'components/common/PageWrapper';
import type { LoggedInUser } from 'lib/profile/getCurrentUserAction';
import { createProjectAction } from 'lib/projects/createProjectAction';
import { schema } from 'lib/projects/form';
import type { FormValues } from 'lib/projects/form';

import { AddProjectMembersForm } from '../components/AddProjectMembersForm';
import type { ProjectDetailsProps } from '../components/ProjectDetails';
import { ProjectDetails } from '../components/ProjectDetails';
import { ProjectForm } from '../components/ProjectForm';
import { ProjectHeader } from '../components/ProjectHeader';

export function CreateProjectPage({ user }: { user: LoggedInUser }) {
  const [showTeamMemberForm, setShowTeamMemberForm] = useState(false);

  const router = useRouter();

  // @ts-ignore
  const { execute, isExecuting } = useAction(createProjectAction, {
    onSuccess: (data) => {
      router.push(`/p/${data.data?.projectPath as string}/publish`);
    },
    onError(err) {
      log.error(err.error.serverError?.message || 'Something went wrong', err.error.serverError);
    }
  });

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
          farcasterId: user?.farcasterUser?.fid
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
          <ProjectForm
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
    <PageWrapper header={<ProjectHeader name={project.name} avatar={project.avatar} coverImage={project.coverImage} />}>
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
          execute={execute}
          isExecuting={isExecuting}
        />
      </Box>
    </PageWrapper>
  );
}

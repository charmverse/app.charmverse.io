'use client';

import { log } from '@charmverse/core/log';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import { schema, type FormValues } from '@connect-shared/lib/projects/form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { PageCoverHeader } from 'components/common/PageCoverHeader';
import { actionCreateProject } from 'lib/projects/createProjectAction';

import { AddProjectMembersForm } from '../components/AddProjectMembersForm';
import type { ProjectDetailsProps } from '../components/ProjectDetails';
import { ProjectDetails } from '../components/ProjectDetails';
import { ProjectForm } from '../components/ProjectForm';

export function CreateProjectPage({ user }: { user: LoggedInUser }) {
  const [showTeamMemberForm, setShowTeamMemberForm] = useState(false);

  const router = useRouter();

  const { execute, isExecuting } = useAction(actionCreateProject, {
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
      description: '',
      category: '' as any,
      websites: [''],
      farcasterValues: [''],
      twitter: '',
      github: '',
      projectMembers: [
        {
          farcasterId: user?.farcasterUser?.fid
        }
      ]
    },
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  const handleNext = () => {
    // Scroll to top before changing the state. In Firefox the page flickers because of a weird scroll.
    window.scrollTo({ top: 0, behavior: 'auto' });
    setShowTeamMemberForm(true);
  };
  const handleBack = () => {
    setShowTeamMemberForm(false);
  };

  if (!showTeamMemberForm) {
    return (
      <PageWrapper>
        <ProjectForm control={control} isValid={isValid} onNext={handleNext} />
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
    twitter: project.twitter,
    websites: project.websites
  } as ProjectDetailsProps['project'];

  return (
    <PageWrapper
      header={<PageCoverHeader name={project.name} avatar={project.avatar} coverImage={project.coverImage} />}
    >
      <Box gap={2} display='flex' flexDirection='column'>
        <AddProjectMembersForm
          user={user}
          onBack={handleBack}
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

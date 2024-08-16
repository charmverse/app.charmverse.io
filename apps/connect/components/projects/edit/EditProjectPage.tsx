'use client';

import { log } from '@charmverse/core/log';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import type { ConnectProjectDetails } from '@connect-shared/lib/projects/findProject';
import type { FormValues, ProjectCategory } from '@connect-shared/lib/projects/form';
import { schema } from '@connect-shared/lib/projects/form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { PageCoverHeader } from 'components/common/PageCoverHeader';
import { actionEditProject } from 'lib/projects/editProjectAction';

import { AddProjectMembersForm } from '../components/AddProjectMembersForm';
import type { ProjectDetailsProps } from '../components/ProjectDetails';
import { ProjectDetails } from '../components/ProjectDetails';
import { ProjectForm } from '../components/ProjectForm';

export function EditProjectPage({ user, project }: { user: LoggedInUser; project: ConnectProjectDetails }) {
  const [showTeamMemberForm, setShowTeamMemberForm] = useState(false);

  const router = useRouter();

  const { execute, isExecuting } = useAction(actionEditProject, {
    onSuccess: () => {
      router.push(`/p/${project.path}`);
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
      name: project.name,
      avatar: project.avatar ?? undefined,
      category: project.category as ProjectCategory,
      coverImage: project.coverImage ?? undefined,
      description: project.description ?? undefined,
      farcasterValues: project.farcasterValues,
      github: project.github ?? undefined,
      twitter: project.twitter ?? undefined,
      websites: project.websites,
      projectMembers:
        project.projectMembers.map(
          (member) =>
            ({
              farcasterId: member.farcasterUser.fid,
              name: member.farcasterUser.displayName
            } as FormValues['projectMembers'][0])
        ) ?? []
    },
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  if (!showTeamMemberForm) {
    return (
      <PageWrapper>
        <ProjectForm
          control={control}
          isValid={isValid}
          onNext={() => {
            setShowTeamMemberForm(true);
          }}
        />
      </PageWrapper>
    );
  }

  const projectValues = getValues();

  const projectDetails = {
    id: '',
    name: projectValues.name,
    description: projectValues.description,
    farcasterValues: projectValues.farcasterValues,
    github: projectValues.github,
    twitter: projectValues.twitter,
    websites: projectValues.websites
  } as ProjectDetailsProps['project'];

  return (
    <PageWrapper
      header={
        <PageCoverHeader
          name={projectValues.name}
          avatar={projectValues.avatar}
          coverImage={projectValues.coverImage}
        />
      }
    >
      <Box gap={2} display='flex' flexDirection='column'>
        <ProjectDetails project={projectDetails} />
        <Typography variant='h5'>Edit team members</Typography>
        <AddProjectMembersForm
          user={user}
          onBack={() => {
            setShowTeamMemberForm(false);
          }}
          control={control}
          isValid={isValid}
          handleSubmit={handleSubmit}
          execute={(input) => {
            execute({
              ...input,
              id: project.id,
              projectMembers: input.projectMembers.slice(1)
            });
          }}
          isExecuting={isExecuting}
          // Skip the first member which is the team lead
          initialFarcasterProfiles={project.projectMembers.slice(1).map((member) => ({
            bio: member.farcasterUser.bio,
            displayName: member.farcasterUser.displayName,
            fid: member.farcasterUser.fid,
            pfpUrl: member.farcasterUser.pfpUrl,
            username: member.farcasterUser.username
          }))}
        />
      </Box>
    </PageWrapper>
  );
}

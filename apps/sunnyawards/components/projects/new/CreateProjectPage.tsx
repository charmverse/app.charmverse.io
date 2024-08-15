'use client';

import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box } from '@mui/system';
import type { FarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';
import { concatenateStringValues } from '@root/lib/utils/strings';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { createProjectAction } from 'lib/projects/createProjectAction';
import type { FormValues } from 'lib/projects/form';
import { schema } from 'lib/projects/form';

import { AddProjectMembersForm } from '../components/AddProjectMembersForm';
import type { ProjectDetailsProps } from '../components/ProjectDetails';
import { ProjectDetails } from '../components/ProjectDetails';
import { ProjectForm } from '../components/ProjectForm';
import { ProjectHeader } from '../components/ProjectHeader';

export function CreateProjectPage({ user }: { user: LoggedInUser }) {
  const [showTeamMemberForm, setShowTeamMemberForm] = useState(false);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { execute, isExecuting } = useAction(createProjectAction, {
    onExecute: () => {
      setError(null);
    },
    onSuccess: (data) => {
      router.push(`/p/${data.data?.projectPath as string}/share`);
    },
    onError(err) {
      const errorMessage = err.error.validationErrors
        ? concatenateStringValues(err.error.validationErrors.fieldErrors)
        : err.error.serverError?.message || 'Something went wrong';

      setError(errorMessage);
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
      sunnyAwardsProjectType: 'other',
      twitter: '',
      github: '',
      projectMembers: [
        {
          name: (user?.farcasterUser?.account as FarcasterProfile['body'])?.displayName,
          farcasterId: user?.farcasterUser?.fid
        }
      ]
    },
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  if (!showTeamMemberForm) {
    return (
      <PageWrapper bgcolor='transparent'>
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
      bgcolor='transparent'
      header={<ProjectHeader name={project.name} avatar={project.avatar} coverImage={project.coverImage} />}
    >
      <Box gap={2} display='flex' flexDirection='column'>
        <ProjectDetails project={projectDetails} />
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
          error={error}
        />
      </Box>
    </PageWrapper>
  );
}

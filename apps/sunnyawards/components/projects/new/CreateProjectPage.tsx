'use client';

import type { OptimismProjectAttestation } from '@charmverse/core/prisma-client';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import { yupResolver } from '@hookform/resolvers/yup';
import type { OptimismProject } from '@root/lib/credentials/mapProjectToOptimism';
import type { FarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';
import { concatenateStringValues } from '@root/lib/utils/strings';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Address } from 'viem';

import { createProjectAction } from 'lib/projects/createProjectAction';
import type { OptimismProjectWithMembers } from 'lib/projects/fetchUnimportedOptimismProjectsAction';
import type { FormValues } from 'lib/projects/schema';
import { schema } from 'lib/projects/schema';

import { ProjectForm } from '../components/ProjectForm';

import { ImportOptimismProject } from './ImportOptimismProject';

export function CreateProjectPage({
  user,
  optimismProjects
}: {
  user: LoggedInUser;
  optimismProjects: OptimismProjectWithMembers[];
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<string[] | null>(null);

  const { execute, isExecuting } = useAction(createProjectAction, {
    onExecute: () => {
      setErrors(null);
    },
    onSuccess: (data) => {
      setErrors(null);
      const projectPath = data.data?.projectPath;
      if (projectPath) {
        router.push(`/p/${projectPath}/share`);
      }
    },
    onError(err) {
      const hasValidationErrors = err.error.validationErrors?.fieldErrors;
      const errorMessage = hasValidationErrors
        ? concatenateStringValues(err.error.validationErrors!.fieldErrors)
        : err.error.serverError?.message || 'Something went wrong';

      setErrors(errorMessage instanceof Array ? errorMessage : [errorMessage]);
    }
  });

  const {
    control,
    formState: { isValid },
    handleSubmit,
    setValue,
    getValues,
    trigger
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      sunnyAwardsCategory: '' as any,
      websites: [''],
      farcasterValues: [''],
      sunnyAwardsProjectType: 'other',
      primaryContractChainId: '',
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

  function handleProjectSelect(project: OptimismProjectWithMembers) {
    // Casting as partial in case project was created before a metadata schema change
    const metadata = project.metadata as Partial<OptimismProject>;

    setValue('name', project.name);

    setValue('description', metadata.description || '');
    setValue('websites', metadata.socialLinks?.website || []);
    setValue('twitter', metadata.socialLinks?.twitter || '');
    setValue('github', metadata.github?.[0] || '');
    setValue('farcasterValues', metadata.socialLinks?.farcaster || []);

    setValue('avatar', metadata.projectAvatarUrl || '');
    setValue('coverImage', metadata.projectCoverImageUrl || '');

    if (metadata.contracts?.[0]) {
      setValue('primaryContractChainId', metadata.contracts[0].chainId.toString());
      setValue('primaryContractAddress', metadata.contracts[0].address as Address);
    }

    setValue('projectMembers', project.projectMembers);

    trigger('name');
  }

  return (
    <PageWrapper bgcolor='transparent'>
      <form
        onSubmit={handleSubmit((data) => {
          execute(data);
        })}
      >
        <ImportOptimismProject
          control={control}
          optimismProjects={optimismProjects}
          handleProjectSelect={handleProjectSelect}
        />
        <ProjectForm control={control} isExecuting={isExecuting} user={user} errors={errors} />
      </form>
    </PageWrapper>
  );
}

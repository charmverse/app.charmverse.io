'use client';

import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import { PageWrapper } from '@packages/connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@packages/connect-shared/lib/profile/getCurrentUserAction';
import type { OptimismProject } from '@packages/credentials/mapProjectToOptimism';
import type { FarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';
import { concatenateStringValues } from '@root/lib/utils/strings';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import type { Address } from 'viem';

import { createProjectAction } from 'lib/projects/createProjectAction';
import type { OptimismProjectWithMembers } from 'lib/projects/getUnimportedOptimismProjectsAction';
import type { FormValues } from 'lib/projects/schema';
import { schema } from 'lib/projects/schema';

import { ProjectForm } from '../components/ProjectForm';

import { ImportOptimismProject } from './ImportOptimismProject';

export function NewProjectPage({
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

  const { control, handleSubmit, getValues, reset } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      sunnyAwardsCategory: '' as any,
      sunnyAwardsCategoryDetails: '',
      websites: [''],
      farcasterValues: [''],
      sunnyAwardsProjectType: 'other',
      primaryContractChainId: '',
      twitter: '',
      github: '',
      projectMembers: user.farcasterUser
        ? [
            {
              name: (user?.farcasterUser?.account as FarcasterProfile['body'])?.displayName,
              farcasterId: user?.farcasterUser?.fid,
              farcasterUser: {
                fid: user?.farcasterUser?.fid,
                displayName: (user?.farcasterUser?.account as FarcasterProfile['body'])?.displayName,
                pfpUrl:
                  (user?.farcasterUser?.account as FarcasterProfile['body'])?.avatarUrl ||
                  (user.farcasterUser?.account as { pfpUrl: string })?.pfpUrl,
                username: (user?.farcasterUser?.account as FarcasterProfile['body'])?.username
              }
            }
          ]
        : []
    },
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  function handleProjectSelect(project: OptimismProjectWithMembers) {
    // Casting as partial in case project was created before a metadata schema change
    const metadata = project.metadata as Partial<OptimismProject>;

    reset({
      name: project.name,
      description: metadata.description || '',
      websites: metadata.socialLinks?.website || [],
      twitter: metadata.socialLinks?.twitter || '',
      github: metadata.github?.[0] || '',
      farcasterValues: metadata.socialLinks?.farcaster || [],
      avatar: metadata.projectAvatarUrl || '',
      // Some attestations were written with this typo in the metadata
      coverImage: (metadata as any).proejctCoverImageUrl || metadata.projectCoverImageUrl || '',
      primaryContractChainId: metadata.contracts?.[0]?.chainId.toString() || '',
      primaryContractAddress: metadata.contracts?.[0]?.address as Address,
      projectMembers: project.projectMembers
    });
  }

  function onInvalid(fieldErrors: FieldErrors) {
    const invalidFields = Object.keys(fieldErrors);
    if (invalidFields.length === 0) {
      setErrors(['The form is invalid. Please check the fields and try again.']);
    } else {
      setErrors([`The form is invalid. Please check the following fields: ${invalidFields.join(', ')}`]);
    }
    log.warn('Invalid form submission', { fieldErrors, values: getValues() });
  }

  return (
    <PageWrapper bgcolor='transparent'>
      {/* add noValidate so that we onyl rely on react-hook-form validation */}
      <form noValidate onSubmit={handleSubmit(execute, onInvalid)}>
        <ImportOptimismProject
          control={control}
          optimismProjects={optimismProjects}
          handleProjectSelect={handleProjectSelect}
        />
        <ProjectForm
          control={control}
          isExecuting={isExecuting}
          user={user}
          errors={errors}
          submitLabel='Accept Invite'
        />
      </form>
    </PageWrapper>
  );
}

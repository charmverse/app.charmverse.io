'use client';

import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import { PageWrapper } from '@packages/connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@packages/connect-shared/lib/profile/getCurrentUserAction';
import type { ConnectProjectDetails } from '@packages/connect-shared/lib/projects/findProject';
import { concatenateStringValues } from '@root/lib/utils/strings';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { ConfirmationModalProvider } from 'hooks/useConfirmationModal';
import { editProjectAction } from 'lib/projects/editProjectAction';
import type { FormValues, SunnyProjectCategory } from 'lib/projects/schema';
import { schema } from 'lib/projects/schema';
import { softDeleteProjectAction } from 'lib/projects/softDeleteProjectAction';

import { ProjectForm } from '../components/ProjectForm';

export function EditProjectPage({ user, project }: { user: LoggedInUser; project: ConnectProjectDetails }) {
  const router = useRouter();
  const [errors, setErrors] = useState<string[] | null>(null);

  const { execute, isExecuting } = useAction(editProjectAction, {
    onExecute: () => {
      setErrors(null);
    },
    onSuccess: () => {
      setErrors(null);
      router.push(`/p/${project.path}`);
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
    execute: executeDeleteProject,
    isExecuting: isExecutingDeleteProject,
    result: deleteResult
  } = useAction(softDeleteProjectAction, {
    onExecute: () => {
      setErrors(null);
    },
    onSuccess: () => {
      setErrors(null);
      router.push(`/profile`);
    }
  });

  function handleDelete() {
    executeDeleteProject({ projectId: project.id });
  }

  const { control, handleSubmit, getValues } = useForm<FormValues>({
    defaultValues: {
      id: project.id,
      name: project.name,
      avatar: project.avatar ?? '',
      sunnyAwardsCategory: project.sunnyAwardsCategory as SunnyProjectCategory,
      sunnyAwardsCategoryDetails: project.sunnyAwardsCategoryDetails ?? '',
      coverImage: project.coverImage ?? '',
      description: project.description ?? '',
      farcasterValues: project.farcasterValues,
      github: project.github ?? '',
      twitter: project.twitter ?? '',
      websites: project.websites,
      sunnyAwardsProjectType: project.sunnyAwardsProjectType ?? ('' as any),
      primaryContractChainId: project.primaryContractChainId?.toString() ?? '',
      primaryContractAddress: (project.primaryContractAddress as `0x${string}`) ?? '',
      mintingWalletAddress: (project.mintingWalletAddress as `0x${string}`) ?? '',
      projectMembers: project.projectMembers
    },
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

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
      <form
        onSubmit={handleSubmit((data) => {
          execute({
            ...data,
            projectMembers: data.projectMembers.filter((m) => m.farcasterId !== user.farcasterUser?.fid)
          });
        }, onInvalid)}
      >
        <ConfirmationModalProvider>
          <ProjectForm
            control={control}
            isExecuting={isExecuting}
            user={user}
            errors={errors}
            submitLabel='Update Submission'
            onDelete={handleDelete}
            isDeleting={isExecutingDeleteProject}
          />
        </ConfirmationModalProvider>
      </form>
    </PageWrapper>
  );
}

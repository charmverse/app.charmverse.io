'use client';

import { log } from '@charmverse/core/log';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import type { ConnectProjectDetails } from '@connect-shared/lib/projects/findProject';
import { yupResolver } from '@hookform/resolvers/yup';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { concatenateStringValues } from '@root/lib/utils/strings';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { editProjectAction } from 'lib/projects/editProjectAction';
import type { FormValues, ProjectCategory } from 'lib/projects/form';
import { schema } from 'lib/projects/form';

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

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      id: project.id,
      name: project.name,
      avatar: project.avatar ?? '',
      category: project.category as ProjectCategory,
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
      projectMembers:
        project.projectMembers.map(
          (member) =>
            ({
              farcasterId: member.farcasterUser.fid,
              name: member.farcasterUser.displayName
            } as FormValues['projectMembers'][0])
        ) || []
    },
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  return (
    <PageWrapper bgcolor='transparent'>
      <form
        onSubmit={handleSubmit((data) => {
          execute({
            ...data,
            projectMembers: data.projectMembers.filter((m) => m.farcasterId !== user.farcasterUser?.fid)
          });
        })}
      >
        <ProjectForm
          control={control}
          isExecuting={isExecuting}
          user={user}
          projectMembers={project.projectMembers}
          errors={errors}
        />
      </form>
    </PageWrapper>
  );
}

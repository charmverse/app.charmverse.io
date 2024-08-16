'use client';

import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import { yupResolver } from '@hookform/resolvers/yup';
import type { FarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';
import { concatenateStringValues } from '@root/lib/utils/strings';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { createProjectAction } from 'lib/projects/createProjectAction';
import type { FormValues } from 'lib/projects/form';
import { schema } from 'lib/projects/form';

import { ProjectForm } from '../components/ProjectForm';

export function CreateProjectPage({ user }: { user: LoggedInUser }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { execute, isExecuting } = useAction(createProjectAction, {
    onExecute: () => {
      setError(null);
    },
    onSuccess: (data) => {
      const projectPath = data.data?.projectPath;
      if (projectPath) {
        router.push(`/p/${projectPath}/share`);
      }
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
    handleSubmit
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

  return (
    <PageWrapper bgcolor='transparent'>
      <form
        onSubmit={handleSubmit((data) => {
          execute(data);
        })}
      >
        <ProjectForm control={control} isExecuting={isExecuting} user={user} />
      </form>
    </PageWrapper>
  );
}

'use client';

import { log } from '@charmverse/core/log';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import { yupResolver } from '@hookform/resolvers/yup';
import type { FarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import { createProjectAction } from 'lib/projects/createProjectAction';
import type { FormValues } from 'lib/projects/form';
import { schema } from 'lib/projects/form';

import { ProjectForm } from '../components/ProjectForm';

export function CreateProjectPage({ user }: { user: LoggedInUser }) {
  const router = useRouter();

  const { execute, isExecuting } = useAction(createProjectAction, {
    onSuccess: (data) => {
      const projectPath = data.data?.projectPath;
      if (projectPath) {
        router.push(`/p/${projectPath}/share`);
      }
    },
    onError(err) {
      log.error(err.error.serverError?.message || 'Something went wrong', err.error.serverError);
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

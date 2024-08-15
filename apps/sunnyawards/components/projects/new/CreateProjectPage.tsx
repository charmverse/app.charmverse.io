'use client';

import { log } from '@charmverse/core/log';
import { LoadingComponent } from '@connect-shared/components/common/Loading/LoadingComponent';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Stack } from '@mui/material';
import type { FarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import { createProjectAction } from 'lib/projects/createProjectAction';
import type { FormValues } from 'lib/projects/form';
import { schema } from 'lib/projects/form';

import { AddProjectMembersForm } from '../components/AddProjectMembersForm';
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
        <ProjectForm control={control} />
        <AddProjectMembersForm user={user} control={control} disabled={isExecuting} />
        <Stack direction='row' justifyContent='space-between'>
          <Button LinkComponent={Link} href='/profile' variant='outlined' color='secondary'>
            Cancel
          </Button>
          <Stack direction='row' gap={1}>
            {isExecuting && (
              <LoadingComponent
                height={20}
                size={20}
                minHeight={20}
                label='Submitting your project onchain'
                flexDirection='row-reverse'
              />
            )}
            <Button data-test='project-form-publish' disabled={!isValid || isExecuting} type='submit'>
              Publish
            </Button>
          </Stack>
        </Stack>
      </form>
    </PageWrapper>
  );
}

'use client';

import { log } from '@charmverse/core/log';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { ProjectForm } from '@connect-shared/components/project/ProjectForm';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import { schema, type FormValues } from '@connect-shared/lib/projects/form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Stack } from '@mui/material';
import { Box } from '@mui/system';
import { ConnectApiClient } from 'apiClient/apiClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { PageCoverHeader } from 'components/common/PageCoverHeader';
import { actionCreateProject } from 'lib/projects/createProjectAction';

import { AddProjectMembersForm } from '../components/AddProjectMembersForm';

const connectApiClient = new ConnectApiClient();

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
      projectMembers: [
        {
          farcasterId: user?.farcasterUser?.fid
        }
      ]
    },
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  if (!showTeamMemberForm) {
    return (
      <PageWrapper>
        <ProjectForm uploadImageFn={connectApiClient.uploadImage} control={control} />
        <Stack
          justifyContent='space-between'
          flexDirection='row'
          position='sticky'
          bottom='0'
          bgcolor='background.default'
          py={2}
        >
          <Link href='/profile' passHref>
            <Button size='large' color='secondary' variant='outlined'>
              Cancel
            </Button>
          </Link>
          <Button
            data-test='project-form-confirm-values'
            size='large'
            disabled={!isValid}
            onClick={() => {
              setShowTeamMemberForm(true);
            }}
          >
            Next
          </Button>
        </Stack>
      </PageWrapper>
    );
  }

  const project = getValues();

  return (
    <PageWrapper
      header={<PageCoverHeader name={project.name} avatar={project.avatar} coverImage={project.coverImage} />}
    >
      <Box gap={2} display='flex' flexDirection='column'>
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
        />
      </Box>
    </PageWrapper>
  );
}

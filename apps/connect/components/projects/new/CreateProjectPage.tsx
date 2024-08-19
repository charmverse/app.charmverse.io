'use client';

import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { ProjectForm } from '@connect-shared/components/project/ProjectForm';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import { Button, FormHelperText, Stack } from '@mui/material';
import { Box } from '@mui/system';
import Link from 'next/link';
import { useState } from 'react';

import { PageCoverHeader } from 'components/common/PageCoverHeader';

import { AddProjectMembersForm } from '../components/AddProjectMembersForm';
import { useCreateProject } from '../hooks/useCreateProject';

export function CreateProjectPage({ user }: { user: LoggedInUser }) {
  const [showTeamMemberForm, setShowTeamMemberForm] = useState(false);

  const {
    isExecuting,
    formState: { isValid, errors },
    control,
    handleSubmit,
    getValues
  } = useCreateProject({ fid: user.farcasterUser?.fid });

  const handleNext = () => {
    // Scroll to top before changing the state. In Firefox the page flickers because of a weird scroll.
    window.scrollTo({ top: 0, behavior: 'auto' });
    setShowTeamMemberForm(true);
  };
  const handleBack = () => {
    setShowTeamMemberForm(false);
  };

  if (!showTeamMemberForm) {
    return (
      <PageWrapper>
        <ProjectForm control={control} showCategory />
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
          <Button data-test='project-form-confirm-values' size='large' disabled={!isValid} onClick={handleNext}>
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
          onBack={handleBack}
          control={control}
          isValid={isValid}
          handleSubmit={handleSubmit}
          isExecuting={isExecuting}
        />
        {errors?.root?.serverError && (
          <FormHelperText color='error'>{errors?.root?.serverError?.message}</FormHelperText>
        )}
      </Box>
    </PageWrapper>
  );
}

'use client';

import { Box, Typography } from '@mui/material';
import { useState } from 'react';

import { PageWrapper } from 'components/common/PageWrapper';
import { AddProjectMembersForm } from 'components/projects/AddProjectMembersForm';
import { CreateProjectForm } from 'components/projects/CreateProjectForm';

export default function CreateProject() {
  const [showTeamMemberForm, setShowTeamMemberForm] = useState(false);

  if (!showTeamMemberForm) {
    return (
      <PageWrapper>
        <Box mt={2} gap={2} display='flex' flexDirection='column'>
          <Typography variant='h5'>Create a Project</Typography>
          <CreateProjectForm />
        </Box>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Box mt={2} gap={2} display='flex' flexDirection='column'>
        <Typography variant='h5'>Add Team Members</Typography>
        <AddProjectMembersForm />
      </Box>
    </PageWrapper>
  );
}

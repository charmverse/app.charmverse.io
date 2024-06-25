'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { PageWrapper } from 'components/common/PageWrapper';
import { AddProjectMembersForm } from 'components/projects/AddProjectMembersForm';
import { CreateProjectForm } from 'components/projects/CreateProjectForm';
import { schema } from 'components/projects/utils/form';

export default function CreateProject() {
  const [showTeamMemberForm, setShowTeamMemberForm] = useState(false);

  const {
    control,
    formState: { isValid },
    handleSubmit
  } = useForm({
    defaultValues: {
      name: '',
      projectMembers: [
        {
          farcasterId: 1,
          name: 'ccarella.eth'
        }
      ]
    },
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  if (!showTeamMemberForm) {
    return (
      <PageWrapper>
        <Box mt={2} gap={2} display='flex' flexDirection='column'>
          <Typography variant='h5'>Create a Project</Typography>
          <CreateProjectForm
            control={control}
            isValid={isValid}
            onNext={() => {
              setShowTeamMemberForm(true);
            }}
          />
        </Box>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Box mt={2} gap={2} display='flex' flexDirection='column'>
        <Typography variant='h5'>Add Team Members</Typography>
        <AddProjectMembersForm
          onBack={() => {
            setShowTeamMemberForm(false);
          }}
          control={control}
          isValid={isValid}
          handleSubmit={handleSubmit}
        />
      </Box>
    </PageWrapper>
  );
}

import AddIcon from '@mui/icons-material/Add';
import { Box, Stack } from '@mui/material';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useCreateProject, useGetProjects } from 'charmClient/hooks/projects';
import { Button } from 'components/common/Button';
import { ProjectFormAnswers } from 'components/settings/projects/ProjectForm';
import { defaultProjectFieldConfig } from 'lib/projects/constants';
import type { ProjectWithMembers, ProjectAndMembersPayload } from 'lib/projects/interfaces';

export function CreateProjectForm({
  onCancel,
  onSave
}: {
  onSave?: (project: ProjectWithMembers) => void;
  onCancel?: VoidFunction;
}) {
  const { trigger: createProject, isMutating } = useCreateProject();
  const { formState, getValues, reset } = useFormContext<ProjectAndMembersPayload>();

  const isValid = formState.isValid;
  const { mutate } = useGetProjects();

  async function saveProject() {
    const project = getValues();
    try {
      const createdProjectWithMembers = await createProject(project);
      onSave?.(createdProjectWithMembers);
      mutate(
        (cachedData) => {
          if (!cachedData) {
            return cachedData;
          }

          return [...cachedData, createdProjectWithMembers];
        },
        {
          revalidate: false
        }
      );
    } catch (err) {
      //
    }
  }

  return (
    <>
      <ProjectFormAnswers defaultRequired={false} fieldConfig={defaultProjectFieldConfig} isTeamLead />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          py: 1,
          px: { xs: 5, md: 0 },
          position: 'sticky',
          bottom: '0',
          background: (theme) => theme.palette.background.paper,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`
        }}
      >
        <Stack gap={1} flexDirection='row'>
          <Button
            disabled={isMutating}
            variant='outlined'
            color='error'
            onClick={() => {
              reset();
              onCancel?.();
            }}
          >
            Cancel
          </Button>
          <Button
            disabledTooltip={!isValid ? 'Please fill out all required fields' : ''}
            disabled={isMutating || !isValid}
            onClick={saveProject}
            data-test='save-new-project-button'
          >
            Save
          </Button>
        </Stack>
      </Box>
    </>
  );
}

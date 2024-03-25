import AddIcon from '@mui/icons-material/Add';
import { Box, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useCreateProject, useGetProjects } from 'charmClient/hooks/projects';
import { Button } from 'components/common/Button';
import type { ProjectValues, ProjectWithMembers } from 'components/projects/interfaces';
import { defaultProjectFieldConfig } from 'components/projects/interfaces';
import { ProjectFormAnswers } from 'components/projects/ProjectForm';

export function CreateProjectForm({
  onCancel,
  onSave
}: {
  onSave?: (project: ProjectWithMembers) => void;
  onCancel?: VoidFunction;
}) {
  const [open, setOpen] = useState(false);
  const { trigger: createProject, isMutating } = useCreateProject();
  const { formState, getValues } = useFormContext<ProjectValues>();

  const isValid = formState.isValid;
  const { mutate } = useGetProjects();

  async function saveProject() {
    const project = getValues();
    try {
      const createdProjectWithMember = await createProject(project);
      onSave?.(createdProjectWithMember);
      setOpen(false);
      mutate(
        (cachedData) => {
          if (!cachedData) {
            return cachedData;
          }

          return [...cachedData, createdProjectWithMember];
        },
        {
          revalidate: false
        }
      );
    } catch (err) {
      //
    }
  }

  if (!open) {
    return (
      <Button
        disabled={isMutating}
        onClick={() => {
          setOpen(true);
        }}
        startIcon={<AddIcon fontSize='small' />}
      >
        Add a project
      </Button>
    );
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
              setOpen(false);
              onCancel?.();
            }}
          >
            Cancel
          </Button>
          <Button
            disabledTooltip={!isValid ? 'Please fill out all required fields' : ''}
            disabled={isMutating || !isValid}
            onClick={saveProject}
          >
            Save
          </Button>
        </Stack>
      </Box>
    </>
  );
}

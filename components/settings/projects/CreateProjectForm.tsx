import AddIcon from '@mui/icons-material/Add';
import { Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useCreateProject, useGetProjects } from 'charmClient/hooks/projects';
import { Button } from 'components/common/Button';
import type { ProjectValues, ProjectWithMembers } from 'components/projects/interfaces';
import { defaultProjectFieldConfig } from 'components/projects/interfaces';
import { ProjectFormAnswers } from 'components/projects/ProjectForm';

export function CreateProjectForm({
  onCancel,
  isOpen,
  onSave
}: {
  onSave?: (project: ProjectWithMembers) => void;
  onCancel?: VoidFunction;
  isOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { trigger: createProject, isMutating } = useCreateProject();

  useEffect(() => {
    if (isOpen) {
      setOpen(isOpen);
    }
  }, [isOpen]);

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
    <Stack gap={2}>
      <ProjectFormAnswers defaultRequired={false} fieldConfig={defaultProjectFieldConfig} isTeamLead />
      <Stack gap={1} flexDirection='row'>
        <Button
          disabledTooltip={!isValid ? 'Please fill out all required fields' : ''}
          disabled={isMutating || !isValid}
          onClick={saveProject}
        >
          Save
        </Button>
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
      </Stack>
    </Stack>
  );
}

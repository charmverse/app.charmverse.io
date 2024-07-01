import { Box, Stack } from '@mui/material';
import { useFormContext } from 'react-hook-form';

import { useCreateProject } from 'charmClient/hooks/projects';
import { Button } from 'components/common/Button';
import type { ProjectWithMembers, ProjectAndMembersPayload } from 'lib/projects/interfaces';

import { ProjectFormAnswers } from './ProjectForm';

export function CreateProjectForm({
  onCancel,
  onSave
}: {
  onSave: (project: ProjectWithMembers) => void;
  onCancel: VoidFunction;
}) {
  const { trigger: createProject, isMutating } = useCreateProject();
  const { formState, getValues, reset } = useFormContext<ProjectAndMembersPayload>();

  const isValid = formState.isValid;

  async function saveProject() {
    const project = getValues();
    const createdProjectWithMembers = await createProject(project);
    onSave(createdProjectWithMembers);
    reset();
  }

  return (
    <>
      <ProjectFormAnswers isTeamLead />
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
              onCancel();
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

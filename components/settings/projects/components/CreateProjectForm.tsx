import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Stack } from '@mui/material';
import { FormProvider, useForm } from 'react-hook-form';

import { useCreateProject } from 'charmClient/hooks/projects';
import { Button } from 'components/common/Button';
import { createDefaultProjectAndMembersPayload } from 'lib/projects/constants';
import { createProjectYupSchema } from 'lib/projects/createProjectYupSchema';
import { createDefaultProjectAndMembersFieldConfig } from 'lib/projects/formField';
import type { ProjectWithMembers } from 'lib/projects/interfaces';

import { ProjectForm } from './ProjectForm';

export function CreateProjectForm({
  onCancel,
  onSave
}: {
  onSave: (project: ProjectWithMembers) => void;
  onCancel: VoidFunction;
}) {
  const schema = createProjectYupSchema({
    fieldConfig: createDefaultProjectAndMembersFieldConfig()
  });
  const form = useForm({
    defaultValues: createDefaultProjectAndMembersPayload(),
    reValidateMode: 'onChange',
    resolver: yupResolver(schema),
    criteriaMode: 'all',
    mode: 'onChange'
  });
  const { trigger: createProject, isMutating } = useCreateProject();

  const isValid = form.formState.isValid;

  async function saveProject() {
    const project = form.getValues();
    const createdProjectWithMembers = await createProject(project);
    onSave(createdProjectWithMembers);
    form.reset();
  }

  return (
    <FormProvider {...form}>
      <ProjectForm isTeamLead />
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
              form.reset();
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
    </FormProvider>
  );
}

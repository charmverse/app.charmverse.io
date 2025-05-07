import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Stack } from '@mui/material';
import { createDefaultProjectAndMembersPayload } from '@packages/lib/projects/constants';
import { createProjectYupSchema } from '@packages/lib/projects/createProjectYupSchema';
import { createDefaultProjectAndMembersFieldConfig } from '@packages/lib/projects/formField';
import type { ProjectWithMembers } from '@packages/lib/projects/interfaces';
import { FormProvider, useForm } from 'react-hook-form';

import { useCreateProject } from 'charmClient/hooks/projects';
import { Button } from 'components/common/Button';

import { ProjectForm } from './ProjectForm';

export function NewProjectForm({
  onCancel,
  onSave
}: {
  onSave: (project: ProjectWithMembers) => void;
  onCancel: VoidFunction;
}) {
  const schema = createProjectYupSchema({
    fieldConfig: createDefaultProjectAndMembersFieldConfig()
  }) as any;
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
    const createdProjectWithMembers = await createProject({
      ...project,
      // handle the MultiTextInput returning [undefined] at first
      websites: project.websites.map((str) => str?.trim()).filter(Boolean),
      projectMembers: project.projectMembers.map((member) => ({
        ...member,
        socialUrls: member.socialUrls.map((str) => str?.trim()).filter(Boolean)
      }))
    });

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

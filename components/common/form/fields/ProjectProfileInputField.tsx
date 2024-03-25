import type { FormField } from '@charmverse/core/prisma-client';
import MuiAddIcon from '@mui/icons-material/Add';
import { Box, Divider, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { FormProvider } from 'react-hook-form';

import { useGetProjects } from 'charmClient/hooks/projects';
import type { ProjectEditorFieldConfig, ProjectWithMembers } from 'components/projects/interfaces';
import { ProjectFormAnswers } from 'components/projects/ProjectForm';
import { CreateProjectForm } from 'components/settings/projects/CreateProjectForm';
import { useProject } from 'components/settings/projects/hooks/useProject';
import { useProjectForm } from 'components/settings/projects/hooks/useProjectForm';

import type { FormFieldValue } from '../interfaces';

function ProjectProfileFormAnswers({
  selectedProject,
  fieldConfig
}: {
  selectedProject: ProjectWithMembers;
  fieldConfig: ProjectEditorFieldConfig;
}) {
  // const { form, isTeamLead } = useProject({ projectId: selectedProject.id, fieldConfig });

  return (
    <Box p={2} mb={1} border={(theme) => `1px solid ${theme.palette.divider}`}>
      <ProjectFormAnswers defaultRequired isTeamLead fieldConfig={fieldConfig} />
    </Box>
  );
}

function CreateProjectFormWithProvider({
  onCancel,
  onSave
}: {
  onSave: (project: ProjectWithMembers) => void;
  onCancel: VoidFunction;
}) {
  const form = useProjectForm();
  return (
    <FormProvider {...form}>
      <CreateProjectForm isOpen onSave={onSave} onCancel={onCancel} />
    </FormProvider>
  );
}

export function ProjectProfileInputField({
  onChange,
  formField
}: {
  formField: Pick<FormField, 'fieldConfig'> & {
    value?: FormFieldValue;
  };
  onChange: (updatedValue: FormFieldValue) => void;
}) {
  const { data } = useGetProjects();
  const [selectedProject, setSelectedProject] = useState<ProjectWithMembers | null>(null);
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);

  useEffect(() => {
    if (formField.value && data) {
      const project = data.find((_project) => _project.id === (formField.value as { projectId: string }).projectId);
      if (project) {
        setSelectedProject(project);
      } else {
        setSelectedProject(null);
      }
    }
  }, [data, formField.value]);

  return (
    <Stack gap={1} width='100%'>
      <Select
        displayEmpty
        value={selectedProject?.id}
        onChange={(e) => {
          const projectId = e.target.value as string;
          if (projectId === 'ADD_PROFILE') {
            onChange({ projectId: '' });
            setShowCreateProjectForm(true);
          } else {
            onChange({ projectId });
            setShowCreateProjectForm(false);
          }
        }}
        renderValue={() => {
          if (!selectedProject) {
            return <Typography>Select a project profile</Typography>;
          }
          return selectedProject.name;
        }}
      >
        {data?.map((project) => (
          <MenuItem value={project.id} key={project.id}>
            <Typography>{project.name}</Typography>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem value='ADD_PROFILE'>
          <Stack flexDirection='row' alignItems='center' gap={0.05}>
            <MuiAddIcon fontSize='small' />
            <Typography>Add a new project profile</Typography>
          </Stack>
        </MenuItem>
      </Select>
      {selectedProject && (
        <ProjectProfileFormAnswers
          key={selectedProject.id}
          selectedProject={selectedProject}
          fieldConfig={formField.fieldConfig as ProjectEditorFieldConfig}
        />
      )}
      {showCreateProjectForm && (
        <CreateProjectFormWithProvider
          onSave={(project) => {
            onChange({ projectId: project.id });
            setShowCreateProjectForm(false);
          }}
          onCancel={() => {
            onChange({ projectId: '' });
            setShowCreateProjectForm(false);
          }}
        />
      )}
    </Stack>
  );
}

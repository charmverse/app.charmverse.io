import MuiAddIcon from '@mui/icons-material/Add';
import { Box, Divider, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { useGetProjects } from 'charmClient/hooks/projects';
import { ProjectFormAnswers } from 'components/settings/projects/ProjectForm';
import type { ProjectWithMembers, ProjectEditorFieldConfig } from 'lib/projects/interfaces';

import type { FormFieldValue } from '../interfaces';

export function ProjectProfileInputField({
  onChange,
  formField
}: {
  formField: {
    value?: FormFieldValue;
    fieldConfig?: ProjectEditorFieldConfig;
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
        renderValue={(value) => {
          if (value === 'ADD_PROFILE') {
            return <Typography>Add a new project profile</Typography>;
          }
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
      {(showCreateProjectForm || selectedProject) && (
        <Box p={2} mb={1} border={(theme) => `1px solid ${theme.palette.divider}`}>
          <ProjectFormAnswers
            defaultRequired
            key={selectedProject?.id ?? 'new-project'}
            fieldConfig={formField.fieldConfig as ProjectEditorFieldConfig}
            isTeamLead
          />
        </Box>
      )}
    </Stack>
  );
}

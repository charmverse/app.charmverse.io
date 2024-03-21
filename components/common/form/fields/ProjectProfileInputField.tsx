import type { FormField } from '@charmverse/core/prisma-client';
import MuiAddIcon from '@mui/icons-material/Add';
import { Divider, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { useGetProjects } from 'charmClient/hooks/projects';
import type { ProjectEditorFieldConfig, ProjectWithMembers } from 'components/projects/interfaces';
import { ProjectFormAnswers } from 'components/projects/ProjectForm';
import { useUser } from 'hooks/useUser';

import type { FormFieldValue } from '../interfaces';

export function ProjectProfileInputField({
  onChange,
  formField
}: {
  formField: Pick<FormField, 'extraFields'> & {
    value?: FormFieldValue;
  };
  onChange: (updatedValue: FormFieldValue) => void;
}) {
  const { user } = useUser();
  const { data } = useGetProjects();
  const [selectedProject, setSelectedProject] = useState<ProjectWithMembers | null>(null);
  const isTeamLead = selectedProject?.projectMembers[0].userId === user?.id;

  useEffect(() => {
    if (formField.value && data) {
      const project = data.find((_project) => _project.id === (formField.value as { projectId: string }).projectId);
      if (project) {
        setSelectedProject(project);
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
          onChange({ projectId });
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
        <ProjectFormAnswers
          onMemberRemove={() => {}}
          onMemberAdd={() => {}}
          onChange={() => {}}
          isTeamLead={isTeamLead}
          fieldConfig={formField.extraFields as ProjectEditorFieldConfig}
          values={selectedProject}
        />
      )}
    </Stack>
  );
}

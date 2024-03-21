import type { FormField } from '@charmverse/core/prisma-client';
import MuiAddIcon from '@mui/icons-material/Add';
import { Divider, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { useGetProjects } from 'charmClient/hooks/projects';
import type { ProjectEditorFieldConfig, ProjectWithMembers } from 'components/projects/interfaces';
import { projectDefaultValues } from 'components/projects/ProjectFields';
import { ProjectFormAnswers } from 'components/projects/ProjectForm';
import { projectMemberDefaultValues } from 'components/projects/ProjectMemberFields';
import { CreateProjectForm } from 'components/settings/projects/CreateProjectForm';
import { useProject } from 'components/settings/projects/hooks/useProjects';

import type { FormFieldValue } from '../interfaces';

function ProjectProfileFormAnswers({
  selectedProject,
  fieldConfig
}: {
  selectedProject: ProjectWithMembers;
  fieldConfig: ProjectEditorFieldConfig;
}) {
  const { isAddingMember, isTeamLead, onProjectMemberAdd, onProjectMemberRemove, onProjectUpdate } = useProject({
    projectId: selectedProject.id
  });

  return (
    <ProjectFormAnswers
      defaultRequired
      onMemberRemove={onProjectMemberRemove}
      onMemberAdd={onProjectMemberAdd}
      onChange={onProjectUpdate}
      isTeamLead={isTeamLead}
      fieldConfig={fieldConfig}
      values={selectedProject}
      disableAddMemberButton={isAddingMember}
    />
  );
}

export function ProjectProfileInputField({
  onChange,
  formField
}: {
  formField: Pick<FormField, 'extraFields'> & {
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
          selectedProject={selectedProject}
          fieldConfig={formField.extraFields as ProjectEditorFieldConfig}
        />
      )}
      {showCreateProjectForm && (
        <CreateProjectForm
          project={{
            ...projectDefaultValues,
            projectMembers: [projectMemberDefaultValues]
          }}
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

import MuiAddIcon from '@mui/icons-material/Add';
import { Box, Divider, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useGetProjects } from 'charmClient/hooks/projects';
import { convertToProjectValues } from 'components/settings/projects/hooks/useProjectForm';
import { ProjectFormAnswers } from 'components/settings/projects/ProjectForm';
import { useUser } from 'hooks/useUser';
import { defaultProjectValues } from 'lib/projects/constants';
import type {
  ProjectAndMembersFieldConfig,
  ProjectAndMembersPayload,
  ProjectWithMembers
} from 'lib/projects/interfaces';

import type { FormFieldValue } from '../interfaces';

export function ProjectProfileInputField({
  onChange,
  formField,
  disabled,
  project,
  isDraft,
  inputEndAdornment,
  onProjectUpdate
}: {
  onProjectUpdate?: (projectAndMembersPayload: ProjectAndMembersPayload) => Promise<void>;
  inputEndAdornment?: React.ReactNode;
  isDraft?: boolean;
  disabled?: boolean;
  formField: {
    value?: FormFieldValue;
    fieldConfig?: ProjectAndMembersFieldConfig;
  };
  project?: ProjectWithMembers | null;
  onChange: (updatedValue: FormFieldValue) => void;
}) {
  const { user } = useUser();
  const [selectedProject, setSelectedProject] = useState<ProjectWithMembers | null>(project ?? null);
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);
  const { data: projectsWithMembers } = useGetProjects();
  const projectId = (formField.value as { projectId: string })?.projectId;
  const { reset } = useFormContext();

  useEffect(() => {
    if (project) {
      reset(convertToProjectValues(project));
    }
  }, [!!project]);

  const isTeamLead = selectedProject?.projectMembers[0].userId === user?.id;

  function onOptionClick(projectIdOrAddProject: string | 'ADD_PROJECT') {
    if (projectIdOrAddProject === 'ADD_PROJECT') {
      onChange({ projectId: '' });
      setShowCreateProjectForm(true);
      setSelectedProject(null);
      reset(defaultProjectValues);
    } else {
      onChange({ projectId: projectIdOrAddProject });
      setShowCreateProjectForm(false);
      const _selectedProject = projectsWithMembers?.find((_project) => _project.id === projectIdOrAddProject) ?? null;
      setSelectedProject(_selectedProject);
      reset(_selectedProject ? convertToProjectValues(_selectedProject) : defaultProjectValues);
    }
  }

  return (
    <Stack gap={1} width='100%' mb={1}>
      <Stack flexDirection='row' gap={1} alignItems='center'>
        <Select
          sx={{
            width: '100%'
          }}
          key={projectId}
          // only proposal author is able to change the project profile, not even team lead can change it
          disabled={disabled}
          displayEmpty
          value={showCreateProjectForm ? 'ADD_PROJECT' : projectId ?? ''}
          data-test='project-profile-select'
          renderValue={() => {
            if (showCreateProjectForm) {
              return <Typography>Create a new project profile</Typography>;
            } else if (!selectedProject) {
              return <Typography>Select a project profile</Typography>;
            }
            // Selected project might have stale name if it was changed, so find the correct project from the list
            const selectedProjectName =
              projectsWithMembers?.find((_project) => _project.id === selectedProject?.id)?.name ??
              selectedProject?.name;
            return selectedProjectName;
          }}
        >
          {projectsWithMembers?.map((_project) => {
            return (
              <MenuItem
                key={_project.id}
                data-test={`project-option-${_project.id}`}
                value={_project.id}
                onClick={() => {
                  onOptionClick(_project.id);
                }}
              >
                <Typography>{_project.name}</Typography>
              </MenuItem>
            );
          })}
          {/** Disable adding new project if proposal has been published */}
          {isDraft !== false && (
            <>
              <Divider />
              <MenuItem
                value='ADD_PROJECT'
                data-test='project-option-new'
                onClick={() => {
                  // on change handler for select doesn't pick up 'ADD_PROJECT' value
                  onOptionClick('ADD_PROJECT');
                }}
              >
                <Stack flexDirection='row' alignItems='center' gap={0.05}>
                  <MuiAddIcon fontSize='small' />
                  <Typography>Add a new project profile</Typography>
                </Stack>
              </MenuItem>
            </>
          )}
        </Select>
        {/** Required for support form field comments */}
        {inputEndAdornment}
      </Stack>
      {selectedProject && (
        <Box p={2} mb={1} border={(theme) => `1px solid ${theme.palette.divider}`}>
          <ProjectFormAnswers
            defaultRequired
            key={selectedProject.id}
            fieldConfig={formField.fieldConfig}
            isTeamLead={isTeamLead}
            disabled={disabled}
            hideAddTeamMemberButton
            onProjectUpdate={onProjectUpdate}
          />
        </Box>
      )}
      {showCreateProjectForm && (
        <Box p={2} mb={1} border={(theme) => `1px solid ${theme.palette.divider}`}>
          <ProjectFormAnswers defaultRequired fieldConfig={formField.fieldConfig} isTeamLead disabled={disabled} />
        </Box>
      )}
    </Stack>
  );
}

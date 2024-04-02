import MuiAddIcon from '@mui/icons-material/Add';
import { Box, Divider, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useGetProjects } from 'charmClient/hooks/projects';
import { useUpdateProposal } from 'charmClient/hooks/proposals';
import { convertToProjectValues } from 'components/settings/projects/hooks/useProjectForm';
import { ProjectFormAnswers } from 'components/settings/projects/ProjectForm';
import { useUser } from 'hooks/useUser';
import { defaultProjectAndMembersPayload } from 'lib/projects/constants';
import type {
  ProjectAndMembersFieldConfig,
  ProjectAndMembersPayload,
  ProjectWithMembers
} from 'lib/projects/interfaces';

import type { FormFieldValue } from '../interfaces';

export function ProjectProfileInputField({
  onChange,
  fieldConfig,
  disabled,
  project,
  inputEndAdornment,
  onProjectUpdate,
  isDraft,
  proposalId
}: {
  proposalId?: string;
  onProjectUpdate?: (projectAndMembersPayload: ProjectAndMembersPayload) => Promise<void>;
  inputEndAdornment?: React.ReactNode;
  disabled?: boolean;
  fieldConfig?: ProjectAndMembersFieldConfig;
  project?: ProjectWithMembers | null;
  onChange: (updatedValue: FormFieldValue) => void;
  isDraft?: boolean;
}) {
  const { trigger } = useUpdateProposal({
    proposalId
  });
  const { user } = useUser();
  const [selectedProject, setSelectedProject] = useState<ProjectWithMembers | null>(project ?? null);
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);
  const { data: projectsWithMembers } = useGetProjects();
  const projectId = project?.id;
  const { reset } = useFormContext();
  const [menuOpen, setMenuOpen] = useState(false);
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
      reset(defaultProjectAndMembersPayload);
    } else {
      // If proposal exist update the projectId field of the proposal
      if (proposalId) {
        trigger({
          projectId: projectIdOrAddProject
        });
      }
      // else update the projectId field of the form, it might be for a new structured proposal form
      else {
        onChange({ projectId: projectIdOrAddProject });
      }
      setShowCreateProjectForm(false);
      const _selectedProject = projectsWithMembers?.find((_project) => _project.id === projectIdOrAddProject) ?? null;
      setSelectedProject(_selectedProject);
      reset(_selectedProject ? convertToProjectValues(_selectedProject) : defaultProjectAndMembersPayload);
    }
  }

  return (
    <Stack gap={1} width='100%' mb={1}>
      <Stack flexDirection='row' gap={1} alignItems='center'>
        <Select
          open={menuOpen}
          onOpen={() => setMenuOpen(true)}
          onClose={() => setMenuOpen(false)}
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
              selectedProject?.name ??
              'Untitled';
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
                  setMenuOpen(false);
                }}
              >
                <Typography>{_project.name}</Typography>
              </MenuItem>
            );
          })}
          {/** Only when draft is false don't show option to create a new project */}
          {isDraft !== false && (
            <>
              <Divider />
              <MenuItem
                value='ADD_PROJECT'
                data-test='project-option-new'
                onClick={() => {
                  // on change handler for select doesn't pick up 'ADD_PROJECT' value
                  onOptionClick('ADD_PROJECT');
                  setMenuOpen(false);
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
            fieldConfig={fieldConfig}
            isTeamLead={isTeamLead}
            disabled={disabled}
            onProjectUpdate={onProjectUpdate}
          />
        </Box>
      )}
      {showCreateProjectForm && (
        <Box p={2} mb={1} border={(theme) => `1px solid ${theme.palette.divider}`}>
          <ProjectFormAnswers defaultRequired fieldConfig={fieldConfig} isTeamLead disabled={disabled} />
        </Box>
      )}
    </Stack>
  );
}

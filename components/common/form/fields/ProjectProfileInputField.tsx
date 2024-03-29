import MuiAddIcon from '@mui/icons-material/Add';
import { Box, Chip, Divider, MenuItem, Select, Stack, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { ValidationError } from 'yup';

import charmClient from 'charmClient';
import { useGetProjects } from 'charmClient/hooks/projects';
import { convertToProjectValues, createProjectYupSchema } from 'components/settings/projects/hooks/useProjectForm';
import { ProjectFormAnswers } from 'components/settings/projects/ProjectForm';
import { useUser } from 'hooks/useUser';
import { defaultProjectValues } from 'lib/projects/constants';
import type { ProjectFieldConfig, ProjectWithMembers } from 'lib/projects/interfaces';

import type { FormFieldValue } from '../interfaces';

export function ProjectProfileInputField({
  onChange,
  formField,
  disabled,
  proposalId,
  isDraft,
  inputEndAdornment
}: {
  inputEndAdornment?: React.ReactNode;
  isDraft?: boolean;
  disabled?: boolean;
  formField: {
    value?: FormFieldValue;
    fieldConfig?: ProjectFieldConfig;
  };
  proposalId?: string;
  onChange: (updatedValue: FormFieldValue) => void;
}) {
  const { user } = useUser();
  const [selectedProject, setSelectedProject] = useState<ProjectWithMembers | null>(null);
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);
  const { data: projectsWithMembers } = useGetProjects();
  const projectId = (formField.value as { projectId: string })?.projectId;
  const { reset } = useFormContext();

  useEffect(() => {
    if (proposalId) {
      // This is necessary to show the correct project values for a public proposal
      charmClient.projects.getProposalProject(proposalId).then((projectWithMembers) => {
        if (projectWithMembers) {
          setSelectedProject(projectWithMembers);
        }
      });
    }
  }, [proposalId]);

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
      const _selectedProject = projectsWithMembers?.find((project) => project.id === projectIdOrAddProject) ?? null;
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
          key={`${proposalId}.${projectId}`}
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
              projectsWithMembers?.find((project) => project.id === selectedProject?.id)?.name ?? selectedProject?.name;
            return selectedProjectName;
          }}
        >
          {projectsWithMembers?.map((project) => {
            const yupSchema = createProjectYupSchema({
              fieldConfig: formField.fieldConfig as ProjectFieldConfig,
              defaultRequired: true
            });
            let errors: string[] = [];
            try {
              yupSchema.validateSync(convertToProjectValues(project), {
                abortEarly: false
              });
            } catch (e) {
              if (e instanceof ValidationError) {
                errors = e.errors;
              }
            }
            return (
              <Tooltip title={errors.join(', ')} placement='right' key={project.id}>
                <div>
                  <MenuItem
                    data-test={`project-option-${project.id}`}
                    value={project.id}
                    disabled={errors.length !== 0}
                    onClick={() => {
                      onOptionClick(project.id);
                    }}
                  >
                    <Typography>{project.name}</Typography>
                  </MenuItem>
                </div>
              </Tooltip>
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
      {(showCreateProjectForm || selectedProject) && (
        <Box p={2} mb={1} border={(theme) => `1px solid ${theme.palette.divider}`}>
          <ProjectFormAnswers
            defaultRequired
            key={selectedProject?.id ?? 'new-project'}
            fieldConfig={formField.fieldConfig as ProjectFieldConfig}
            // only team lead is able to change the project profile if they have edit access to the proposal
            isTeamLead={isTeamLead || showCreateProjectForm}
            disabled={disabled}
            // Hide team member if a project is selected, otherwise show them if the user is creating a new project
            hideAddTeamMemberButton={showCreateProjectForm === false && !!selectedProject}
          />
        </Box>
      )}
    </Stack>
  );
}

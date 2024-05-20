import MuiAddIcon from '@mui/icons-material/Add';
import { Box, Divider, MenuItem, Select, Stack, Typography } from '@mui/material';
import { debounce } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { UseFormGetFieldState } from 'react-hook-form';

import { useCreateProject, useGetProjects } from 'charmClient/hooks/projects';
import { useUpdateProposal } from 'charmClient/hooks/proposals';
import { ProposalProjectFormAnswers } from 'components/settings/projects/components/ProjectForm';
import { useUser } from 'hooks/useUser';
import type { FormFieldValue } from 'lib/forms/interfaces';
import { createDefaultProjectAndMembersPayload } from 'lib/projects/constants';
import { convertToProjectValues } from 'lib/projects/convertToProjectValues';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/formField';
import type { ProjectAndMembersPayload, ProjectWithMembers } from 'lib/projects/interfaces';

export function ProjectProfileInputField({
  onChange: _onChange,
  onChangeDebounced: _onChangeDebounced,
  fieldConfig,
  disabled,
  project,
  inputEndAdornment,
  proposalId,
  formFieldId,
  formFieldValue,
  getFieldState
}: {
  formFieldId: string;
  formFieldValue?: { selectedMemberIds: string[] } | null;
  proposalId?: string;
  inputEndAdornment?: React.ReactNode;
  disabled?: boolean;
  fieldConfig?: ProjectAndMembersFieldConfig;
  project?: ProjectWithMembers | null;
  onChange: (updatedValue: FormFieldValue) => void;
  getFieldState: UseFormGetFieldState<Record<string, FormFieldValue>>;
  onChangeDebounced: (updatedValue: { id: string; value: FormFieldValue }) => void;
}) {
  const selectedMemberIds = formFieldValue?.selectedMemberIds ?? [];
  const { trigger: updateProposal } = useUpdateProposal({
    proposalId
  });
  const { user } = useUser();
  const [selectedProject, setSelectedProject] = useState<ProjectWithMembers | null>(project ?? null);
  const { data: projectsWithMembers, mutate } = useGetProjects();
  const projectId = project?.id;
  const { reset } = useFormContext<ProjectAndMembersPayload>();
  const { trigger: createProject } = useCreateProject();

  const isTeamLead = !!selectedProject?.projectMembers.find((pm) => pm.teamLead && pm.userId === user?.id);

  const onChangeDebounced = useMemo(() => debounce(_onChangeDebounced, 300), [_onChangeDebounced]);
  const onChange = async (updatedValue: FormFieldValue) => {
    // make sure to await so that validation has a chance to run
    await _onChange(updatedValue);
    // do not save updates if field is invalid. we call getFieldState instead of the error passed in from props because it is not updated yet
    const fieldError = getFieldState(formFieldId).error;
    if (!fieldError) {
      onChangeDebounced({
        id: formFieldId,
        value: updatedValue
      });
    }
  };

  function onOptionClick(_selectedProject: ProjectWithMembers) {
    if (proposalId) {
      updateProposal({
        projectId: _selectedProject.id
      });
    }
    // update the projectId field of the form, it might be for a new structured proposal form
    onChange({ projectId: _selectedProject.id, selectedMemberIds: [] });
    setSelectedProject(_selectedProject);
    reset(
      convertToProjectValues({
        ..._selectedProject,
        // Just add the team lead to the project members since selectedMemberIds is empty
        projectMembers: [_selectedProject.projectMembers[0]]
      })
    );
  }

  const onFormFieldChange = useCallback(
    (newProjectMemberIds: string[]) => {
      if (selectedProject) {
        onChange({
          projectId: selectedProject.id,
          selectedMemberIds: newProjectMemberIds
        });
      }
    },
    [selectedProject?.id]
  );

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
          value={projectId ?? ''}
          data-test='project-profile-select'
          renderValue={() => {
            if (!selectedProject) {
              return <Typography color='secondary'>Select a project profile</Typography>;
            }
            // Selected project might have stale name if it was changed, so find the correct project from the list
            const selectedProjectName =
              projectsWithMembers?.find((_project) => _project.id === selectedProject?.id)?.name ||
              selectedProject?.name ||
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
                  onOptionClick(_project);
                }}
              >
                <Typography color={_project.name ? '' : 'secondary'}>{_project.name || 'Untitled Project'}</Typography>
              </MenuItem>
            );
          })}
          <Divider />
          <MenuItem
            data-test='project-option-new'
            onClick={() => {
              createProject(createDefaultProjectAndMembersPayload(), {
                onSuccess: async (createdProject) => {
                  mutate(
                    (_projects) => {
                      return [...(_projects ?? []), createdProject];
                    },
                    {
                      revalidate: false
                    }
                  );
                  onOptionClick(createdProject);
                }
              });
            }}
          >
            <Stack flexDirection='row' alignItems='center' gap={0.05}>
              <MuiAddIcon fontSize='small' />
              <Typography>Add a new project profile</Typography>
            </Stack>
          </MenuItem>
        </Select>
        {/** Required for support form field comments */}
        {inputEndAdornment}
      </Stack>
      {selectedProject && (
        <Box p={2} mb={1} border={(theme) => `1px solid ${theme.palette.divider}`}>
          <ProposalProjectFormAnswers
            fieldConfig={fieldConfig}
            isTeamLead={isTeamLead}
            disabled={disabled}
            projectId={selectedProject.id}
            selectedProjectMemberIds={selectedMemberIds}
            onFormFieldChange={onFormFieldChange}
          />
        </Box>
      )}
    </Stack>
  );
}

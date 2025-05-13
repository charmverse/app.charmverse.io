import MuiAddIcon from '@mui/icons-material/Add';
import { Box, Divider, MenuItem, Select, Stack, Typography } from '@mui/material';
import type { ProjectFieldValue, FormFieldValue } from '@packages/lib/proposals/forms/interfaces';
import { debounce } from 'lodash';
import { useMemo } from 'react';
import type { UseFormGetFieldState } from 'react-hook-form';

import { useCreateProject, useGetProjects } from 'charmClient/hooks/projects';
import { useUpdateProposal } from 'charmClient/hooks/proposals';
import { useUser } from 'hooks/useUser';
import type { ProjectAndMembersFieldConfig } from '@packages/lib/projects/formField';
import { getDefaultProjectValues } from '@packages/lib/projects/getDefaultProjectValues';
import type { ProjectWithMembers } from '@packages/lib/projects/interfaces';

import { ProjectForm } from './ProjectForm';

export function ProjectFieldAnswer({
  onChange: _onChange,
  onChangeDebounced: _onChangeDebounced,
  fieldConfig,
  disabled,
  projectId,
  inputEndAdornment,
  proposalId,
  formFieldId,
  formFieldValue,
  getFieldState,
  applyProject,
  applyProjectMembers
}: {
  formFieldId: string;
  formFieldValue?: ProjectFieldValue | null;
  proposalId: string;
  inputEndAdornment?: React.ReactNode;
  disabled?: boolean;
  fieldConfig: ProjectAndMembersFieldConfig;
  projectId?: string | null;
  onChange: (updatedValue: FormFieldValue) => void;
  applyProject: (project: ProjectWithMembers, selectedMemberIds: string[]) => void;
  applyProjectMembers: (projectMembers: ProjectWithMembers['projectMembers']) => void;
  getFieldState: UseFormGetFieldState<Record<string, FormFieldValue>>;
  onChangeDebounced: (updatedValue: { id: string; value: FormFieldValue }) => void;
}) {
  const selectedMemberIds = formFieldValue?.selectedMemberIds ?? [];
  const { trigger: updateProposal } = useUpdateProposal({
    proposalId
  });
  const { user } = useUser();
  const { data: projectsWithMembers, mutate: refreshProjects } = useGetProjects();
  const { trigger: createProject } = useCreateProject();

  const selectedProject = projectsWithMembers?.find((_project) => _project.id === projectId);
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

  function onSelectProject(_selectedProject: ProjectWithMembers) {
    // update the proposal with the new project id
    updateProposal({
      projectId: _selectedProject.id
    });
    // update the projectId field of the form
    onChange({ projectId: _selectedProject.id, selectedMemberIds: [] });
    applyProject(_selectedProject, []);
    // reset(
    //   convertToProjectValues({
    //     ...selectedProject,
    //     // Just add the team lead to the project members since selectedMemberIds is empty
    //     projectMembers: [_selectedProject.projectMembers[0]]
    //   })
    // );
  }

  async function addNewProject() {
    const defaultProjectValues = getDefaultProjectValues({ user });
    const createdProject = await createProject(defaultProjectValues);
    // update the dropdown list of projects
    await refreshProjects(
      (_projects) => {
        return [...(_projects ?? []), createdProject];
      },
      {
        revalidate: false
      }
    );
    onSelectProject(createdProject);
  }

  return (
    <Stack gap={1} width='100%' mb={1}>
      {!disabled && (
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
              return selectedProject.name;
            }}
          >
            {projectsWithMembers?.map((_project) => {
              return (
                <MenuItem
                  key={_project.id}
                  data-test={`project-option-${_project.id}`}
                  value={_project.id}
                  onClick={async () => {
                    // retrieve the latest project data
                    const updatedList = await refreshProjects();
                    const _selectedProject = updatedList?.find((p) => p.id === _project.id);
                    if (_selectedProject) {
                      onSelectProject(_selectedProject);
                    }
                  }}
                >
                  <Typography color={_project.name ? '' : 'secondary'}>
                    {_project.name || 'Untitled Project'}
                  </Typography>
                </MenuItem>
              );
            })}
            <Divider />
            <MenuItem data-test='project-option-new' onClick={addNewProject}>
              <Stack flexDirection='row' alignItems='center' gap={0.05}>
                <MuiAddIcon fontSize='small' />
                <Typography>Add a new project profile</Typography>
              </Stack>
            </MenuItem>
          </Select>
          {/** Required for support form field comments */}
          {inputEndAdornment}
        </Stack>
      )}
      {formFieldValue?.projectId && (
        <Box p={2} mb={1} border={(theme) => `1px solid ${theme.palette.divider}`}>
          <ProjectForm
            fieldConfig={fieldConfig}
            isTeamLead={isTeamLead}
            disabled={disabled}
            selectedMemberIds={selectedMemberIds}
            onFormFieldChange={onChange}
            project={selectedProject}
            refreshProjects={refreshProjects}
            applyProjectMembers={applyProjectMembers}
          />
        </Box>
      )}
    </Stack>
  );
}

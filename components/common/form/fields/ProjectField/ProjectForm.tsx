import { log } from '@charmverse/core/log';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Divider, IconButton, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useCallback } from 'react';

import FieldLabel from 'components/common/form/FieldLabel';
import { FieldAnswers } from 'components/settings/projects/components/FieldAnswers';
import { ProjectMemberFieldAnswers } from 'components/settings/projects/components/ProjectMemberFields';
import { useUser } from 'hooks/useUser';
import type { ProjectFieldValue } from 'lib/forms/interfaces';
import { defaultProjectMember } from 'lib/projects/constants';
import { projectFieldProperties } from 'lib/projects/formField';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/formField';
import type { ProjectWithMembers } from 'lib/projects/interfaces';

import { useProjectUpdates } from './useProjectUpdates';

const newTeamMember = 'ADD_TEAM_MEMBER';

export function ProjectForm({
  fieldConfig,
  isTeamLead,
  disabled,
  project,
  refreshProject,
  selectedMemberIds,
  onFormFieldChange,
  applyProjectMembers
}: {
  project: ProjectWithMembers;
  refreshProject: () => Promise<ProjectWithMembers | undefined>;
  disabled?: boolean;
  fieldConfig?: ProjectAndMembersFieldConfig;
  isTeamLead: boolean;
  selectedMemberIds: string[];
  onFormFieldChange: (field: ProjectFieldValue) => void;
  applyProjectMembers: (projectMembers: ProjectWithMembers['projectMembers']) => void;
}) {
  const { user } = useUser();

  const { id: projectId, projectMembers } = project;
  const extraProjectMembers = projectMembers.slice(1) ?? [];
  const selectedProjectMembers = extraProjectMembers.filter(
    (projectMember) => projectMember.id && selectedMemberIds.includes(projectMember.id)
  );
  const nonSelectedProjectMembers = extraProjectMembers.filter(
    (projectMember) => projectMember.id && !selectedMemberIds.includes(projectMember.id)
  );
  const { onProjectUpdate, onProjectMemberUpdate, onProjectMemberAdd } = useProjectUpdates({
    projectId: project.id,
    isTeamLead
  });

  async function onChangeTeamMembers(selectedMemberValue: string) {
    // get updated project members in case they were updated in the form but not refreshed yet
    const updatedProject = await refreshProject();
    if (!updatedProject) {
      return;
    }
    console.log('members', updatedProject.projectMembers);
    const _selectedMemberIds = [...selectedMemberIds];
    const _projectMembers = updatedProject.projectMembers.filter(({ id }) => selectedMemberIds.includes(id));
    if (selectedMemberValue !== newTeamMember) {
      _selectedMemberIds.push(selectedMemberValue);
      const projectMember = updatedProject.projectMembers.find(({ id }) => id === selectedMemberValue);
      if (projectMember) {
        _projectMembers.push(projectMember);
      } else {
        log.error('Project member not found', { selectedMemberValue });
      }
    } else {
      const newProjectMember = await onProjectMemberAdd(defaultProjectMember());
      if (newProjectMember) {
        _selectedMemberIds.push(newProjectMember.id);
        _projectMembers.push(newProjectMember);
      }
    }
    // update proposal answers form
    onFormFieldChange({ projectId, selectedMemberIds: _selectedMemberIds });
    // update project form
    console.log('new members', _projectMembers);
    applyProjectMembers(_projectMembers);
  }

  const onProjectUpdateMemo = useCallback(
    (updatedProjectValues: Record<string, any>) => {
      onProjectUpdate({
        ...updatedProjectValues,
        id: projectId
      });
    },
    [onProjectUpdate, projectId]
  );

  const teamLeadMemberId = projectMembers[0]?.id;
  const onTeamLeadUpdate = useCallback(
    (updatedProjectMember: Record<string, any>) => {
      if (teamLeadMemberId) {
        onProjectMemberUpdate({
          ...updatedProjectMember,
          id: teamLeadMemberId
        });
      }
    },
    [onProjectMemberUpdate, teamLeadMemberId]
  );

  return (
    <Stack gap={2} width='100%'>
      <Typography variant='h6'>Project Info</Typography>
      <FieldAnswers
        defaultRequired
        disabled={!isTeamLead || disabled}
        fieldConfig={fieldConfig}
        onChange={onProjectUpdateMemo}
        properties={projectFieldProperties}
      />
      <Typography variant='h6' mt={2}>
        Team Info
      </Typography>
      <FieldLabel>Team Lead</FieldLabel>
      <ProjectMemberFieldAnswers
        projectMemberIndex={0}
        disabled={!isTeamLead || disabled}
        defaultRequired
        fieldConfig={fieldConfig?.projectMember}
        onChange={onTeamLeadUpdate}
      />
      <Divider
        sx={{
          my: 1
        }}
      />
      {selectedProjectMembers.map((projectMember, index) => (
        <Stack key={`project-member-${index.toString()}`}>
          <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>Team member</Typography>
            <IconButton
              data-test='remove-project-member-button'
              disabled={disabled}
              onClick={() => {
                const _selectedMemberIds = selectedMemberIds.filter((id) => id !== projectMember.id);
                onFormFieldChange({ projectId, selectedMemberIds: _selectedMemberIds });
              }}
            >
              <DeleteOutlineOutlinedIcon fontSize='small' color={disabled ? 'disabled' : 'error'} />
            </IconButton>
          </Stack>
          <ProjectMemberFieldAnswers
            onChange={(updatedProjectMember) => {
              onProjectMemberUpdate({
                ...updatedProjectMember,
                id: projectMember.id!
              });
            }}
            projectMemberIndex={index + 1}
            disabled={!(isTeamLead || projectMember.userId === user?.id) || disabled}
            defaultRequired
            fieldConfig={fieldConfig?.projectMember}
          />
        </Stack>
      ))}
      <FieldLabel>Team Members</FieldLabel>
      <Select
        displayEmpty
        data-test='project-team-members-select'
        disabled={disabled}
        value=''
        onChange={(event) => {
          onChangeTeamMembers(event.target.value as string);
        }}
        renderValue={() => {
          return 'Select a team member';
        }}
      >
        {nonSelectedProjectMembers.map((projectMember) => (
          <MenuItem
            key={`project-member-${projectMember.id}`}
            value={projectMember.id}
            data-test='project-member-option'
          >
            <Typography color={projectMember.name ? '' : 'secondary'}>
              {projectMember.name || 'Untitled Project Member'}
            </Typography>
          </MenuItem>
        ))}
        {nonSelectedProjectMembers.length && <Divider />}
        <MenuItem data-test='project-member-option' value={newTeamMember} disabled={!isTeamLead || disabled}>
          <Stack flexDirection='row' alignItems='center' gap={0.05}>
            <AddIcon fontSize='small' />
            <Typography>Add a new project member</Typography>
          </Stack>
        </MenuItem>
      </Select>
    </Stack>
  );
}

import { log } from '@charmverse/core/log';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Divider, IconButton, MenuItem, Select, Stack, Tooltip, Typography } from '@mui/material';
import { isTruthy } from '@packages/utils/types';
import type { ProjectFieldValue } from '@root/lib/proposals/forms/interfaces';
import type { KeyedMutator } from 'swr';

import FieldLabel from 'components/common/form/FieldLabel';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { defaultProjectMember } from 'lib/projects/constants';
import { projectMemberFieldProperties, projectFieldProperties } from 'lib/projects/formField';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/formField';
import type { ProjectWithMembers } from 'lib/projects/interfaces';

import { FieldAnswers } from '../FieldAnswers';

import { useProjectUpdates } from './useProjectUpdates';

const newTeamMember = 'ADD_TEAM_MEMBER';

export function ProjectForm({
  fieldConfig,
  isTeamLead,
  disabled,
  project,
  refreshProjects,
  selectedMemberIds,
  onFormFieldChange,
  applyProjectMembers
}: {
  project?: ProjectWithMembers; // only provided if you belong to the project
  refreshProjects: KeyedMutator<ProjectWithMembers[]>;
  disabled?: boolean;
  fieldConfig: ProjectAndMembersFieldConfig;
  isTeamLead: boolean;
  selectedMemberIds: string[];
  onFormFieldChange: (field: ProjectFieldValue) => void;
  applyProjectMembers: (projectMembers: ProjectWithMembers['projectMembers']) => void;
}) {
  const { user } = useUser();

  const { showError } = useSnackbar();

  const projectId = project?.id;
  const projectMembers = project?.projectMembers || [];

  // Note: selectedMemberIds never includes team lead
  const selectedProjectMembers = selectedMemberIds.map((memberId) => {
    const member = projectMembers.find((m) => m.id === memberId);
    return {
      id: memberId,
      userId: member?.userId
    };
  });
  const nonSelectedProjectMembers = projectMembers.filter(
    (projectMember) => !projectMember.teamLead && !selectedMemberIds.includes(projectMember.id)
  );
  const { onProjectUpdate, onProjectMemberUpdate, onProjectMemberAdd } = useProjectUpdates({
    projectId,
    isTeamLead,
    refreshProjects
  });

  async function addTeamMember(selectedMemberId: string) {
    if (!projectId) {
      // project doesnt belong to user
      return;
    }
    const newMemberIds = [...selectedMemberIds];
    const newProjectMembers = selectedMemberIds
      .map((memberId) => project.projectMembers.find((member) => member.id === memberId))
      .filter(isTruthy);
    // always include team lead
    const teamLead = project.projectMembers.find((member) => member.teamLead)!;
    newProjectMembers.unshift(teamLead);
    if (selectedMemberId !== newTeamMember) {
      newMemberIds.push(selectedMemberId);
      const projectMember = project.projectMembers.find(({ id }) => id === selectedMemberId);
      if (projectMember) {
        newProjectMembers.push(projectMember);
      } else {
        log.error('Project member not found', { selectedMemberId });
      }
    } else {
      try {
        const newProjectMember = await onProjectMemberAdd(defaultProjectMember());
        if (newProjectMember) {
          newMemberIds.push(newProjectMember.id);
          newProjectMembers.push(newProjectMember);
        }
      } catch (error) {
        log.warn('Failed to add project member', { error });
        showError('Failed to add project member');
        return;
      }
    }
    // update proposal answers form
    onFormFieldChange({ projectId, selectedMemberIds: newMemberIds });
    // update project form
    applyProjectMembers(newProjectMembers);
  }

  function removeTeamMember(memberId: string) {
    if (!projectId) {
      // project doesnt belong to user
      return;
    }
    const newMemberIds = selectedMemberIds.filter((id) => id !== memberId);
    const newProjectMembers = projectMembers.filter(({ id }) => newMemberIds.includes(id));
    // always include team lead
    const teamLead = projectMembers.find((member) => member.teamLead)!;
    newProjectMembers.unshift(teamLead);
    // update proposal answers form
    onFormFieldChange({ projectId, selectedMemberIds: newMemberIds });
    // update project form
    applyProjectMembers(newProjectMembers);
  }

  const teamLeadMemberId = projectMembers[0]?.id;

  // for non-authors, hide the team members section if it is empty
  const showTeamMemberSection = !disabled || selectedProjectMembers.length > 0;
  return (
    <Stack gap={2} width='100%'>
      <Typography variant='h6'>Project Info</Typography>
      <FieldAnswers
        disabled={!isTeamLead || disabled}
        fieldConfig={fieldConfig}
        onChange={onProjectUpdate}
        properties={projectFieldProperties}
      />
      <Typography variant='h6' mt={2}>
        Team Info
      </Typography>
      <FieldLabel>Team Lead</FieldLabel>
      <FieldAnswers
        disabled={disabled}
        namePrefix='projectMembers[0]'
        fieldConfig={fieldConfig.projectMember}
        properties={projectMemberFieldProperties}
        onChange={(updates) => onProjectMemberUpdate(teamLeadMemberId, updates)}
      />
      {showTeamMemberSection && (
        <>
          <Divider sx={{ my: 1 }} />
          {selectedProjectMembers.map((projectMember, index) => (
            <>
              <Stack key={`project-member-${projectMember.id}`}>
                <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
                  <FieldLabel>Team member</FieldLabel>
                  {!disabled && (
                    <Tooltip title='Remove team member'>
                      <IconButton
                        data-test='remove-project-member-button'
                        disabled={disabled}
                        onClick={() => removeTeamMember(projectMember.id)}
                      >
                        <DeleteOutlineOutlinedIcon fontSize='small' color='secondary' />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
                <FieldAnswers
                  disabled={!(isTeamLead || projectMember.userId === user?.id) || disabled}
                  namePrefix={`projectMembers[${index + 1}]`}
                  fieldConfig={fieldConfig.projectMember}
                  properties={projectMemberFieldProperties}
                  onChange={(updates) => {
                    onProjectMemberUpdate(projectMember.id, updates);
                  }}
                />
              </Stack>
              <Divider sx={{ my: 1 }} />
            </>
          ))}
          {!disabled && (
            <Select
              displayEmpty
              data-test='project-team-members-select'
              disabled={disabled}
              value=''
              onChange={(event) => {
                addTeamMember(event.target.value as string);
              }}
              renderValue={() => {
                return 'Add a team member';
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
          )}
        </>
      )}
    </Stack>
  );
}

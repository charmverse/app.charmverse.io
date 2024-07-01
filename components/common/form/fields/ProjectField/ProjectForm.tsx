import { log } from '@charmverse/core/log';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Divider, IconButton, MenuItem, Select, Stack, Typography } from '@mui/material';
import type { KeyedMutator } from 'swr';

import FieldLabel from 'components/common/form/FieldLabel';
import { FieldAnswers } from 'components/settings/projects/components/FieldAnswers';
import { ProjectMemberFieldAnswers } from 'components/settings/projects/components/ProjectMemberFields';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { ProjectFieldValue } from 'lib/forms/interfaces';
import { defaultProjectMember } from 'lib/projects/constants';
import { projectFieldProperties } from 'lib/projects/formField';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/formField';
import type { ProjectWithMembers } from 'lib/projects/interfaces';
import { isTruthy } from 'lib/utils/types';

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
  project: ProjectWithMembers;
  refreshProjects: KeyedMutator<ProjectWithMembers[]>;
  disabled?: boolean;
  fieldConfig?: ProjectAndMembersFieldConfig;
  isTeamLead: boolean;
  selectedMemberIds: string[];
  onFormFieldChange: (field: ProjectFieldValue) => void;
  applyProjectMembers: (projectMembers: ProjectWithMembers['projectMembers']) => void;
}) {
  const { user } = useUser();

  const { showError } = useSnackbar();

  const { id: projectId, projectMembers } = project;

  // Note: selectedMemberIds never includes team lead
  const selectedProjectMembers = selectedMemberIds
    .map((memberId) => projectMembers.find((member) => member.id === memberId))
    .filter(isTruthy);
  const nonSelectedProjectMembers = projectMembers.filter(
    (projectMember) => !projectMember.teamLead && projectMember.id && !selectedMemberIds.includes(projectMember.id)
  );
  const { onProjectUpdate, onProjectMemberUpdate, onProjectMemberAdd } = useProjectUpdates({
    projectId: project.id,
    isTeamLead,
    refreshProjects
  });

  async function addTeamMember(selectedMemberId: string) {
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

  return (
    <Stack gap={2} width='100%'>
      <Typography variant='h6'>Project Info</Typography>
      <FieldAnswers
        defaultRequired
        disabled={!isTeamLead || disabled}
        fieldConfig={fieldConfig}
        onChange={onProjectUpdate}
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
        onChange={(updates) => onProjectMemberUpdate(teamLeadMemberId!, updates)}
      />
      <Divider sx={{ my: 1 }} />
      {selectedProjectMembers.map((projectMember, index) => (
        <Stack key={`project-member-${projectMember.id}`}>
          <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>Team member</Typography>
            <IconButton
              data-test='remove-project-member-button'
              disabled={disabled}
              onClick={() => removeTeamMember(projectMember.id)}
            >
              <DeleteOutlineOutlinedIcon fontSize='small' color={disabled ? 'disabled' : 'error'} />
            </IconButton>
          </Stack>
          <ProjectMemberFieldAnswers
            onChange={(updates) => {
              onProjectMemberUpdate(projectMember.id, updates);
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
          addTeamMember(event.target.value as string);
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

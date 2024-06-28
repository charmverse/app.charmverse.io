import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Box, Divider, IconButton, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useCallback } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { useUser } from 'hooks/useUser';
import type { ProjectFieldValue } from 'lib/forms/interfaces';
import { createDefaultProjectAndMembersPayload } from 'lib/projects/constants';
import { createDefaultProjectAndMembersFieldConfig } from 'lib/projects/formField';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/formField';
import type { ProjectAndMembersPayload, ProjectWithMembers } from 'lib/projects/interfaces';

import { useProjectUpdates } from '../hooks/useProjectUpdates';

import { ProjectFieldAnswers, ProjectFieldsEditor } from './ProjectFields';
import { ProjectMemberFieldAnswers, ProjectMemberFieldsEditor } from './ProjectMemberFields';

const newTeamMember = 'ADD_TEAM_MEMBER';

export function ProposalProjectFormAnswers({
  fieldConfig,
  isTeamLead,
  disabled,
  projectId,
  selectedProjectMemberIds,
  onFormFieldChange,
  projectMembers
}: {
  projectId: string;
  disabled?: boolean;
  fieldConfig?: ProjectAndMembersFieldConfig;
  isTeamLead: boolean;
  selectedProjectMemberIds: string[];
  onFormFieldChange: (field: ProjectFieldValue) => void;
  projectMembers: ProjectWithMembers['projectMembers'];
}) {
  const { user } = useUser();
  const extraProjectMembers = projectMembers.slice(1) ?? [];
  const selectedProjectMembers = extraProjectMembers.filter(
    (projectMember) => projectMember.id && selectedProjectMemberIds.includes(projectMember.id)
  );
  const nonSelectedProjectMembers = extraProjectMembers.filter(
    (projectMember) => projectMember.id && !selectedProjectMemberIds.includes(projectMember.id)
  );
  const { onProjectUpdate, onProjectMemberUpdate, onProjectMemberAdd } = useProjectUpdates({
    projectId
  });

  async function onChangeTeamMembers(selectedMemberValue: string) {
    if (selectedMemberValue !== newTeamMember) {
      const selectedMemberIds = [...selectedProjectMemberIds, selectedMemberValue];
      onFormFieldChange({ projectId, selectedMemberIds });
    } else {
      const newProjectMember = await onProjectMemberAdd(createDefaultProjectAndMembersPayload().projectMembers[0]);
      if (newProjectMember) {
        const selectedMemberIds = [...selectedProjectMemberIds, newProjectMember.id];
        onFormFieldChange({ projectId, selectedMemberIds });
      }
    }
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
  const onProjectMemberUpdateMemo = useCallback(
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
      <ProjectFieldAnswers
        defaultRequired
        disabled={!isTeamLead || disabled}
        fieldConfig={fieldConfig}
        onChange={onProjectUpdateMemo}
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
        onChange={onProjectMemberUpdateMemo}
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
                const selectedMemberIds = selectedProjectMemberIds.filter((id) => id !== projectMember.id);
                onFormFieldChange({ projectId, selectedMemberIds });
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

export function SettingsProjectFormAnswers({ isTeamLead }: { isTeamLead: boolean }) {
  const { watch, setValue, control } = useFormContext<ProjectAndMembersPayload>();
  const projectValues = watch();
  const { user } = useUser();
  const extraProjectMembers = projectValues.projectMembers.slice(1);
  const fieldConfig = createDefaultProjectAndMembersFieldConfig();

  const { remove } = useFieldArray({
    control,
    name: 'projectMembers'
  });

  return (
    <Stack gap={2} width='100%'>
      <Typography variant='h6'>Project Info</Typography>
      <ProjectFieldAnswers defaultRequired={false} disabled={!isTeamLead} fieldConfig={fieldConfig} />
      <Typography variant='h6' mt={2}>
        Team Info
      </Typography>
      <FieldLabel>Team Lead</FieldLabel>
      <ProjectMemberFieldAnswers
        projectMemberIndex={0}
        disabled={!isTeamLead}
        defaultRequired={false}
        fieldConfig={fieldConfig?.projectMember}
      />
      {extraProjectMembers.length ? (
        <>
          <Divider
            sx={{
              my: 1
            }}
          />
          {extraProjectMembers.map((projectMember, index) => (
            <Stack key={`project-member-${index.toString()}`}>
              <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
                <Typography variant='h6'>Team member</Typography>
                {isTeamLead ? (
                  <IconButton
                    data-test='delete-project-member-button'
                    onClick={() => {
                      remove(index + 1);
                    }}
                  >
                    <DeleteOutlineOutlinedIcon fontSize='small' color='error' />
                  </IconButton>
                ) : null}
              </Stack>
              <ProjectMemberFieldAnswers
                projectMemberIndex={index + 1}
                disabled={!(isTeamLead || projectMember.userId === user?.id)}
                defaultRequired={false}
                fieldConfig={fieldConfig?.projectMember}
              />
            </Stack>
          ))}
        </>
      ) : null}
      <Divider
        sx={{
          my: 1
        }}
      />
      <Box
        sx={{
          mb: 2,
          width: 'fit-content'
        }}
      >
        <Button
          disabled={!isTeamLead}
          disabledTooltip='Only the team lead can add team members'
          startIcon={<AddIcon fontSize='small' />}
          data-test='add-project-member-button'
          onClick={() => {
            const projectMembers = [
              ...projectValues.projectMembers,
              createDefaultProjectAndMembersPayload().projectMembers[0]
            ];

            setValue('projectMembers', projectMembers, {
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true
            });
          }}
        >
          Add a team member
        </Button>
      </Box>
    </Stack>
  );
}

export function ProjectFormEditor({
  onChange,
  fieldConfig,
  defaultRequired
}: {
  onChange?: (project: ProjectAndMembersFieldConfig) => void;
  fieldConfig: ProjectAndMembersFieldConfig;
  defaultRequired?: boolean;
}) {
  return (
    <Stack gap={2}>
      <Typography variant='h6'>Project Info</Typography>
      <ProjectFieldsEditor
        defaultRequired={defaultRequired}
        fieldConfig={fieldConfig}
        onChange={
          onChange === undefined
            ? undefined
            : (_fieldConfig) => {
                onChange?.({
                  ...fieldConfig,
                  ..._fieldConfig
                });
              }
        }
      />
      <Typography variant='h6' mt={2}>
        Team Info
      </Typography>
      <FieldLabel>Team Lead</FieldLabel>
      <ProjectMemberFieldsEditor
        defaultRequired={defaultRequired}
        fieldConfig={fieldConfig?.projectMember}
        onChange={
          onChange === undefined
            ? undefined
            : (memberFieldConfig) => {
                onChange?.({
                  ...fieldConfig,
                  projectMember: memberFieldConfig
                });
              }
        }
      />
      <FieldLabel>Team Members</FieldLabel>
      <Select disabled value='SELECT_TEAM_MEMBER'>
        <MenuItem value='SELECT_TEAM_MEMBER'>
          <Typography>Select a team member</Typography>
        </MenuItem>
      </Select>
    </Stack>
  );
}

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Box, Divider, IconButton, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { useGetProjects } from 'charmClient/hooks/projects';
import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { useUser } from 'hooks/useUser';
import {
  createDefaultProjectAndMembersFieldConfig,
  createDefaultProjectAndMembersPayload
} from 'lib/projects/constants';
import type { ProjectAndMembersFieldConfig, ProjectAndMembersPayload } from 'lib/projects/interfaces';

import { useProjectUpdates } from '../hooks/useProjectUpdates';

import { ProjectFieldAnswers, ProjectFieldsEditor } from './ProjectFields';
import { ProjectMemberFieldAnswers, ProjectMemberFieldsEditor } from './ProjectMemberFields';

export function ProposalProjectFormAnswers({
  fieldConfig,
  isTeamLead,
  disabled,
  projectId,
  selectedProjectMemberIds,
  onFormFieldChange
}: {
  projectId: string;
  disabled?: boolean;
  fieldConfig?: ProjectAndMembersFieldConfig;
  isTeamLead: boolean;
  selectedProjectMemberIds: string[];
  onFormFieldChange: (newProjectMemberIds: string[]) => void;
}) {
  const { data: projectsWithMembers } = useGetProjects();
  const { user } = useUser();
  const projectWithMember = projectsWithMembers?.find((project) => project.id === projectId);
  const extraProjectMembers = projectWithMember?.projectMembers.slice(1) ?? [];
  const selectedProjectMembers = extraProjectMembers.filter(
    (projectMember) => projectMember.id && selectedProjectMemberIds.includes(projectMember.id)
  );
  const nonSelectedProjectMembers = extraProjectMembers.filter(
    (projectMember) => projectMember.id && !selectedProjectMemberIds.includes(projectMember.id)
  );
  const { onProjectUpdate, onProjectMemberUpdate, onProjectMemberAdd } = useProjectUpdates({
    projectId
  });

  async function onChange(selectedMemberValue: string) {
    if (selectedMemberValue !== 'ADD_TEAM_MEMBER') {
      onFormFieldChange([...selectedProjectMemberIds, selectedMemberValue]);
    } else {
      const newProjectMember = await onProjectMemberAdd(createDefaultProjectAndMembersPayload().projectMembers[0]);
      if (newProjectMember) {
        onFormFieldChange([...selectedProjectMemberIds, newProjectMember.id]);
      }
    }
  }

  return (
    <Stack gap={2} width='100%'>
      <Typography variant='h6'>Project Info</Typography>
      <ProjectFieldAnswers
        defaultRequired
        disabled={!isTeamLead || disabled}
        fieldConfig={fieldConfig}
        onChange={(updatedProjectValues) => {
          onProjectUpdate({
            ...updatedProjectValues,
            id: projectId
          });
        }}
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
        onChange={(updatedProjectMember) => {
          if (projectWithMember) {
            onProjectMemberUpdate({
              ...updatedProjectMember,
              id: projectWithMember.projectMembers[0].id!
            });
          }
        }}
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
                onFormFieldChange(selectedProjectMemberIds.filter((id) => id !== projectMember.id));
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
        renderValue={() => {
          return 'Select a team member';
        }}
      >
        {nonSelectedProjectMembers.length ? (
          <>
            {nonSelectedProjectMembers.map((projectMember, index) => (
              <MenuItem
                key={`project-member-${index.toString()}`}
                data-test='project-member-option'
                onClick={() => {
                  onChange(projectMember.id as string);
                }}
              >
                <Typography color={projectMember.name ? '' : 'secondary'}>
                  {projectMember.name || 'Untitled Project Member'}
                </Typography>
              </MenuItem>
            ))}
            <Divider />
          </>
        ) : null}
        <MenuItem
          value='ADD_TEAM_MEMBER'
          data-test='project-member-option'
          disabled={!isTeamLead || disabled}
          onClick={() => {
            onChange('ADD_TEAM_MEMBER');
          }}
        >
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
  const { getValues, setValue, control } = useFormContext<ProjectAndMembersPayload>();
  const projectValues = getValues();
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

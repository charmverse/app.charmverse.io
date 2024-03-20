import MuiAddIcon from '@mui/icons-material/Add';
import { Divider, Stack, Typography } from '@mui/material';

import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';

import type { ProjectEditorFieldConfig, ProjectFieldConfig, ProjectValues } from './interfaces';
import { ProjectFieldAnswers, ProjectFieldsEditor } from './ProjectFields';
import {
  projectMemberDefaultValues,
  ProjectMemberFieldAnswers,
  ProjectMemberFieldsEditor
} from './ProjectMemberFields';

export function ProjectFormAnswers({
  onChange,
  values,
  fieldConfig,
  showAddTeamMemberButton
}: {
  values: ProjectValues;
  onChange?: (project: ProjectValues) => void;
  fieldConfig?: ProjectEditorFieldConfig;
  showAddTeamMemberButton?: boolean;
}) {
  return (
    <Stack gap={2} width='100%'>
      <Typography variant='h5'>Project Info</Typography>
      <ProjectFieldAnswers
        values={values}
        onChange={
          onChange === undefined
            ? undefined
            : (_project) => {
                onChange({
                  ...values,
                  ..._project
                });
              }
        }
        fieldConfig={fieldConfig as ProjectFieldConfig}
      />
      <Typography variant='h5' mt={2}>
        Team Info
      </Typography>
      <FieldLabel>Team Lead</FieldLabel>
      <ProjectMemberFieldAnswers
        onChange={
          onChange === undefined
            ? undefined
            : (projectMember) => {
                onChange({
                  ...values,
                  members: [projectMember, ...values.members.slice(1)]
                });
              }
        }
        fieldConfig={fieldConfig?.members?.[0]}
        values={projectMemberDefaultValues}
      />
      <Divider
        sx={{
          my: 1
        }}
      />

      {values.members.slice(1).map((member, index) => (
        <>
          <FieldLabel>Add a team member</FieldLabel>
          <ProjectMemberFieldAnswers
            onChange={
              onChange === undefined
                ? undefined
                : (projectMember) => {
                    onChange({
                      ...values,
                      members: [
                        ...values.members.slice(0, index + 1),
                        projectMember,
                        ...values.members.slice(index + 2)
                      ]
                    });
                  }
            }
            fieldConfig={fieldConfig?.members[index + 1]}
            values={member}
          />
          <Divider
            sx={{
              my: 1
            }}
          />
        </>
      ))}
      {showAddTeamMemberButton && onChange && (
        <Button
          sx={{
            width: 'fit-content'
          }}
          startIcon={<MuiAddIcon fontSize='small' />}
          onClick={() => {
            onChange({
              ...values,
              members: [...values.members, projectMemberDefaultValues]
            });
          }}
        >
          Add a team member
        </Button>
      )}
    </Stack>
  );
}

export function ProjectFormEditor({
  onChange,
  values
}: {
  onChange?: (project: ProjectEditorFieldConfig) => void;
  values: ProjectEditorFieldConfig;
}) {
  return (
    <Stack gap={2} p={2}>
      <Typography variant='h5'>Project Info</Typography>
      <ProjectFieldsEditor
        values={values}
        onChange={
          onChange === undefined
            ? undefined
            : (_project) => {
                onChange?.({
                  ...values,
                  ..._project
                });
              }
        }
      />
      <Typography variant='h5' mt={2}>
        Team Info
      </Typography>
      <FieldLabel>Team Lead</FieldLabel>
      <ProjectMemberFieldsEditor
        values={values?.members?.[0]}
        onChange={
          onChange === undefined
            ? undefined
            : (member) => {
                onChange?.({
                  ...values,
                  members: [member, ...(values.members?.slice(1) ?? [])]
                });
              }
        }
      />
      <Divider
        sx={{
          my: 1
        }}
      />

      {values.members?.slice(1).map((member, index) => (
        <>
          <FieldLabel>Add a team member</FieldLabel>
          <ProjectMemberFieldsEditor
            values={member}
            onChange={
              onChange === undefined
                ? undefined
                : (_member) => {
                    onChange?.({
                      ...values,
                      members: [
                        ...values.members.slice(0, index + 1),
                        _member,
                        ...(values.members?.slice(index + 2) ?? [])
                      ]
                    });
                  }
            }
          />
          <Divider
            sx={{
              my: 1
            }}
          />
        </>
      ))}
      {onChange && (
        <Button
          sx={{
            width: 'fit-content'
          }}
          startIcon={<MuiAddIcon fontSize='small' />}
          onClick={() => {
            onChange({
              ...values,
              members: [...values.members, {}]
            });
          }}
        >
          Add a team member
        </Button>
      )}
    </Stack>
  );
}

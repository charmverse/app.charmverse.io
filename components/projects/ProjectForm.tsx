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
                  projectMembers: [projectMember, ...values.projectMembers.slice(1)]
                });
              }
        }
        fieldConfig={fieldConfig?.projectMembers?.[0]}
        values={projectMemberDefaultValues}
      />
      <Divider
        sx={{
          my: 1
        }}
      />

      {values.projectMembers.slice(1).map((member, index) => (
        <>
          <FieldLabel>Team member</FieldLabel>
          <ProjectMemberFieldAnswers
            onChange={
              onChange === undefined
                ? undefined
                : (projectMember) => {
                    onChange({
                      ...values,
                      projectMembers: [
                        ...values.projectMembers.slice(0, index + 1),
                        projectMember,
                        ...values.projectMembers.slice(index + 2)
                      ]
                    });
                  }
            }
            fieldConfig={fieldConfig?.projectMembers[index + 1]}
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
              projectMembers: [...values.projectMembers, projectMemberDefaultValues]
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
        values={values?.projectMembers?.[0]}
        onChange={
          onChange === undefined
            ? undefined
            : (member) => {
                onChange?.({
                  ...values,
                  projectMembers: [member, ...(values.projectMembers?.slice(1) ?? [])]
                });
              }
        }
      />
    </Stack>
  );
}

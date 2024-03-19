import MuiAddIcon from '@mui/icons-material/Add';
import { Divider, Stack, Typography } from '@mui/material';

import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';

import type { ProjectFormValues, ProjectFormWithRequiredTogglesValues } from './interfaces';
import { ProjectFields, ProjectFieldsWithRequiredToggle } from './ProjectFields';
import {
  projectMemberDefaultValues,
  ProjectMemberFields,
  ProjectMemberFieldsWithRequiredToggle
} from './ProjectMemberFields';

export function ProjectForm({
  onChange,
  values,
  requiredValues
}: {
  values: ProjectFormValues;
  onChange: (project: ProjectFormValues) => void;
  requiredValues?: ProjectFormWithRequiredTogglesValues;
}) {
  return (
    <Stack gap={2} width='100%'>
      <Typography variant='h5'>Project Info</Typography>
      <ProjectFields
        defaultValues={values}
        onChange={(_project) => {
          onChange({
            ...values,
            ..._project
          });
        }}
        requiredValues={requiredValues}
      />
      <Typography variant='h5' mt={2}>
        Team Info
      </Typography>
      <FieldLabel>Team Lead</FieldLabel>
      <ProjectMemberFields
        onChange={(projectMember) => {
          onChange({
            ...values,
            members: [projectMember, ...values.members.slice(1)]
          });
        }}
        requiredValues={requiredValues?.members[0] ?? {}}
        defaultValues={projectMemberDefaultValues}
      />
      <Divider
        sx={{
          my: 1
        }}
      />

      {values.members.slice(1).map((member, index) => (
        <>
          <FieldLabel>Add a team member</FieldLabel>
          <ProjectMemberFields
            onChange={(projectMember) => {
              onChange({
                ...values,
                members: [...values.members.slice(0, index + 1), projectMember, ...values.members.slice(index + 2)]
              });
            }}
            requiredValues={requiredValues?.members[index + 1] ?? {}}
            defaultValues={member}
          />
          <Divider
            sx={{
              my: 1
            }}
          />
        </>
      ))}
      {/* <Button
        sx={{
          width: 'fit-content'
        }}
        startIcon={<MuiAddIcon fontSize='small' />}
        onClick={() => {
        }}
      >
        Add a team member
      </Button> */}
    </Stack>
  );
}

export function ProjectFormWithRequiredToggles({
  onChange,
  values
}: {
  onChange?: (project: ProjectFormWithRequiredTogglesValues) => void;
  values: ProjectFormWithRequiredTogglesValues;
}) {
  return (
    <Stack gap={2} p={2}>
      <Typography variant='h5'>Project Info</Typography>
      <ProjectFieldsWithRequiredToggle
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
      <ProjectMemberFieldsWithRequiredToggle
        values={values.members[0]}
        onChange={
          onChange === undefined
            ? undefined
            : (member) => {
                onChange?.({
                  ...values,
                  members: [member, ...values.members.slice(1)]
                });
              }
        }
      />
      <Divider
        sx={{
          my: 1
        }}
      />

      {values.members.slice(1).map((member, index) => (
        <>
          <FieldLabel>Add a team member</FieldLabel>
          <ProjectMemberFieldsWithRequiredToggle
            values={member}
            onChange={
              onChange === undefined
                ? undefined
                : (_member) => {
                    onChange?.({
                      ...values,
                      members: [...values.members.slice(0, index + 1), _member, ...values.members.slice(index + 2)]
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

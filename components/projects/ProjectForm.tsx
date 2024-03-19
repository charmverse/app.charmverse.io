import MuiAddIcon from '@mui/icons-material/Add';
import { Divider, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';

import type { ProjectFormWithRequiredTogglesValues } from './interfaces';
import type { ProjectPayload } from './ProjectFields';
import { projectDefaultValues, ProjectFields, ProjectFieldsWithRequiredToggle } from './ProjectFields';
import type { ProjectMemberPayload } from './ProjectMemberFields';
import {
  projectMemberDefaultValues,
  ProjectMemberFields,
  ProjectMemberFieldsWithRequiredToggle
} from './ProjectMemberFields';

export function ProjectForm() {
  const [project, setProject] = useState<ProjectPayload>(projectDefaultValues);
  const [projectMembers, setProjectMembers] = useState<ProjectMemberPayload[]>([projectMemberDefaultValues]);

  return (
    <Stack gap={2} p={2}>
      <Typography variant='h5'>Project Info</Typography>
      <ProjectFields
        defaultValues={project}
        onChange={(_project) => {
          setProject({
            ...project,
            ..._project
          });
        }}
      />
      <Typography variant='h5' mt={2}>
        Team Info
      </Typography>
      <FieldLabel>Team Lead</FieldLabel>
      <ProjectMemberFields
        onChange={(projectMember) => {
          setProjectMembers([projectMember, ...projectMembers.slice(1)]);
        }}
        defaultValues={projectMemberDefaultValues}
      />
      <Divider
        sx={{
          my: 1
        }}
      />

      {projectMembers.slice(1).map((_, index) => (
        <>
          <FieldLabel>Add a team member</FieldLabel>
          <ProjectMemberFields
            onChange={(projectMember) => {
              setProjectMembers([
                ...projectMembers.slice(0, index + 1),
                projectMember,
                ...projectMembers.slice(index + 2)
              ]);
            }}
            defaultValues={projectMemberDefaultValues}
          />
          <Divider
            sx={{
              my: 1
            }}
          />
        </>
      ))}
      <Button
        sx={{
          width: 'fit-content'
        }}
        startIcon={<MuiAddIcon fontSize='small' />}
        onClick={() => {
          setProjectMembers([...projectMembers, projectMemberDefaultValues]);
        }}
      >
        Add a team member
      </Button>
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

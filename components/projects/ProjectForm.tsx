import MuiAddIcon from '@mui/icons-material/Add';
import { Divider, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';

import type { ProjectPayload } from './ProjectFields';
import { projectDefaultValues, ProjectFields } from './ProjectFields';
import type { ProjectMemberPayload } from './ProjectMemberFields';
import { projectMemberDefaultValues, ProjectMemberFields } from './ProjectMemberFields';

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

import { MenuItem, Select, Stack, Typography } from '@mui/material';

import FieldLabel from 'components/common/form/FieldLabel';
import { projectMemberFieldProperties, projectFieldProperties } from '@packages/lib/projects/formField';
import type { ProjectAndMembersFieldConfig } from '@packages/lib/projects/formField';

import { FieldsEditor } from './FieldsEditor';

export function ProjectFieldEditor({
  onChange,
  fieldConfig
}: {
  onChange?: (project: ProjectAndMembersFieldConfig) => void;
  fieldConfig: ProjectAndMembersFieldConfig;
}) {
  return (
    <Stack gap={2}>
      <Typography variant='h6'>Project Info</Typography>
      <FieldsEditor
        fieldConfig={fieldConfig}
        properties={projectFieldProperties}
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
      <FieldsEditor
        properties={projectMemberFieldProperties}
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
        isProjectMember
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

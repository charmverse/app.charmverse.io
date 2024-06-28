import { MenuItem, Select, Stack, Typography } from '@mui/material';

import FieldLabel from 'components/common/form/FieldLabel';
import { FieldsEditor } from 'components/settings/projects/components/FieldsEditor';
import { projectMemberFieldProperties, projectFieldProperties } from 'lib/projects/formField';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/formField';

export function ProjectFieldEditor({
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
      <FieldsEditor
        defaultRequired={defaultRequired}
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
        defaultRequired={defaultRequired}
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

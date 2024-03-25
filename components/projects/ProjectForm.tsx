import { Stack, Typography } from '@mui/material';

import FieldLabel from 'components/common/form/FieldLabel';

import type { ProjectEditorFieldConfig, ProjectFieldConfig, ProjectUpdatePayload, ProjectValues } from './interfaces';
import { ProjectFieldAnswers, ProjectFieldsEditor } from './ProjectFields';
import { ProjectMemberFieldAnswers, ProjectMemberFieldsEditor } from './ProjectMemberFields';

export function ProjectFormAnswers({
  fieldConfig,
  isTeamLead,
  defaultRequired
}: {
  fieldConfig?: ProjectEditorFieldConfig;
  isTeamLead: boolean;
  defaultRequired?: boolean;
}) {
  return (
    <Stack gap={2} width='100%'>
      <Typography variant='h6'>Project Info</Typography>
      <ProjectFieldAnswers defaultRequired={defaultRequired} disabled={!isTeamLead} fieldConfig={fieldConfig} />
      <Typography variant='h5' mt={2}>
        Team Info
      </Typography>
      <FieldLabel>Team Lead</FieldLabel>
      <ProjectMemberFieldAnswers
        projectMemberIndex={0}
        disabled={!isTeamLead}
        defaultRequired={defaultRequired}
        fieldConfig={fieldConfig?.projectMember}
      />
    </Stack>
  );
}

export function ProjectFormEditor({
  onChange,
  values,
  defaultRequired
}: {
  onChange?: (project: ProjectEditorFieldConfig) => void;
  values: ProjectEditorFieldConfig;
  defaultRequired?: boolean;
}) {
  return (
    <Stack gap={2} p={2}>
      <Typography variant='h6'>Project Info</Typography>
      <ProjectFieldsEditor
        defaultRequired={defaultRequired}
        values={values}
        onChange={
          onChange === undefined
            ? undefined
            : (fieldConfig) => {
                onChange?.({
                  ...values,
                  ...fieldConfig
                });
              }
        }
      />
      <Typography variant='h5' mt={2}>
        Team Info
      </Typography>
      <FieldLabel>Team Lead</FieldLabel>
      <ProjectMemberFieldsEditor
        defaultRequired={defaultRequired}
        values={values?.projectMember}
        onChange={
          onChange === undefined
            ? undefined
            : (memberFieldConfig) => {
                onChange?.({
                  ...values,
                  projectMember: memberFieldConfig
                });
              }
        }
      />
    </Stack>
  );
}

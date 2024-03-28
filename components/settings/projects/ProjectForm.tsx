import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Divider, Stack, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';

import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { defaultProjectValues } from 'lib/projects/constants';
import type { ProjectFieldConfig, ProjectValues } from 'lib/projects/interfaces';

import { ProjectFieldAnswers, ProjectFieldsEditor } from './ProjectFields';
import { ProjectMemberFieldAnswers, ProjectMemberFieldsEditor } from './ProjectMemberFields';

export function ProjectFormAnswers({
  fieldConfig,
  isTeamLead,
  defaultRequired
}: {
  fieldConfig?: ProjectFieldConfig;
  isTeamLead: boolean;
  defaultRequired?: boolean;
}) {
  const { getValues, setValue } = useFormContext<ProjectValues>();
  const projectValues = getValues();
  const extraProjectMembers = projectValues.projectMembers.slice(1);
  return (
    <Stack gap={2} width='100%'>
      <Typography variant='h6'>Project Info</Typography>
      <ProjectFieldAnswers defaultRequired={defaultRequired} disabled={!isTeamLead} fieldConfig={fieldConfig} />
      <Typography variant='h6' mt={2}>
        Team Info
      </Typography>
      <FieldLabel>Team Lead</FieldLabel>
      <ProjectMemberFieldAnswers
        projectMemberIndex={0}
        disabled={!isTeamLead}
        defaultRequired={defaultRequired}
        fieldConfig={fieldConfig?.projectMember}
      />
      {extraProjectMembers.length ? (
        <>
          <Divider
            sx={{
              my: 1
            }}
          />
          {extraProjectMembers.map((_, index) => (
            <Stack key={`project-member-${index.toString()}`}>
              <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
                <Typography variant='h6'>Add a team member</Typography>
                <DeleteOutlineOutlinedIcon
                  fontSize='small'
                  color='error'
                  onClick={() => {
                    setValue(
                      'projectMembers',
                      extraProjectMembers.filter((__, i) => i !== index + 1),
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true
                      }
                    );
                  }}
                />
              </Stack>
              <ProjectMemberFieldAnswers
                projectMemberIndex={index + 1}
                disabled={!isTeamLead}
                defaultRequired={defaultRequired}
                fieldConfig={fieldConfig?.projectMember}
              />
            </Stack>
          ))}
          <Divider
            sx={{
              my: 1
            }}
          />
        </>
      ) : null}
      <Button
        sx={{
          mb: 2,
          width: 'fit-content'
        }}
        startIcon={<AddIcon fontSize='small' />}
        onClick={() => {
          setValue('projectMembers', [...projectValues.projectMembers, defaultProjectValues.projectMembers[0]], {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
          });
        }}
      >
        Add a team member
      </Button>
    </Stack>
  );
}

export function ProjectFormEditor({
  onChange,
  values,
  defaultRequired
}: {
  onChange?: (project: ProjectFieldConfig) => void;
  values: ProjectFieldConfig;
  defaultRequired?: boolean;
}) {
  return (
    <Stack gap={2}>
      <Typography variant='h6'>Project Info</Typography>
      <ProjectFieldsEditor
        defaultRequired={defaultRequired}
        fieldConfig={values}
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
        fieldConfig={values?.projectMember}
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

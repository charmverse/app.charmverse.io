import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Box, Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { FieldAnswers } from 'components/common/ProjectForm/components/FieldAnswers';
import { useUser } from 'hooks/useUser';
import { defaultProjectMember } from '@packages/lib/projects/constants';
import {
  projectMemberFieldProperties,
  createDefaultProjectAndMembersFieldConfig,
  projectFieldProperties
} from '@packages/lib/projects/formField';
import type { ProjectAndMembersPayload } from '@packages/lib/projects/interfaces';

export function ProjectForm({ isTeamLead }: { isTeamLead: boolean }) {
  const { watch, setValue, control } = useFormContext<ProjectAndMembersPayload>();
  const projectValues = watch();
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
      <FieldAnswers properties={projectFieldProperties} disabled={!isTeamLead} fieldConfig={fieldConfig} />
      <Typography variant='h6' mt={2}>
        Team Info
      </Typography>
      <FieldLabel>Team Lead</FieldLabel>
      <FieldAnswers
        disabled={!isTeamLead}
        namePrefix='projectMembers[0]'
        fieldConfig={fieldConfig?.projectMember}
        properties={projectMemberFieldProperties}
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
                  <Tooltip title='Remove team member'>
                    <IconButton
                      data-test='delete-project-member-button'
                      onClick={() => {
                        remove(index + 1);
                      }}
                    >
                      <DeleteOutlineOutlinedIcon fontSize='small' color='secondary' />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>
              <FieldAnswers
                disabled={!(isTeamLead || projectMember.userId === user?.id)}
                namePrefix={`projectMembers[${index + 1}]`}
                fieldConfig={fieldConfig?.projectMember}
                properties={projectMemberFieldProperties}
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
      <Box mb={2} width='fit-content'>
        <Button
          disabled={!isTeamLead}
          disabledTooltip='Only the team lead can add team members'
          startIcon={<AddIcon fontSize='small' />}
          data-test='add-project-member-button'
          onClick={() => {
            const projectMembers = [...projectValues.projectMembers, defaultProjectMember()];

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

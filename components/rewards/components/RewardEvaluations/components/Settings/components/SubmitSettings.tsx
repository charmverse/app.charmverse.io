import styled from '@emotion/styled';
import { Box, FormLabel, Stack, Typography } from '@mui/material';
import clsx from 'clsx';
import { DateTime } from 'luxon';

import { StyledPropertyTextInput } from 'components/common/DatabaseEditor/components/properties/TextInput';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import Checkbox from 'components/common/DatabaseEditor/widgets/checkbox';
import { DateTimePicker } from 'components/common/DateTimePicker';

import type { EvaluationStepSettingsProps } from './EvaluationStepSettings';

const RowStack = styled(Stack)`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: space-between;
`;

export function SubmitStepSettings({
  reward,
  readOnly,
  onChange
}: Omit<EvaluationStepSettingsProps, 'evaluation' | 'rewardStatus'>) {
  return (
    <Stack gap={1.5}>
      <RowStack mb={0.5}>
        <FormLabel>
          <Typography component='span' variant='subtitle1'>
            Duration (days)
          </Typography>
        </FormLabel>
        <Box width='fit-content'>
          <DateTimePicker
            variant='card_property'
            minDate={DateTime.fromMillis(Date.now())}
            value={reward?.dueDate ? DateTime.fromISO(reward.dueDate.toString()) : null}
            disabled={readOnly}
            disablePast
            placeholder='Select due date'
            onAccept={(date) => {
              onChange({
                dueDate: date?.toJSDate() || undefined
              });
            }}
            onChange={(value) => {
              onChange({
                dueDate: value?.toJSDate() || undefined
              });
            }}
          />
        </Box>
      </RowStack>
      <RowStack>
        <FormLabel>
          <Typography component='span' variant='subtitle1'>
            Allow multiple entries
          </Typography>
        </FormLabel>
        <Box width='fit-content'>
          <Checkbox
            isOn={Boolean(reward?.allowMultipleApplications)}
            onChanged={(isOn) => {
              onChange({
                allowMultipleApplications: !!isOn
              });
            }}
            disabled={readOnly}
            readOnly={readOnly}
          />
        </Box>
      </RowStack>
      <RowStack>
        <FormLabel>
          <Typography component='span' variant='subtitle1'>
            Applicant Roles
          </Typography>
        </FormLabel>
        <Box width='fit-content'>
          <UserAndRoleSelect
            type='role'
            readOnly={readOnly}
            value={(reward?.allowedSubmitterRoles ?? []).map((roleId) => ({ group: 'role', id: roleId }))}
            onChange={(options) => {
              const roleIds = options.filter((option) => option.group === 'role').map((option) => option.id);

              onChange({
                allowedSubmitterRoles: roleIds
              });
            }}
          />
        </Box>
      </RowStack>
      <RowStack>
        <FormLabel>
          <Typography component='span' variant='subtitle1'>
            # Available
          </Typography>
        </FormLabel>
        <Box width='fit-content'>
          <StyledPropertyTextInput
            onChange={(e) => {
              const value = Number(e.target.value);
              onChange({
                maxSubmissions: value <= 0 ? null : value
              });
            }}
            required
            defaultValue={reward?.maxSubmissions}
            type='number'
            size='small'
            inputProps={{
              step: 1,
              min: 1,
              style: { height: 'auto' },
              className: clsx('Editable octo-propertyvalue', { readonly: readOnly })
            }}
            sx={{
              width: '100%'
            }}
            disabled={readOnly}
            placeholder='Unlimited'
          />
        </Box>
      </RowStack>
    </Stack>
  );
}

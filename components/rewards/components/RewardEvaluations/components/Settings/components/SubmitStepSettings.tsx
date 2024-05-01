import styled from '@emotion/styled';
import { Box, Checkbox, Stack, TextField } from '@mui/material';
import { DateTime } from 'luxon';
import { useCallback } from 'react';

import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { UserSelect } from 'components/common/DatabaseEditor/components/properties/UserSelect';
import { DateTimePicker } from 'components/common/DateTimePicker';
import { FieldLabel } from 'components/common/WorkflowSidebar/components/FieldLabel';

import type { EvaluationStepSettingsProps } from './EvaluationStepSettings';

const RowStack = styled(Stack)`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: space-between;
`;

export function SubmitStepSettings({
  rewardInput,
  readOnly,
  onChange
}: Pick<EvaluationStepSettingsProps, 'rewardInput' | 'readOnly' | 'onChange'>) {
  const isAssignedReward = !!rewardInput?.assignedSubmitters;

  const updateAssignedSubmitters = useCallback((submitters: string[]) => {
    onChange({
      assignedSubmitters: submitters,
      approveSubmitters: false,
      allowMultipleApplications: false
    });
  }, []);

  return (
    <Stack gap={2}>
      <Box>
        <FieldLabel>Due date</FieldLabel>
        <DateTimePicker
          sx={{
            width: '100%'
          }}
          minDate={DateTime.fromMillis(Date.now())}
          value={rewardInput?.dueDate ? DateTime.fromISO(rewardInput.dueDate.toString()) : null}
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

      {!isAssignedReward ? (
        <>
          <RowStack>
            <FieldLabel>Allow multiple entries</FieldLabel>
            <Checkbox
              sx={{
                p: 0
              }}
              size='medium'
              checked={Boolean(rewardInput?.allowMultipleApplications)}
              onChange={(e) => {
                onChange({
                  allowMultipleApplications: e.target.checked
                });
              }}
              disabled={readOnly}
              readOnly={readOnly}
            />
          </RowStack>
          <Box>
            <FieldLabel>Applicant Roles</FieldLabel>
            <UserAndRoleSelect
              type='role'
              readOnly={readOnly}
              variant='outlined'
              value={(rewardInput?.allowedSubmitterRoles ?? []).map((roleId) => ({ group: 'role', id: roleId }))}
              onChange={(options) => {
                const roleIds = options.filter((option) => option.group === 'role').map((option) => option.id);

                onChange({
                  allowedSubmitterRoles: roleIds
                });
              }}
            />
          </Box>

          <Box>
            <FieldLabel># Available</FieldLabel>
            <TextField
              onChange={(e) => {
                const value = Number(e.target.value);
                onChange({
                  maxSubmissions: value <= 0 ? null : value
                });
              }}
              variant='outlined'
              value={rewardInput?.maxSubmissions}
              type='number'
              size='small'
              inputProps={{
                step: 1,
                min: 1
              }}
              sx={{
                width: '100%'
              }}
              disabled={readOnly}
              placeholder='Unlimited'
            />
          </Box>
        </>
      ) : (
        <Box>
          <FieldLabel>Assigned applicants</FieldLabel>
          <UserSelect
            memberIds={rewardInput.assignedSubmitters ?? []}
            readOnly={readOnly}
            onChange={updateAssignedSubmitters}
            wrapColumn
            showEmptyPlaceholder
            error={!rewardInput.assignedSubmitters?.length && !readOnly ? 'Requires at least one assignee' : undefined}
          />
        </Box>
      )}
    </Stack>
  );
}

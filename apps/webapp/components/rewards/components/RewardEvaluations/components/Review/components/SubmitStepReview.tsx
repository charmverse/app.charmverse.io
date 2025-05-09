import styled from '@emotion/styled';
import { Box, Checkbox, FormLabel, Stack, Typography } from '@mui/material';
import { DateTime } from 'luxon';

import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { UserSelect } from 'components/common/DatabaseEditor/components/properties/UserSelect';
import type { RewardWithUsers } from '@packages/lib/rewards/interfaces';

const RowStack = styled(Stack)`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: space-between;
`;

export function SubmitStepReview({ reward }: { reward: RewardWithUsers }) {
  const isAssignedReward = !!reward?.assignedSubmitters;

  return (
    <Stack gap={2}>
      <RowStack>
        <FormLabel>
          <Typography variant='subtitle1'>Due date</Typography>
        </FormLabel>
        <Typography color='secondary'>
          {reward?.dueDate
            ? DateTime.fromISO(reward.dueDate.toString()).toLocaleString(DateTime.DATE_FULL)
            : 'No due date'}
        </Typography>
      </RowStack>

      {!isAssignedReward ? (
        <>
          <RowStack>
            <FormLabel>
              <Typography component='span' variant='subtitle1'>
                Allow multiple entries
              </Typography>
            </FormLabel>
            <Checkbox
              sx={{
                p: 0
              }}
              size='medium'
              checked={Boolean(reward?.allowMultipleApplications)}
              onChange={() => {}}
              disabled
              readOnly
            />
          </RowStack>
          <Box>
            <FormLabel sx={{ mb: 1 }}>
              <Typography variant='subtitle1'>Applicant Roles</Typography>
            </FormLabel>
            <UserAndRoleSelect
              type='role'
              readOnly
              variant='standard'
              wrapColumn
              value={(reward?.allowedSubmitterRoles ?? []).map((roleId) => ({ group: 'role', id: roleId }))}
              onChange={() => {}}
            />
          </Box>

          <RowStack>
            <FormLabel>
              <Typography variant='subtitle1'># Available</Typography>
            </FormLabel>
            <Typography color='secondary'>
              {reward?.maxSubmissions && reward.maxSubmissions !== 0 ? reward.maxSubmissions : 'Unlimited'}
            </Typography>
          </RowStack>
        </>
      ) : (
        <Box>
          <FormLabel>
            <Typography variant='subtitle1' sx={{ mb: 1 }}>
              Assigned applicants
            </Typography>
          </FormLabel>
          <UserSelect
            memberIds={reward.assignedSubmitters ?? []}
            readOnly
            onChange={() => {}}
            wrapColumn
            showEmptyPlaceholder
            error={!reward.assignedSubmitters?.length ? 'Requires at least one assignee' : undefined}
          />
        </Box>
      )}
    </Stack>
  );
}

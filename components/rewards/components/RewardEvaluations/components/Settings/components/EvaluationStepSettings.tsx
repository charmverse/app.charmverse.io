import { Box, FormLabel, Stack, Typography } from '@mui/material';
import clsx from 'clsx';
import { DateTime } from 'luxon';

import { StyledPropertyTextInput } from 'components/common/DatabaseEditor/components/properties/TextInput';
import type { SelectOption } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import Checkbox from 'components/common/DatabaseEditor/widgets/checkbox';
import { DateTimePicker } from 'components/common/DateTimePicker';
import { useIsAdmin } from 'hooks/useIsAdmin';
import type { RewardInput } from 'lib/rewards/getRewardWorkflow';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import type { RewardEvaluation } from 'pages/api/spaces/[id]/rewards/workflows';

type Props = {
  evaluation: RewardEvaluation;
  onChange: (updatedReward: UpdateableRewardFields) => void;
  readOnly?: boolean;
  reward?: RewardInput;
};

export function EvaluationStepSettings({ evaluation, onChange, readOnly: _readOnly, reward }: Props) {
  const isAdmin = useIsAdmin();
  const readOnly = _readOnly || !isAdmin;
  function handleOnChangeReviewers(reviewers: SelectOption[]) {
    onChange({
      reviewers: reviewers as UpdateableRewardFields['reviewers']
    });
  }

  if (evaluation.type === 'submit') {
    return (
      <Stack gap={1.5}>
        <Stack direction='row' alignItems='center' gap={2} justifyContent='space-between'>
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
        </Stack>
        <Stack direction='row' alignItems='center' gap={2} justifyContent='space-between'>
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
        </Stack>
        <Stack direction='row' alignItems='center' gap={2} justifyContent='space-between'>
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
        </Stack>
        <Stack direction='row' alignItems='center' gap={2} justifyContent='space-between'>
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
        </Stack>
      </Stack>
    );
  } else if (evaluation.type === 'review') {
    return (
      <>
        <FormLabel required>
          <Typography component='span' variant='subtitle1'>
            Reviewers
          </Typography>
        </FormLabel>
        <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow' mb={2}>
          <UserAndRoleSelect
            data-test={`reward-${evaluation.type}-select`}
            emptyPlaceholderContent='Select user or role'
            value={(reward?.reviewers ?? []) as SelectOption[]}
            readOnly={readOnly}
            variant='outlined'
            onChange={handleOnChangeReviewers}
            required
          />
        </Box>
      </>
    );
  }

  return null;
}

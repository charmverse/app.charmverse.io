import styled from '@emotion/styled';
import { Box, Stack, TextField } from '@mui/material';
import clsx from 'clsx';

import { FieldLabel } from 'components/common/WorkflowSidebar/components/FieldLabel';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { getRewardType } from '@packages/lib/rewards/getRewardType';
import type { RewardType } from '@packages/lib/rewards/interfaces';

import type { EvaluationStepSettingsProps } from '../EvaluationStepSettings';

import type { FormInput } from './components/RewardTokenForm';
import { RewardTokenForm } from './components/RewardTokenForm';
import { RewardTypeSelect } from './components/RewardTypeSelect';

const RowStack = styled(Stack)`
  flex-direction: row;
  align-items: center;
`;

export function PaymentStepSettings({
  rewardInput,
  rewardTemplateInput,
  readOnly,
  onChange,
  rewardStatus,
  isTemplate,
  rewardPublished
}: Pick<
  EvaluationStepSettingsProps,
  'rewardInput' | 'rewardTemplateInput' | 'readOnly' | 'onChange' | 'rewardStatus' | 'isTemplate' | 'rewardPublished'
>) {
  const rewardType = rewardInput ? (rewardInput.rewardType ?? getRewardType(rewardInput)) : 'token';

  const { getFeatureTitle } = useSpaceFeatures();

  function setRewardType(_rewardType: RewardType) {
    if (_rewardType === 'none' && rewardStatus !== 'paid') {
      onChange({
        rewardAmount: null,
        chainId: null,
        rewardToken: null,
        customReward: null,
        rewardType: _rewardType
      });
      return;
    }

    onChange({
      rewardType: _rewardType,
      customReward: _rewardType === 'custom' ? rewardInput?.customReward : null,
      rewardAmount: _rewardType === 'token' ? rewardInput?.rewardAmount : null,
      rewardToken: _rewardType === 'token' ? rewardInput?.rewardToken : null,
      chainId: _rewardType === 'token' ? rewardInput?.chainId : null
    });
  }

  async function onRewardTokenUpdate(rewardToken: FormInput | null) {
    if (rewardToken) {
      onChange({
        chainId: rewardToken.chainId,
        rewardToken: rewardToken.rewardToken,
        rewardAmount: rewardToken.rewardAmount ? Number(rewardToken.rewardAmount) : null,
        customReward: null
      });
    }
  }

  return (
    <Stack gap={1.5}>
      <RowStack>
        <FieldLabel style={{ width: 150 }}>Type</FieldLabel>
        <Box flexGrow={1}>
          <RewardTypeSelect
            readOnly={readOnly || (!rewardPublished && !!rewardTemplateInput?.id)}
            value={rewardType}
            onChange={setRewardType}
          />
        </Box>
      </RowStack>

      {rewardType === 'token' && (
        <Box width='fit-content'>
          <RewardTokenForm
            key={rewardTemplateInput?.id}
            onChange={onRewardTokenUpdate}
            defaultValues={rewardInput}
            readOnly={!!readOnly}
            readOnlyToken={!rewardPublished && !!rewardTemplateInput?.rewardToken}
            readOnlyTokenAmount={!rewardPublished && !!rewardTemplateInput?.rewardAmount}
            requireTokenAmount={!isTemplate}
          />
        </Box>
      )}

      {rewardType === 'custom' && (
        <RowStack>
          <FieldLabel required={!readOnly} style={{ width: 150 }}>
            Custom {getFeatureTitle('Reward')}
          </FieldLabel>
          <TextField
            data-test='custom-reward-input'
            onChange={(e) => {
              onChange({
                customReward: e.target.value
              });
            }}
            value={rewardInput?.customReward ?? ''}
            required
            size='small'
            inputProps={{
              style: { height: 'auto' },
              className: clsx('Editable octo-propertyvalue', { readonly: readOnly })
            }}
            disabled={readOnly}
            placeholder='T-shirt'
            autoFocus
            sx={{ flexGrow: 1 }}
          />
        </RowStack>
      )}
    </Stack>
  );
}

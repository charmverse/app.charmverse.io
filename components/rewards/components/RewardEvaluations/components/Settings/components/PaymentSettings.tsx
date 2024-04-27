import styled from '@emotion/styled';
import { Box, FormLabel, Stack, Typography } from '@mui/material';
import clsx from 'clsx';

import { StyledPropertyTextInput } from 'components/common/DatabaseEditor/components/properties/TextInput';
import { RewardTokenProperty } from 'components/rewards/components/RewardProperties/components/RewardTokenProperty';
import { RewardTypeSelect } from 'components/rewards/components/RewardProperties/components/RewardTypeSelect';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { RewardTokenDetails, RewardType } from 'lib/rewards/interfaces';

import type { EvaluationStepSettingsProps } from './EvaluationStepSettings';

const RowStack = styled(Stack)`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: space-between;
`;

export function PaymentStepSettings({
  rewardInput,
  rewardTemplateInput,
  readOnly,
  onChange,
  rewardStatus,
  isTemplate
}: Pick<
  EvaluationStepSettingsProps,
  'rewardInput' | 'rewardTemplateInput' | 'readOnly' | 'onChange' | 'rewardStatus' | 'isTemplate'
>) {
  const rewardType = rewardInput ? rewardInput.rewardType ?? getRewardType(rewardInput) : 'token';

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
      customReward: _rewardType === 'custom' ? rewardInput?.customReward : undefined,
      rewardAmount: _rewardType === 'token' ? rewardInput?.rewardAmount : undefined,
      rewardToken: _rewardType === 'token' ? rewardInput?.rewardToken : undefined,
      chainId: _rewardType === 'token' ? rewardInput?.chainId : undefined
    });
  }

  async function onRewardTokenUpdate(rewardToken: RewardTokenDetails | null) {
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
        <FormLabel required>
          <Typography component='span' variant='subtitle1'>
            Type
          </Typography>
        </FormLabel>
        <Box width='fit-content'>
          <RewardTypeSelect readOnly={readOnly} value={rewardType} onChange={setRewardType} />
        </Box>
      </RowStack>

      {rewardType === 'token' && (
        <RowStack>
          <FormLabel required>
            <Typography component='span' variant='subtitle1'>
              Token
            </Typography>
          </FormLabel>
          <Box width='fit-content'>
            <RewardTokenProperty
              onChange={onRewardTokenUpdate}
              requireTokenAmount={!isTemplate}
              currentReward={
                rewardInput
                  ? {
                      chainId: rewardInput.chainId ?? null,
                      customReward: rewardInput.customReward ?? null,
                      rewardAmount: rewardInput.rewardAmount ?? null,
                      rewardToken: rewardInput.rewardToken ?? null,
                      rewardType
                    }
                  : null
              }
              readOnly={!!readOnly}
              readOnlyToken={!!rewardTemplateInput?.rewardToken}
            />
          </Box>
        </RowStack>
      )}

      {rewardType === 'custom' && (
        <RowStack>
          <FormLabel required>
            <Typography component='span' variant='subtitle1'>
              Custom {getFeatureTitle('Reward')}
            </Typography>
          </FormLabel>
          <Box width='fit-content'>
            <StyledPropertyTextInput
              data-test='custom-reward-input'
              onChange={(e) => {
                onChange({
                  customReward: e.target.value.trim()
                });
              }}
              value={rewardInput?.customReward ?? ''}
              required
              size='small'
              inputProps={{
                style: { height: 'auto' },
                className: clsx('Editable octo-propertyvalue', { readonly: readOnly })
              }}
              sx={{
                width: '100%'
              }}
              disabled={readOnly}
              placeholder='T-shirt'
              autoFocus
              rows={1}
              type='text'
            />
          </Box>
        </RowStack>
      )}
    </Stack>
  );
}

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
  reward,
  readOnly,
  onChange,
  rewardStatus
}: Omit<EvaluationStepSettingsProps, 'evaluation'>) {
  const rewardType = reward ? reward?.rewardType ?? getRewardType(reward) : 'token';

  const { getFeatureTitle } = useSpaceFeatures();

  function setRewardType(_rewardType: RewardType) {
    if (_rewardType === 'none' && rewardStatus !== 'paid') {
      onChange({
        rewardAmount: null,
        chainId: null,
        rewardToken: null,
        customReward: null
      });
      return;
    }

    onChange({
      customReward: rewardType === 'custom' ? reward?.customReward : undefined,
      rewardAmount: rewardType === 'token' ? reward?.rewardAmount : undefined,
      rewardToken: rewardType === 'token' ? reward?.rewardToken : undefined,
      chainId: rewardType === 'token' ? reward?.chainId : undefined
    });
  }

  async function onRewardTokenUpdate(rewardToken: RewardTokenDetails | null) {
    if (rewardToken) {
      onChange({
        chainId: rewardToken.chainId,
        rewardToken: rewardToken.rewardToken,
        rewardAmount: Number(rewardToken.rewardAmount),
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
          <Box>
            <RewardTokenProperty
              onChange={onRewardTokenUpdate}
              currentReward={
                reward
                  ? {
                      chainId: reward.chainId ?? null,
                      customReward: reward.customReward ?? null,
                      rewardAmount: reward.rewardAmount ?? null,
                      rewardToken: reward.rewardToken ?? null
                    }
                  : null
              }
              readOnly={readOnly}
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

          <StyledPropertyTextInput
            onChange={(e) => {
              onChange({
                customReward: e.target.value.trim()
              });
            }}
            value={reward?.customReward ?? ''}
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
        </RowStack>
      )}
    </Stack>
  );
}

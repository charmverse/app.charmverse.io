import type { BountyStatus, Prisma } from '@charmverse/core/prisma-client';
import { KeyboardArrowDown } from '@mui/icons-material';
import { Box, Collapse, Divider, IconButton, Stack, Typography } from '@mui/material';
import { isTruthy } from '@packages/utils/types';
import { useState } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { REWARD_PROPOSAL_LINK } from '@packages/lib/rewards/blocks/constants';
import type { RewardPropertiesField } from '@packages/lib/rewards/blocks/interfaces';
import type { RewardTemplate } from '@packages/lib/rewards/getRewardTemplate';
import type { RewardWithUsers } from '@packages/lib/rewards/interfaces';
import type { UpdateableRewardFields } from '@packages/lib/rewards/updateRewardSettings';
import { getAbsolutePath } from '@packages/lib/utils/browser';

import type { UpdateableRewardFieldsWithType } from '../../hooks/useNewReward';
import type { BoardReward } from '../../hooks/useRewardsBoardAdapter';

import { RewardPropertiesHeader } from './components/RewardPropertiesHeader';
import { CustomPropertiesAdapter } from './CustomPropertiesAdapter';

type Props = {
  onChange: (values: Partial<UpdateableRewardFieldsWithType>) => void;
  values: UpdateableRewardFieldsWithType;
  readOnly?: boolean;
  pageId?: string;
  isNewReward?: boolean;
  isTemplate?: boolean;
  expandedByDefault?: boolean;
  selectTemplate: (template: RewardTemplate | null) => void;
  templateId?: string;
  readOnlyTemplate?: boolean;
  rewardStatus?: BountyStatus | null;
};
export function RewardPropertiesForm({
  onChange,
  values,
  readOnly,
  isNewReward = false,
  isTemplate,
  pageId,
  expandedByDefault,
  selectTemplate,
  templateId,
  readOnlyTemplate,
  rewardStatus
}: Props) {
  const { space } = useCurrentSpace();
  const [isExpanded, setIsExpanded] = useState(!!expandedByDefault);
  async function applyUpdates(updates: Partial<UpdateableRewardFields>) {
    if ('customReward' in updates) {
      const customReward = updates.customReward;
      if (isTruthy(customReward)) {
        updates.rewardAmount = null;
        updates.chainId = null;
        updates.rewardToken = null;
      }
    }

    onChange(updates);
  }
  const sourceProposalPage = (values as RewardWithUsers).sourceProposalPage;
  const proposalLinkValue = sourceProposalPage
    ? [getAbsolutePath(`/${sourceProposalPage.id}`, space?.domain), sourceProposalPage.title]
    : '';
  const rewards = values as unknown as BoardReward;
  return (
    <Box
      className='CardDetail content'
      sx={{
        '.octo-propertyname .Button': {
          paddingLeft: '0 !important'
        },
        display: 'flex',
        flex: 1,
        mt: 0
      }}
      mt={2}
    >
      <Stack className='octo-propertylist' mt={2} flex={1}>
        <Divider />

        <RewardPropertiesHeader
          reward={values}
          pageId={pageId || ''}
          isExpanded={isExpanded}
          toggleExpanded={() => setIsExpanded((v) => !v)}
          readOnly={readOnly || !pageId}
        />

        <Stack
          direction='row'
          gap={1}
          data-test='reward-properties-details'
          alignItems='center'
          sx={{ cursor: 'pointer' }}
          onClick={() => setIsExpanded((v) => !v)}
        >
          <Typography fontWeight='bold'>Details</Typography>
          <IconButton size='small'>
            <KeyboardArrowDown
              fontSize='small'
              sx={{ transform: `rotate(${isExpanded ? 180 : 0}deg)`, transition: 'all 0.2s ease' }}
            />
          </IconButton>
        </Stack>

        <Collapse in={isExpanded} timeout='auto' unmountOnExit>
          <CustomPropertiesAdapter
            readOnly={readOnly}
            reward={{
              ...rewards,
              fields: {
                ...rewards.fields,
                properties: {
                  ...rewards.fields?.properties,
                  [REWARD_PROPOSAL_LINK]: proposalLinkValue
                }
              }
            }}
            onChange={(properties: RewardPropertiesField) => {
              applyUpdates({
                fields: { properties: { ...properties } } as Prisma.JsonValue
              });
            }}
          />
        </Collapse>
      </Stack>
    </Box>
  );
}

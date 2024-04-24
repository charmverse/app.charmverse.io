import type { PageType } from '@charmverse/core/prisma';
import { Box } from '@mui/material';

import { usePublishReward } from 'charmClient/hooks/rewards';
import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import { Button } from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';
import { getRewardErrors } from 'lib/rewards/getRewardErrors';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { RewardWithUsers } from 'lib/rewards/interfaces';

export function RewardStickyFooter({
  reward,
  page,
  refreshReward
}: {
  reward: RewardWithUsers;
  page: { title: string; type: PageType };
  refreshReward?: VoidFunction;
}) {
  const { showMessage } = useSnackbar();
  const { trigger: publishReward, isMutating } = usePublishReward(reward.id);

  async function onClick() {
    try {
      await publishReward();
      refreshReward?.();
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
  }

  // Making sure that the type is bounty so that validation for reviewers works
  const disabledTooltip = getRewardErrors({
    page: {
      title: page.title,
      type: 'bounty'
    },
    reward,
    rewardType: getRewardType(reward),
    isProposalTemplate: false
  }).join('\n');

  return (
    <StickyFooterContainer>
      <Box display='flex' justifyContent='flex-end' alignItems='center' width='100%'>
        <Button
          disabledTooltip={disabledTooltip}
          disabled={!!disabledTooltip}
          data-test='complete-draft-button'
          loading={isMutating}
          onClick={onClick}
        >
          Publish
        </Button>
      </Box>
    </StickyFooterContainer>
  );
}

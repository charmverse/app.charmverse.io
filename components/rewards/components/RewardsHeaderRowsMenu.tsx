import type { DateTime } from 'luxon';
import { useState } from 'react';

import charmClient from 'charmClient';
import type { SelectOption } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import type { ViewHeaderRowsMenuProps } from 'components/common/BoardEditor/focalboard/src/components/viewHeader/ViewHeaderRowsMenu/ViewHeaderRowsMenu';
import { ViewHeaderRowsMenu } from 'components/common/BoardEditor/focalboard/src/components/viewHeader/ViewHeaderRowsMenu/ViewHeaderRowsMenu';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { RewardReviewer, RewardTokenDetails } from 'lib/rewards/interfaces';
import { isTruthy } from 'lib/utilities/types';

import { useRewards } from '../hooks/useRewards';
import { useRewardsBoardAdapter } from '../hooks/useRewardsBoardAdapter';

type Props = Pick<ViewHeaderRowsMenuProps, 'checkedIds' | 'setCheckedIds' | 'cards' | 'board' | 'onChange'> & {
  visiblePropertyIds?: string[];
};
export function RewardsHeaderRowsMenu({ board, visiblePropertyIds, cards, checkedIds, setCheckedIds }: Props) {
  const { refreshRewards } = useRewardsBoardAdapter();
  const { updateReward, rewards } = useRewards();
  const { pages } = usePages();
  const { showConfirmation } = useConfirmationModal();
  const { showMessage } = useSnackbar();
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  let propertyTemplates: IPropertyTemplate<PropertyType>[] = [];
  if (visiblePropertyIds?.length) {
    visiblePropertyIds.forEach((propertyId) => {
      const property = board.fields.cardProperties.find((p) => p.id === propertyId);
      if (property) {
        propertyTemplates.push(property);
      }
    });
  } else {
    propertyTemplates = [...board.fields.cardProperties];
  }

  async function onChangeRewardsDueDate(pageIds: string[], dueDate: DateTime | null) {
    try {
      for (const pageId of pageIds) {
        const page = pages[pageId];
        if (page?.bountyId) {
          await updateReward({
            rewardId: page.bountyId,
            updateContent: {
              dueDate: dueDate?.toJSDate() || undefined
            }
          });
        }
      }
    } catch (err) {
      showMessage('Failed to update rewards', 'error');
    }

    await refreshRewards();
  }

  async function onChangeRewardsReviewers(pageIds: string[], options: SelectOption[]) {
    const reviewerOptions = options.filter(
      (option) => option.group === 'role' || option.group === 'user'
    ) as RewardReviewer[];

    try {
      for (const pageId of pageIds) {
        const page = pages[pageId];
        if (page?.bountyId) {
          await updateReward({
            rewardId: page.bountyId,
            updateContent: {
              reviewers: reviewerOptions.map((option) => ({ group: option.group, id: option.id }))
            }
          });
        }
      }
    } catch (err) {
      showMessage('Failed to update rewards', 'error');
    }

    await refreshRewards();
  }

  async function onMarkRewardsAsPaid() {
    const checkedRewards = checkedIds
      .map((pageId) => {
        const rewardId = pages[pageId]?.bountyId;
        return rewardId ? rewards?.find((r) => r.id === rewardId) : null;
      })
      .filter(isTruthy)
      .filter((reward) => reward.status !== 'paid');

    if (!checkedRewards.length) {
      return;
    }

    const { confirmed } = await showConfirmation({
      title: 'Mark as paid',
      message: `Are you sure you want to mark ${checkedRewards.length} ${
        checkedRewards.length > 1 ? 'rewards' : 'reward'
      } as paid?`
    });

    if (!confirmed) {
      return;
    }

    setIsMarkingPaid(true);
    try {
      for (const reward of checkedRewards) {
        await charmClient.rewards.markRewardAsPaid(reward.id);
      }
    } catch (err) {
      showMessage('Failed to mark rewards as paid', 'error');
    }

    setIsMarkingPaid(false);
    await refreshRewards();
  }

  async function onMarkRewardsAsComplete() {
    const checkedRewards = checkedIds
      .map((pageId) => {
        const rewardId = pages[pageId]?.bountyId;
        return rewardId ? rewards?.find((r) => r.id === rewardId) : null;
      })
      .filter(isTruthy)
      .filter((reward) => reward.status !== 'complete');

    if (!checkedRewards.length) {
      return;
    }
    const { confirmed } = await showConfirmation({
      title: 'Mark as complete',
      message: `Are you sure you want to mark ${checkedRewards.length} ${
        checkedRewards.length > 1 ? 'rewards' : 'reward'
      } as complete?`
    });

    if (!confirmed) {
      return;
    }
    setIsMarkingComplete(true);
    try {
      for (const reward of checkedRewards) {
        await charmClient.rewards.closeReward(reward.id);
      }
    } catch (err) {
      showMessage('Failed to mark rewards as complete', 'error');
    }
    setIsMarkingComplete(false);
    await refreshRewards();
  }

  async function onChangeRewardsToken(rewardToken: RewardTokenDetails | null) {
    if (!rewardToken) {
      return;
    }

    try {
      for (const pageId of checkedIds) {
        const page = pages[pageId];
        const reward = page?.bountyId ? rewards?.find((r) => r.id === page.bountyId) : null;
        if (reward && getRewardType(reward) === 'token') {
          await updateReward({
            rewardId: reward.id,
            updateContent: {
              chainId: rewardToken.chainId,
              rewardToken: rewardToken.rewardToken,
              rewardAmount: Number(rewardToken.rewardAmount),
              customReward: null
            }
          });
        }
      }
    } catch (err) {
      showMessage('Failed to update rewards', 'error');
    }

    await refreshRewards();
  }

  async function onChangeCustomRewardsValue(customReward: string) {
    const checkedRewards = checkedIds
      .map((pageId) => {
        const rewardId = pages[pageId]?.bountyId;
        return rewardId ? rewards?.find((r) => r.id === rewardId) : null;
      })
      .filter(isTruthy)
      .filter((reward) => getRewardType(reward) === 'custom');

    try {
      for (const reward of checkedRewards) {
        await updateReward({
          rewardId: reward.id,
          updateContent: {
            customReward
          }
        });
      }
    } catch (err) {
      showMessage('Failed to update rewards', 'error');
    }

    await refreshRewards();
  }

  const rewardId = checkedIds.length ? pages[checkedIds[0]]?.bountyId : null;
  const reward = rewardId ? rewards?.find((r) => r.id === rewardId) : null;
  const isMarkPaidDisabled = isMarkingPaid || (reward ? reward.status === 'paid' : false);
  const isMarkCompleteDisabled = isMarkingComplete || (reward ? reward.status !== 'open' : false);

  return (
    <ViewHeaderRowsMenu
      onChangeRewardsDueDate={onChangeRewardsDueDate}
      onChangeRewardsReviewers={onChangeRewardsReviewers}
      board={board}
      cards={cards}
      sx={{
        mb: 0.5
      }}
      checkedIds={checkedIds}
      setCheckedIds={setCheckedIds}
      propertyTemplates={propertyTemplates}
      onChange={refreshRewards}
      showRewardsPaymentButton
      onMarkRewardsAsPaid={onMarkRewardsAsPaid}
      onMarkRewardsAsComplete={onMarkRewardsAsComplete}
      onChangeCustomRewardsValue={onChangeCustomRewardsValue}
      onChangeRewardsToken={onChangeRewardsToken}
      isMarkPaidDisabled={isMarkPaidDisabled}
      isMarkCompleteDisabled={isMarkCompleteDisabled}
    />
  );
}

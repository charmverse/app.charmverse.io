import type { DateTime } from 'luxon';

import charmClient from 'charmClient';
import type { SelectOption } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import type { ViewHeaderRowsMenuProps } from 'components/common/BoardEditor/focalboard/src/components/viewHeader/ViewHeaderRowsMenu/ViewHeaderRowsMenu';
import { ViewHeaderRowsMenu } from 'components/common/BoardEditor/focalboard/src/components/viewHeader/ViewHeaderRowsMenu/ViewHeaderRowsMenu';
import { usePages } from 'hooks/usePages';
import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { RewardReviewer, RewardTokenDetails } from 'lib/rewards/interfaces';

import { useRewards } from '../hooks/useRewards';
import { useRewardsBoardAdapter } from '../hooks/useRewardsBoardAdapter';

type Props = Pick<ViewHeaderRowsMenuProps, 'checkedIds' | 'setCheckedIds' | 'cards' | 'board' | 'onChange'> & {
  visiblePropertyIds?: string[];
};
export function RewardsHeaderRowsMenu({ board, visiblePropertyIds, cards, checkedIds, setCheckedIds }: Props) {
  const { refreshRewards } = useRewardsBoardAdapter();
  const { updateReward, rewards } = useRewards();
  const { pages } = usePages();
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

    await refreshRewards();
  }

  async function onChangeRewardsReviewers(pageIds: string[], options: SelectOption[]) {
    for (const pageId of pageIds) {
      const page = pages[pageId];
      if (page?.bountyId) {
        const reviewerOptions = options.filter(
          (option) => option.group === 'role' || option.group === 'user'
        ) as RewardReviewer[];
        await updateReward({
          rewardId: page.bountyId,
          updateContent: {
            reviewers: reviewerOptions.map((option) => ({ group: option.group, id: option.id }))
          }
        });
      }
    }

    await refreshRewards();
  }

  async function onMarkRewardsAsPaid() {
    for (const pageId of checkedIds) {
      const page = pages[pageId];
      if (page?.bountyId) {
        await charmClient.rewards.markRewardAsPaid(page.bountyId);
      }
    }

    await refreshRewards();
  }

  async function onMarkRewardsAsComplete() {
    for (const pageId of checkedIds) {
      const page = pages[pageId];
      const reward = page?.bountyId ? rewards?.find((r) => r.id === page.bountyId) : null;
      if (reward && reward.status !== 'complete') {
        await charmClient.rewards.closeReward(reward.id);
      }
    }

    await refreshRewards();
  }

  async function onChangeRewardsToken(rewardToken: RewardTokenDetails | null) {
    if (!rewardToken) {
      return;
    }

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

    await refreshRewards();
  }

  const rewardId = checkedIds.length ? pages[checkedIds[0]]?.bountyId : null;
  const reward = rewardId ? rewards?.find((r) => r.id === rewardId) : null;
  const isMarkPaidDisabled = reward ? reward.status === 'paid' : false;
  const isMarkCompleteDisabled = reward ? reward.status !== 'open' : false;

  return (
    <ViewHeaderRowsMenu
      onChangeRewardsDueDate={onChangeRewardsDueDate}
      onChangeRewardsReviewers={onChangeRewardsReviewers}
      board={board}
      cards={cards}
      checkedIds={checkedIds}
      setCheckedIds={setCheckedIds}
      propertyTemplates={propertyTemplates}
      onChange={refreshRewards}
      showRewardsPaymentButton
      onMarkRewardsAsPaid={onMarkRewardsAsPaid}
      onMarkRewardsAsComplete={onMarkRewardsAsComplete}
      onChangeRewardsToken={onChangeRewardsToken}
      isMarkPaidDisabled={isMarkPaidDisabled}
      isMarkCompleteDisabled={isMarkCompleteDisabled}
    />
  );
}

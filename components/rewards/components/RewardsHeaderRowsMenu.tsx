import type { DateTime } from 'luxon';

import type { SelectOption } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { SelectOptionPopulated } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import type { ViewHeaderRowsMenuProps } from 'components/common/BoardEditor/focalboard/src/components/viewHeader/ViewHeaderRowsMenu/ViewHeaderRowsMenu';
import { ViewHeaderRowsMenu } from 'components/common/BoardEditor/focalboard/src/components/viewHeader/ViewHeaderRowsMenu/ViewHeaderRowsMenu';
import { usePages } from 'hooks/usePages';
import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { RewardReviewer } from 'lib/rewards/interfaces';

import { useRewards } from '../hooks/useRewards';
import { useRewardsBoardAdapter } from '../hooks/useRewardsBoardAdapter';

type Props = Pick<ViewHeaderRowsMenuProps, 'checkedIds' | 'setCheckedIds' | 'cards' | 'board' | 'onChange'> & {
  visiblePropertyIds?: string[];
};
export function RewardsHeaderRowsMenu({ board, visiblePropertyIds, cards, checkedIds, setCheckedIds }: Props) {
  const { refreshRewards } = useRewardsBoardAdapter();
  const { updateReward } = useRewards();
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
      showRewardsBatchPaymentButton
      showTrashIcon={false}
    />
  );
}

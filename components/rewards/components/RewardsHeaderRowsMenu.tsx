import type { ViewHeaderRowsMenuProps } from 'components/common/BoardEditor/focalboard/src/components/viewHeader/ViewHeaderRowsMenu/ViewHeaderRowsMenu';
import { ViewHeaderRowsMenu } from 'components/common/BoardEditor/focalboard/src/components/viewHeader/ViewHeaderRowsMenu/ViewHeaderRowsMenu';
import { usePages } from 'hooks/usePages';
import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { isTruthy } from 'lib/utilities/types';

import { useRewards } from '../hooks/useRewards';

type Props = Pick<ViewHeaderRowsMenuProps, 'checkedIds' | 'setCheckedIds' | 'cards' | 'board' | 'onChange'> & {
  visiblePropertyIds?: string[];
  refreshRewards: VoidFunction;
};
export function RewardsHeaderRowsMenu({
  board,
  visiblePropertyIds,
  cards,
  checkedIds,
  setCheckedIds,
  refreshRewards
}: Props) {
  let propertyTemplates: IPropertyTemplate<PropertyType>[] = [];
  const { pages } = usePages();
  const { rewards } = useRewards();
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

  async function onBatchPaymentRewards() {
    const rewardsRecord =
      rewards?.filter(isTruthy)?.reduce<Record<string, RewardWithUsers>>((acc, reward) => {
        acc[reward.id] = reward;
        return acc;
      }, {}) ?? {};

    const selectedRewards = checkedIds
      ?.map((pageId) => {
        const page = pages[pageId];
        if (page && page.type === 'bounty' && page.bountyId) {
          return rewardsRecord[page.bountyId];
        }

        return null;
      })
      .filter(isTruthy)
      .filter((reward) => getRewardType(reward) === 'token');
  }

  return (
    <ViewHeaderRowsMenu
      board={board}
      cards={cards}
      checkedIds={checkedIds}
      setCheckedIds={setCheckedIds}
      propertyTemplates={propertyTemplates}
      onChange={refreshRewards}
      onBatchPaymentRewards={onBatchPaymentRewards}
    />
  );
}

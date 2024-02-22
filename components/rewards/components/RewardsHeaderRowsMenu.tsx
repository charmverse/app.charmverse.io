import type { DateTime } from 'luxon';

import type { ViewHeaderRowsMenuProps } from 'components/common/BoardEditor/focalboard/src/components/viewHeader/ViewHeaderRowsMenu/ViewHeaderRowsMenu';
import { ViewHeaderRowsMenu } from 'components/common/BoardEditor/focalboard/src/components/viewHeader/ViewHeaderRowsMenu/ViewHeaderRowsMenu';
import { usePages } from 'hooks/usePages';
import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';

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
    if (pageIds.length === 0) {
      return;
    }

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

  return (
    <ViewHeaderRowsMenu
      onChangeRewardsDueDate={onChangeRewardsDueDate}
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

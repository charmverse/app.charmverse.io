import { withCharmEditorProviders } from 'stories/CharmEditor/renderEditor';
import { GlobalContext } from 'stories/lib/GlobalContext';

import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useNewReward } from 'components/rewards/hooks/useNewReward';

export default {
  title: 'Rewards/Views',
  component: RewardPropertiesForm,
  decorators: [withCharmEditorProviders]
};
export function RewardsPage() {
  const { newPageValues, updateNewPageValues } = useNewPage();
  const { rewardValues, setRewardValues } = useNewReward();

  return (
    <GlobalContext>
      <NewDocumentPage
        key={newPageValues?.templateId}
        titlePlaceholder='Title (required)'
        values={newPageValues}
        onChange={updateNewPageValues}
      >
        <RewardPropertiesForm
          onChange={setRewardValues}
          values={rewardValues}
          isNewReward
          isTemplate={false}
          expandedByDefault
          selectTemplate={() => {}}
        />
      </NewDocumentPage>
    </GlobalContext>
  );
}

import { Paper } from '@mui/material';
import { GlobalContext } from 'stories/lib/GlobalContext';

import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useNewReward } from 'components/rewards/hooks/useNewReward';

export default {
  title: 'Rewards/Views',
  component: RewardPropertiesForm
};
export function RewardsPage() {
  const { isDirty, clearNewPage, openNewPage, newPageValues, updateNewPageValues } = useNewPage();
  const { clearRewardValues, contentUpdated, rewardValues, setRewardValues, createReward, isSavingReward } =
    useNewReward();

  return (
    <GlobalContext>
      <Paper>
        <NewDocumentPage titlePlaceholder='Title (required)' values={newPageValues} onChange={updateNewPageValues}>
          <RewardPropertiesForm
            onChange={setRewardValues}
            values={rewardValues}
            isNewReward
            isTemplate={false}
            expandedByDefault
          />
        </NewDocumentPage>
      </Paper>
    </GlobalContext>
  );
}

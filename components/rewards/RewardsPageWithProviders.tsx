import { NewPageProvider } from 'components/common/PageDialog/hooks/useNewPage';
import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import { PageDialogGlobal } from 'components/common/PageDialog/PageDialogGlobal';
import { RewardsProvider } from 'components/rewards/hooks/useRewards';
import { RewardsBoardProvider } from 'components/rewards/hooks/useRewardsBoard';
import { RewardsPage } from 'components/rewards/RewardsPage';
import { useFeaturesAndMembers } from 'hooks/useFeaturesAndMemberProfiles';
import { setTitle } from 'hooks/usePageTitle';
import { RewardBlocksProvider } from 'hooks/useRewardBlocks';

import { ApplicationDialog } from './components/RewardApplicationDialog';
import { ApplicationDialogProvider } from './hooks/useApplicationDialog';

export function RewardsPageWithProviders() {
  const { mappedFeatures } = useFeaturesAndMembers();
  const rewardsTitle = mappedFeatures.rewards?.title || 'Rewards';
  setTitle(rewardsTitle);

  return (
    <PageDialogProvider>
      <RewardsProvider>
        <RewardBlocksProvider>
          <RewardsBoardProvider>
            <ApplicationDialogProvider>
              <RewardsPage title={rewardsTitle} />
              <ApplicationDialog />
              <PageDialogGlobal />
            </ApplicationDialogProvider>
          </RewardsBoardProvider>
        </RewardBlocksProvider>
      </RewardsProvider>
    </PageDialogProvider>
  );
}

import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import { PageDialogGlobal } from 'components/common/PageDialog/PageDialogGlobal';
import { RewardsProvider } from 'components/rewards/hooks/useRewards';
import { RewardsBoardProvider } from 'components/rewards/hooks/useRewardsBoard';
import { RewardsPage } from 'components/rewards/RewardsPage';
import { useStaticPageTitle } from 'hooks/usePageTitle';
import { RewardBlocksProvider } from 'hooks/useRewardBlocks';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

export function RewardsPageWithProviders() {
  const { mappedFeatures } = useSpaceFeatures();
  const rewardsTitle = mappedFeatures.rewards.title;
  useStaticPageTitle(rewardsTitle);

  return (
    <PageDialogProvider>
      <RewardsProvider>
        <RewardBlocksProvider>
          <RewardsBoardProvider>
            <RewardsPage title={rewardsTitle} />

            <PageDialogGlobal />
          </RewardsBoardProvider>
        </RewardBlocksProvider>
      </RewardsProvider>
    </PageDialogProvider>
  );
}

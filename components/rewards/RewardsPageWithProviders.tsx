import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import { PageDialogGlobal } from 'components/common/PageDialog/PageDialogGlobal';
import { RewardsProvider } from 'components/rewards/hooks/useRewards';
import { RewardsPage } from 'components/rewards/RewardsPage';
import { useStaticPageTitle } from 'hooks/usePageTitle';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

export function RewardsPageWithProviders() {
  const { mappedFeatures } = useSpaceFeatures();
  const rewardsTitle = mappedFeatures.rewards.title;
  useStaticPageTitle(rewardsTitle);
  return <RewardsPage title={rewardsTitle} />;
}

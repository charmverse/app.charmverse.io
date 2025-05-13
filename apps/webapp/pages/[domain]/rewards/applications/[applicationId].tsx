import { useRouter } from 'next/router';

import getPageLayout from 'components/common/PageLayout/getLayout';
import { RewardApplicationPage } from 'components/rewards/components/RewardApplicationPage/RewardApplicationPage';

export default function RewardApplicationPageComponent() {
  const router = useRouter();

  const applicationId = router.query.applicationId as string;
  const rewardId = router.query.rewardId as string;

  if (!applicationId) {
    return null;
  }

  return <RewardApplicationPage applicationId={applicationId} rewardId={rewardId} />;
}

RewardApplicationPageComponent.getLayout = getPageLayout;

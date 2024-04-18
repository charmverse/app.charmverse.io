import { useRouter } from 'next/router';

import getPageLayout from 'components/common/PageLayout/getLayout';
import { RewardApplicationPage } from 'components/rewards/components/RewardApplicationPage/RewardApplicationPage';
import { RewardApplicationPageV2 } from 'components/rewards/components/RewardApplicationPage/RewardApplicationPageV2';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';

export default function RewardApplicationPageComponent() {
  const router = useRouter();
  const isCharmverseSpace = useIsCharmverseSpace();

  const applicationId = router.query.applicationId as string;

  if (!applicationId) {
    return null;
  }

  if (isCharmverseSpace) {
    return <RewardApplicationPageV2 applicationId={applicationId} />;
  }

  // TODO - Add event type
  // useTrackPageView({ type: 'b' });
  return <RewardApplicationPage applicationId={applicationId} />;
}

RewardApplicationPageComponent.getLayout = getPageLayout;

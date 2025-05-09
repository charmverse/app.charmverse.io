import { useRouter } from 'next/router';

import getPageLayout from 'components/common/PageLayout/getLayout';
import { NewRewardPage } from 'components/rewards/NewRewardPage';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';

export default function PageView() {
  const router = useRouter();
  const isTemplate = router.query.type === 'template';
  const selectedTemplate = router.query.template as string | undefined;

  const { isSpaceMember } = useIsSpaceMember();

  if (!isSpaceMember) {
    return null;
  }

  return <NewRewardPage templateId={selectedTemplate} isTemplate={isTemplate} />;
}

PageView.getLayout = getPageLayout;

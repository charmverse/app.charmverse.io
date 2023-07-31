import { useEffect } from 'react';

import { EditorPage } from 'components/[pageId]/EditorPage/EditorPage';
import { SharedPage } from 'components/[pageId]/SharedPage/SharedPage';
import ErrorPage from 'components/common/errors/ErrorPage';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { useSpaceSubscription } from 'components/settings/subscription/hooks/useSpaceSubscription';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { usePageIdFromPath } from 'hooks/usePageFromPath';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSharedPage } from 'hooks/useSharedPage';
import { getTimeDifference } from 'lib/utilities/dates';

export default function PageView() {
  const { publicPage } = useSharedPage();
  const basePageId = usePageIdFromPath();
  const { isSpaceMember } = useIsSpaceMember();
  const { spaceSubscription } = useSpaceSubscription();
  const { openUpgradeSubscription } = useSettingsDialog();

  const freeTrialEnds =
    spaceSubscription?.status === 'free_trial'
      ? getTimeDifference(spaceSubscription?.expiresOn ?? new Date(), 'day', new Date())
      : 0;

  const subscriptionEnded = spaceSubscription?.status === 'free_trial' && freeTrialEnds === 0;

  useEffect(() => {
    if (isSpaceMember && subscriptionEnded) {
      openUpgradeSubscription();
    }
  }, [spaceSubscription?.status, spaceSubscription?.expiresOn, isSpaceMember]);

  if (!isSpaceMember && publicPage) {
    if (subscriptionEnded) {
      return <ErrorPage message='Sorry, looks like you do not have access to this page' />;
    }
    return <SharedPage publicPage={publicPage} />;
  }
  if (!basePageId) {
    return null;
  }

  return <EditorPage pageId={basePageId} />;
}

PageView.getLayout = getPageLayout;

import { useEffect } from 'react';

import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { isUUID } from 'lib/utils/strings';

export function useRewardsNavigation(idKey = 'id') {
  const { showPage, hidePage } = usePageDialog();
  const {
    router: { query },
    updateURLQuery
  } = useCharmRouter();

  const onClose = () => {
    updateURLQuery({ applicationId: null, isNewApplication: null, [idKey]: null });
  };

  useEffect(() => {
    const applicationId =
      query.applicationId && isUUID(query.applicationId as string) ? (query.applicationId as string) : undefined;
    const isNewApplication = query.applicationId === 'new';
    const pageId = query[idKey] && isUUID(query[idKey] as string) ? (query[idKey] as string) : undefined;
    if (!applicationId && !isNewApplication && !pageId) {
      hidePage();
      return;
    }
    showPage({
      // application props based on router query rather than explicit showing / hiding dialog
      applicationId,
      isNewApplication,
      pageId,
      onClose
    });
  }, [idKey, query]);
}

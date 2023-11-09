import { useEffect } from 'react';

import { useGetProposalTemplatesBySpace } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

import { useProposalCategories } from './useProposalCategories';

export function useProposalTemplates({ load } = { load: true }) {
  const { proposalCategoriesWithCreatePermission } = useProposalCategories();
  const { space } = useCurrentSpace();
  const isAdmin = useIsAdmin();
  const { subscribe } = useWebSocketClient();
  const {
    data: proposalTemplates,
    mutate,
    isLoading: isLoadingTemplates
  } = useGetProposalTemplatesBySpace(load ? space?.id : null);

  const usableTemplates = isAdmin
    ? proposalTemplates
    : proposalTemplates?.filter((template) =>
        proposalCategoriesWithCreatePermission.some((c) => c.id === template.categoryId)
      );

  useEffect(() => {
    function handleDeleteEvent(value: WebSocketPayload<'pages_deleted'>) {
      mutate(
        (templates) => {
          return templates?.filter((p) => !value.some((val) => val.id === p.id));
        },
        {
          revalidate: false
        }
      );
    }

    const unsubscribeFromPageDeletes = subscribe('pages_deleted', handleDeleteEvent);
    return () => {
      unsubscribeFromPageDeletes();
    };
  }, [mutate, subscribe]);

  return {
    proposalTemplates: usableTemplates,
    proposalTemplatePages: usableTemplates?.map((t) => t.page),
    isLoadingTemplates
  };
}

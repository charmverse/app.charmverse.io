import { useEffect } from 'react';

import { useGetRewardTemplatesBySpace } from 'charmClient/hooks/rewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

export function useRewardTemplates({ load } = { load: true }) {
  const { space } = useCurrentSpace();
  const { subscribe } = useWebSocketClient();
  const { data: templates, mutate, isLoading } = useGetRewardTemplatesBySpace(load ? space?.id : null);

  useEffect(() => {
    function handleDeleteEvent(deletedPages: WebSocketPayload<'pages_deleted'>) {
      mutate(
        (_templates) => {
          return _templates?.filter((template) => !deletedPages.some((page) => page.id === template.page.id));
        },
        {
          revalidate: false
        }
      );
    }

    function handleCreateEvent(createdPages: WebSocketPayload<'pages_created'>) {
      if (createdPages.some((page) => page.type === 'proposal_template')) {
        mutate();
      }
    }

    const unsubscribeFromPageDeletes = subscribe('pages_deleted', handleDeleteEvent);
    const unsubscribeFromPageCreated = subscribe('pages_created', handleCreateEvent);
    return () => {
      unsubscribeFromPageDeletes();
      unsubscribeFromPageCreated();
    };
  }, [mutate, subscribe]);

  return {
    templates,
    isLoading,
    refreshRewardTemplates: mutate
  };
}

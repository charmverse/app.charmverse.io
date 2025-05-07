import { useEffect } from 'react';

import { useGetProposalTemplatesBySpace } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

export function useProposalTemplates({ load = true, detailed = false }: { detailed?: boolean; load?: boolean } = {}) {
  const { space } = useCurrentSpace();
  const isAdmin = useIsAdmin();
  const [spacePermissions] = useCurrentSpacePermissions();
  const { subscribe } = useWebSocketClient();
  const {
    data: proposalTemplates,
    mutate,
    isLoading: isLoadingTemplates
  } = useGetProposalTemplatesBySpace(load ? space?.id : null, detailed);

  const usableTemplates = isAdmin || spacePermissions?.createProposals ? proposalTemplates : [];

  useEffect(() => {
    function handleDeleteEvent(value: WebSocketPayload<'pages_deleted'>) {
      mutate(
        (templates) => {
          return templates?.filter((template) => !value.some((val) => val.id === template.pageId));
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

    function handleUpdateEvent(proposals: WebSocketPayload<'proposals_updated'>) {
      mutate(
        (list) => {
          if (!list) return list;
          return list.map((template) => {
            const match = proposals.find((p) => p.id === template.proposalId);
            if (match) {
              return {
                ...template,
                archived: match.archived,
                draft: match.currentStep ? match.currentStep.step === 'draft' : template.draft
              };
            }
            return template;
          });
        },
        { revalidate: false }
      );
    }
    const unsubscribeFromPageDeletes = subscribe('pages_deleted', handleDeleteEvent);
    const unsubscribeFromPageCreated = subscribe('pages_created', handleCreateEvent);
    const unsubscribeFromProposalArchived = subscribe('proposals_updated', handleUpdateEvent);
    return () => {
      unsubscribeFromPageDeletes();
      unsubscribeFromPageCreated();
      unsubscribeFromProposalArchived();
    };
  }, [mutate, subscribe]);

  return {
    proposalTemplates: usableTemplates,
    isLoadingTemplates
  };
}

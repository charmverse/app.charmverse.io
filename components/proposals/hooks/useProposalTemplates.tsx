import { useEffect } from 'react';

import { useGetProposalTemplatesBySpace } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

export function useProposalTemplates({ load = true }: { load?: boolean } = {}) {
  const { space } = useCurrentSpace();
  const isAdmin = useIsAdmin();
  const [spacePermissions] = useCurrentSpacePermissions();
  const { subscribe } = useWebSocketClient();
  const {
    data: proposalTemplates,
    mutate,
    isLoading: isLoadingTemplates
  } = useGetProposalTemplatesBySpace(load ? space?.id : null);

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

    function handleArchivedEvent(payload: WebSocketPayload<'proposals_archived'>) {
      mutate(
        (list) => {
          if (!list) return list;
          return list.map((proposal) => {
            if (payload.proposalIds.includes(proposal.proposalId)) {
              return {
                ...proposal,
                archived: payload.archived
              };
            }
            return proposal;
          });
        },
        { revalidate: false }
      );
    }
    const unsubscribeFromPageDeletes = subscribe('pages_deleted', handleDeleteEvent);
    const unsubscribeFromPageCreated = subscribe('pages_created', handleCreateEvent);
    const unsubscribeFromProposalArchived = subscribe('proposals_archived', handleArchivedEvent);
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

import type { ProposalWithUsersLite } from '@packages/lib/proposals/getProposals';
import type { UpdateProposalRequest } from '@packages/lib/proposals/updateProposal';
import type { WebSocketPayload } from '@packages/websockets/interfaces';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import { useGetProposalsBySpace } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useWebSocketClient } from 'hooks/useWebSocketClient';

type ProposalsContextType = {
  proposals: ProposalWithUsersLite[] | undefined;
  mutateProposals: KeyedMutator<ProposalWithUsersLite[]>;
  isLoading: boolean;
  updateProposal: (proposal: Pick<UpdateProposalRequest, 'proposalId' | 'fields'>) => Promise<void>;
  proposalsMap: Record<string, ProposalWithUsersLite | undefined>;
};

export const ProposalsContext = createContext<ProposalsContextType | null>(null);

export function ProposalsProvider({ children }: { children: ReactNode }) {
  const { space } = useCurrentSpace();
  const { subscribe } = useWebSocketClient();

  const { data: proposals, mutate: mutateProposals, isLoading } = useGetProposalsBySpace({ spaceId: space?.id });

  const updateProposal: ProposalsContextType['updateProposal'] = useCallback(
    async ({ proposalId, ...updates }) => {
      await charmClient.proposals.updateProposal({ proposalId, ...updates });
      mutateProposals(
        (list) => {
          if (!list) return list;
          return list.map((proposal) => {
            if (proposal.id === proposalId) {
              return {
                ...proposal,
                ...updates
              };
            }
            return proposal;
          });
        },
        { revalidate: false }
      );
    },
    [mutateProposals]
  );

  const proposalsMap = useMemo(() => {
    const map: Record<string, ProposalWithUsersLite> = {};
    proposals?.forEach((proposal) => {
      map[proposal.id] = proposal;
    });
    return map;
  }, [proposals]);

  useEffect(() => {
    function handleArchivedEvent(updated: WebSocketPayload<'proposals_updated'>) {
      mutateProposals(
        (list) => {
          if (!list) return list;
          return list.map((proposal) => {
            const updatedMatch = updated.find((p) => p.id === proposal.id);
            if (updatedMatch) {
              return {
                ...proposal,
                archived: updatedMatch.archived ?? proposal.archived,
                currentStep: updatedMatch.currentStep ?? proposal.currentStep
              };
            }
            return proposal;
          });
        },
        { revalidate: false }
      );
    }
    function handleUpdatedEvent(updated: WebSocketPayload<'pages_meta_updated'>) {
      mutateProposals(
        (list) => {
          if (!list) return list;
          return list.map((proposal) => {
            const updatedMatch = updated.find((p) => p.id === proposal.pageId);
            if (updatedMatch) {
              return {
                ...proposal,
                title: updatedMatch.title || proposal.title
              };
            }
            return proposal;
          });
        },
        { revalidate: false }
      );
    }
    function handleDeleteEvent(deleted: WebSocketPayload<'pages_deleted'>) {
      mutateProposals(
        (list) => {
          if (!list) return list;
          return list.filter((proposal) => {
            return !deleted.some((p) => p.id === proposal.pageId);
          });
        },
        { revalidate: false }
      );
    }
    const unsubscribeFromProposalArchived = subscribe('proposals_updated', handleArchivedEvent);
    const unsubscribeFromPageUpdates = subscribe('pages_meta_updated', handleUpdatedEvent);
    const unsubscribeFromPageDeletes = subscribe('pages_deleted', handleDeleteEvent);
    return () => {
      unsubscribeFromProposalArchived();
      unsubscribeFromPageUpdates();
      unsubscribeFromPageDeletes();
    };
  }, [mutateProposals, subscribe]);

  const value = useMemo(
    () => ({
      proposals,
      mutateProposals,
      isLoading,
      updateProposal,
      proposalsMap
    }),
    [isLoading, mutateProposals, proposals, proposalsMap, updateProposal]
  );

  return <ProposalsContext.Provider value={value}>{children}</ProposalsContext.Provider>;
}

export function useProposals() {
  const context = useContext(ProposalsContext);
  if (context === null) {
    throw new Error('useProposals must be used within a ProposalsProvider');
  }
  return context;
}

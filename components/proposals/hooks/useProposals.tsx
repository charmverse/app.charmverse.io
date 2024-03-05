import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import { useGetProposalsBySpace } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { ProposalWithUsersLite } from 'lib/proposals/getProposals';
import type { UpdateProposalRequest } from 'lib/proposals/updateProposal';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

type ProposalsContextType = {
  proposals: ProposalWithUsersLite[] | undefined;
  mutateProposals: KeyedMutator<ProposalWithUsersLite[]>;
  isLoading: boolean;
  updateProposal: (proposal: UpdateProposalRequest) => Promise<void>;
  proposalsMap: Record<string, ProposalWithUsersLite | undefined>;
};

export const ProposalsContext = createContext<ProposalsContextType | null>(null);

export function ProposalsProvider({ children }: { children: ReactNode }) {
  const { space } = useCurrentSpace();
  const { subscribe } = useWebSocketClient();

  const { data: proposals, mutate: mutateProposals, isLoading } = useGetProposalsBySpace({ spaceId: space?.id });

  const updateProposal = useCallback(
    async (proposal: UpdateProposalRequest) => {
      if (proposal) {
        await charmClient.proposals.updateProposal(proposal);

        mutateProposals();
      }
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
    function handleArchivedEvent(payload: WebSocketPayload<'proposals_archived'>) {
      mutateProposals(
        (list) => {
          if (!list) return list;
          return list.map((proposal) => {
            if (payload.proposalIds.includes(proposal.id)) {
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
    const unsubscribeFromProposalArchived = subscribe('proposals_archived', handleArchivedEvent);
    return () => {
      unsubscribeFromProposalArchived();
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

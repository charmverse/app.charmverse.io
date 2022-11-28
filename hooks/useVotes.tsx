import type { UserVote } from '@prisma/client';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import useTasks from 'components/nexus/hooks/useTasks';
import type { ExtendedVote, VoteDTO, VoteTask } from 'lib/votes/interfaces';
import type { GetTasksResponse } from 'pages/api/tasks/list';

import { useCurrentSpace } from './useCurrentSpace';
import { usePages } from './usePages';
import { useUser } from './useUser';
import { useWebSocketClient } from './useWebSocketClient';

type IContext = {
  isValidating: boolean;
  isLoading: boolean;
  votes: Record<string, ExtendedVote>;
  createVote: (votePayload: Omit<VoteDTO, 'createdBy' | 'spaceId'>) => Promise<ExtendedVote>;
  castVote: (voteId: string, option: string) => Promise<UserVote>;
  deleteVote: (voteId: string) => Promise<void>;
  cancelVote: (voteId: string) => Promise<void>;
};

const VotesContext = createContext<Readonly<IContext>>({
  isValidating: true,
  isLoading: true,
  votes: {},
  castVote: () => undefined as any,
  createVote: () => undefined as any,
  deleteVote: () => undefined as any,
  cancelVote: () => undefined as any
});

export function VotesProvider({ children }: { children: ReactNode }) {
  const { currentPageId, pages } = usePages();
  const [votes, setVotes] = useState<IContext['votes']>({});
  const { user } = useUser();
  const currentSpace = useCurrentSpace();
  const { mutate: mutateTasks, tasks: userTasks } = useTasks();

  const { subscribe } = useWebSocketClient();

  useEffect(() => {
    const unsubscribeFromCreatedVotes = subscribe('votes_created', (newVotes) => {
      // Mutate the votes
      setVotes((prev) => {
        const votesToAssign = newVotes.reduce((acc, vote) => {
          // In future, we'll want to check if the vote is linked to current space.
          // For now we can depend on implicit filtering on the server, as each time we switch space we switch subscriptions.
          acc[vote.id] = vote;
          return acc;
        }, {} as Record<string, VoteTask>);

        return { ...prev, ...votesToAssign };
      });

      // Mutate the tasks
      const mutatedTasks: GetTasksResponse = userTasks ?? {
        bounties: { marked: [], unmarked: [] },
        votes: [],
        discussions: { marked: [], unmarked: [] },
        proposals: { marked: [], unmarked: [] }
      };
      newVotes.forEach((newVote) => {
        if (!mutatedTasks.votes.find((vote) => vote.id === newVote.id)) {
          mutatedTasks.votes.push(newVote);
        }
      });
      mutateTasks(mutatedTasks);
    });

    const unsubscribeFromDeletedVotes = subscribe('votes_deleted', (deletedVotes) => {
      // Mutate the votes

      setVotes((_votes) => {
        deletedVotes.forEach((vote) => {
          delete _votes[vote.id];
        });
        return { ..._votes };
      });

      // Mutate the tasks
      const mutatedTasks: GetTasksResponse = userTasks ?? {
        bounties: { marked: [], unmarked: [] },
        votes: [],
        discussions: { marked: [], unmarked: [] },
        proposals: { marked: [], unmarked: [] }
      };

      const deletedVoteIds = deletedVotes.map((vote) => vote.id);

      mutatedTasks.votes = mutatedTasks.votes.filter((taskVote) => !deletedVoteIds.includes(taskVote.id));

      mutateTasks(mutatedTasks);
    });

    const unsubscribeFromUpdatedVotes = subscribe('votes_updated', (updatedVotes) => {
      // Mutate the votes

      setVotes((_votes) => {
        updatedVotes.forEach((vote) => {
          _votes[vote.id] = vote;
        });
        return { ..._votes };
      });

      // Remove cancelled votes from tasks
      const mutatedTasks: GetTasksResponse = userTasks ?? {
        bounties: { marked: [], unmarked: [] },
        votes: [],
        discussions: { marked: [], unmarked: [] },
        proposals: { marked: [], unmarked: [] }
      };

      const cancelledVoteIds = updatedVotes.filter((v) => v.status === 'Cancelled').map((vote) => vote.id);

      mutatedTasks.votes = mutatedTasks.votes.filter((taskVote) => !cancelledVoteIds.includes(taskVote.id));

      mutateTasks(mutatedTasks);
    });

    return () => {
      unsubscribeFromCreatedVotes();
      unsubscribeFromDeletedVotes();
      unsubscribeFromUpdatedVotes();
    };
  }, []);

  const cardId = typeof window !== 'undefined' ? new URLSearchParams(window.location.href).get('cardId') : null;

  const { data, isValidating } = useSWR(
    () => (currentPageId && !cardId ? `pages/${currentPageId}/votes` : null),
    async () => charmClient.votes.getVotesByPage(currentPageId),
    {
      revalidateOnFocus: false
    }
  );

  function removeVoteFromTask(voteId: string) {
    mutateTasks(
      (tasks) => {
        return tasks
          ? {
              ...tasks,
              votes: tasks.votes.filter((_vote) => _vote.id !== voteId)
            }
          : undefined;
      },
      {
        revalidate: false
      }
    );
  }

  async function castVote(voteId: string, choice: string) {
    const userVote = await charmClient.votes.castVote(voteId, choice);
    if (currentPageId) {
      setVotes((_votes) => {
        const vote = _votes[voteId];
        if (vote && user) {
          const currentChoice = vote.userChoice;
          vote.userChoice = choice;
          if (currentChoice) {
            vote.aggregatedResult[currentChoice] -= 1;
          } else {
            vote.totalVotes += 1;
          }
          vote.aggregatedResult[choice] += 1;
          _votes[voteId] = {
            ...vote
          };
        }
        return { ..._votes };
      });
    }
    removeVoteFromTask(voteId);
    return userVote;
  }

  async function createVote(votePayload: Omit<VoteDTO, 'createdBy' | 'spaceId'>): Promise<ExtendedVote> {
    if (!user || !currentSpace) {
      throw new Error('Missing user or space');
    }

    const extendedVote = await charmClient.votes.createVote({
      ...votePayload,
      createdBy: user.id,
      spaceId: currentSpace.id
    });

    setVotes({
      ...votes,
      [extendedVote.id]: extendedVote
    });
    return extendedVote;
  }

  async function deleteVote(voteId: string) {
    const vote = votes[voteId];
    if (vote.context === 'inline') {
      await charmClient.votes.deleteVote(voteId);
      if (currentPageId) {
        delete votes[voteId];
        setVotes({ ...votes });
      }
      removeVoteFromTask(voteId);
    }
  }

  async function cancelVote(voteId: string) {
    const vote = votes[voteId];
    if (vote.context === 'inline') {
      await charmClient.votes.cancelVote(voteId);
      if (currentPageId) {
        votes[voteId] = {
          ...votes[voteId],
          status: 'Cancelled'
        };
        setVotes({ ...votes });
      }
      removeVoteFromTask(voteId);
    }
  }

  useEffect(() => {
    setVotes(data?.reduce((acc, voteWithUser) => ({ ...acc, [voteWithUser.id]: voteWithUser }), {}) || {});
  }, [data]);

  const value: IContext = useMemo(
    () => ({
      votes,
      isValidating,
      isLoading: !data,
      castVote,
      createVote,
      deleteVote,
      cancelVote
    }),
    [currentPageId, votes, isValidating]
  );

  return <VotesContext.Provider value={value}>{children}</VotesContext.Provider>;
}

export const useVotes = () => useContext(VotesContext);

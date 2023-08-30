import type { UserVote } from '@charmverse/core/prisma';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useTasks } from 'components/nexus/hooks/useTasks';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { ExtendedVote, VoteDTO } from 'lib/votes/interfaces';
import type { GetTasksResponse } from 'pages/api/tasks/list';

import { useUser } from './useUser';
import { useWebSocketClient } from './useWebSocketClient';

type ParentData = {
  pageId?: string;
  postId?: string;
};

type IContext = {
  isValidating: boolean;
  isLoading: boolean;
  setParent: (parent: ParentData | null) => void;
  votes: Record<string, ExtendedVote>;
  createVote: (votePayload: Omit<VoteDTO, 'createdBy' | 'spaceId' | 'description'>) => Promise<ExtendedVote>;
  castVote: (voteId: string, option: string | string[]) => Promise<UserVote>;
  deleteVote: (voteId: string) => Promise<void>;
  cancelVote: (voteId: string) => Promise<void>;
  updateDeadline: (voteId: string, deadline: Date) => Promise<void>;
};

const EMPTY_TASKS: GetTasksResponse = {
  bounties: { marked: [], unmarked: [] },
  votes: { marked: [], unmarked: [] },
  discussions: { marked: [], unmarked: [] },
  proposals: { marked: [], unmarked: [] },
  forum: { marked: [], unmarked: [] }
};

const VotesContext = createContext<Readonly<IContext>>({
  isValidating: true,
  isLoading: true,
  votes: {},
  setParent: () => undefined,
  castVote: () => undefined as any,
  createVote: () => undefined as any,
  deleteVote: () => undefined as any,
  cancelVote: () => undefined as any,
  updateDeadline: () => undefined as any
});

export function VotesProvider({ children }: { children: ReactNode }) {
  const [parent, setParent] = useState<{ pageId?: string; postId?: string } | null>(null);
  const [votes, setVotes] = useState<IContext['votes']>({});
  const { user } = useUser();
  const { space: currentSpace } = useCurrentSpace();
  const [isLoading, setIsLoading] = useState(true);
  const { mutate: mutateTasks, tasks: userTasks } = useTasks();

  const { subscribe } = useWebSocketClient();

  useEffect(() => {
    const unsubscribeFromCreatedVotes = subscribe('votes_created', (newVotes) => {
      // Mutate the votes
      setVotes((prev) => {
        const votesToAssign = newVotes.reduce((acc, vote) => {
          // In future, we'll want to check if the vote is linked to current space.
          // For now we can depend on implicit filtering on the server, as each time we switch space we switch subscriptions
          const createdBy = typeof vote.createdBy === 'string' ? vote.createdBy : vote.createdBy?.id || '';
          acc[vote.id] = { ...vote, createdBy };

          return acc;
        }, {} as Record<string, ExtendedVote>);

        return { ...prev, ...votesToAssign };
      });

      // Mutate the tasks
      const mutatedTasks: GetTasksResponse = userTasks ?? EMPTY_TASKS;
      newVotes.forEach((newVote) => {
        if (!mutatedTasks.votes.unmarked.find((vote) => vote.id === newVote.id)) {
          mutatedTasks.votes.unmarked.push(newVote);
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
      const mutatedTasks: GetTasksResponse = userTasks ?? EMPTY_TASKS;

      const deletedVoteIds = deletedVotes.map((vote) => vote.id);

      mutatedTasks.votes = {
        marked: mutatedTasks.votes.marked.filter((taskVote) => !deletedVoteIds.includes(taskVote.id)),
        unmarked: mutatedTasks.votes.unmarked.filter((taskVote) => !deletedVoteIds.includes(taskVote.id))
      };

      mutateTasks(mutatedTasks);
    });

    const unsubscribeFromUpdatedVotes = subscribe('votes_updated', (updatedVotes) => {
      // Mutate the votes

      setVotes((_votes) => {
        updatedVotes.forEach((vote) => {
          if (vote) {
            _votes[vote.id] = vote;
          }
        });
        return { ..._votes };
      });

      // Remove cancelled votes from tasks
      const mutatedTasks: GetTasksResponse = userTasks ?? EMPTY_TASKS;

      const cancelledVoteIds = updatedVotes.filter((v) => v.status === 'Cancelled').map((vote) => vote.id);

      mutatedTasks.votes = {
        marked: mutatedTasks.votes.marked.filter((taskVote) => !cancelledVoteIds.includes(taskVote.id)),
        unmarked: mutatedTasks.votes.unmarked.filter((taskVote) => !cancelledVoteIds.includes(taskVote.id))
      };

      mutateTasks(mutatedTasks);
    });

    return () => {
      unsubscribeFromCreatedVotes();
      unsubscribeFromDeletedVotes();
      unsubscribeFromUpdatedVotes();
    };
  }, []);

  const { data, isValidating } = useSWR(
    () => (parent ? `pages/${parent.pageId || parent.postId}/votes` : null),
    async () => charmClient.votes.getVotesByPage(parent!),
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
              votes: {
                unmarked: tasks.votes.unmarked.filter((_vote) => _vote.id !== voteId),
                marked: tasks.votes.marked.filter((_vote) => _vote.id !== voteId)
              }
            }
          : undefined;
      },
      {
        revalidate: false
      }
    );
  }

  async function castVote(voteId: string, choice: string | string[]) {
    const updatedChoice = Array.isArray(choice) ? choice : [choice];
    const userVote = await charmClient.votes.castVote(voteId, updatedChoice);

    setVotes((_votes) => {
      const vote = { ..._votes[voteId] };
      if (vote && user) {
        const currentChoice = vote.userChoice;
        if (currentChoice?.length) {
          // Remove previous choices
          currentChoice.forEach((c) => {
            vote.aggregatedResult[c] -= 1;
          });
        } else {
          vote.totalVotes += 1;
        }

        vote.userChoice = updatedChoice;

        if (updatedChoice.length > 0) {
          // Add new choices
          updatedChoice.forEach((c) => {
            vote.aggregatedResult[c] += 1;
          });
        } else if (currentChoice && currentChoice.length) {
          // User deselected all previous choices
          vote.totalVotes = vote.totalVotes > 0 ? vote.totalVotes - 1 : 0;
        }

        _votes[voteId] = vote;
      }

      return { ..._votes };
    });
    removeVoteFromTask(voteId);
    return userVote;
  }

  async function createVote(
    votePayload: Omit<VoteDTO, 'createdBy' | 'spaceId' | 'description'>
  ): Promise<ExtendedVote> {
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
      setVotes((prevVotes) => {
        const _votes = { ...prevVotes };
        delete _votes[voteId];
        return _votes;
      });
      removeVoteFromTask(voteId);
    }
  }

  async function cancelVote(voteId: string) {
    const vote = votes[voteId];
    if (vote.context === 'inline') {
      await charmClient.votes.updateVote(voteId, { status: 'Cancelled' });
      setVotes((prevVotes) => ({ ...prevVotes, [voteId]: { ...prevVotes[voteId], status: 'Cancelled' } }));
      removeVoteFromTask(voteId);
    }
  }

  async function updateDeadline(voteId: string, deadline: Date) {
    await charmClient.votes.updateVote(voteId, { deadline });
    setVotes((prevVotes) => ({ ...prevVotes, [voteId]: { ...prevVotes[voteId], deadline } }));
  }

  useEffect(() => {
    setVotes(data?.reduce((acc, voteWithUser) => ({ ...acc, [voteWithUser.id]: voteWithUser }), {}) || {});
    if (data) {
      setIsLoading(false);
    }
  }, [data]);

  const value: IContext = useMemo(
    () => ({
      votes,
      isValidating,
      isLoading,
      castVote,
      createVote,
      deleteVote,
      cancelVote,
      updateDeadline,
      setParent
    }),
    [votes, isValidating]
  );

  return <VotesContext.Provider value={value}>{children}</VotesContext.Provider>;
}

export const useVotes = (parent: ParentData) => {
  const votes = useContext(VotesContext);

  useEffect(() => {
    if (!parent.postId && !parent.pageId) {
      votes.setParent(null);
    } else {
      votes.setParent(parent);
    }
  }, [parent.postId, parent.pageId]);

  return votes;
};

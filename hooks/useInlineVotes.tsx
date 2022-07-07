import charmClient from 'charmClient';
import useTasks from 'components/nexus/hooks/useTasks';
import { ExtendedVote, VoteDTO } from 'lib/votes/interfaces';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { VoteStatus, VoteType } from '@prisma/client';
import { useCurrentSpace } from './useCurrentSpace';
import { usePages } from './usePages';
import { useUser } from './useUser';

type IContext = {
  isValidating: boolean,
  inlineVotes: Record<string, ExtendedVote>
  createVote: (votePayload: Omit<VoteDTO, 'createdBy' | 'spaceId'>) => Promise<ExtendedVote>,
  castVote: (voteId: string, option: string) => Promise<void>
  deleteVote: (voteId: string) => Promise<void>,
  cancelVote: (voteId: string) => Promise<void>,
};

export const InlineVotesContext = createContext<Readonly<IContext>>({
  isValidating: true,
  inlineVotes: {},
  castVote: () => undefined as any,
  createVote: () => undefined as any,
  deleteVote: () => undefined as any,
  cancelVote: () => undefined as any
});

export function InlineVotesProvider ({ children }: { children: ReactNode }) {
  const { currentPageId, pages } = usePages();
  const [inlineVotes, setInlineVotes] = useState<IContext['inlineVotes']>({});
  const [user] = useUser();

  const cardId = typeof window !== 'undefined' ? (new URLSearchParams(window.location.href)).get('cardId') : null;

  const { data, isValidating } = useSWR(() => currentPageId && !cardId ? `pages/${currentPageId}/inline-votes` : null, async () => {
    const fetchedInlineVotes = await charmClient.getVotesByPage(currentPageId);
    return fetchedInlineVotes.map(fetchedInlineVote => {
      const userVoteFrequencyRecord = fetchedInlineVote.userVotes.reduce<Record<string, number>>((currentRecord, userVote) => {
        if (!currentRecord[userVote.choice]) {
          currentRecord[userVote.choice] = 1;
        }
        else {
          currentRecord[userVote.choice] += 1;
        }
        return currentRecord;
      }, {});

      const totalVotes = fetchedInlineVote.userVotes.length;
      const threshold = fetchedInlineVote.threshold;
      const status = fetchedInlineVote.status;

      if (status !== 'Cancelled' && new Date(fetchedInlineVote.deadline) < new Date()) {
        if (fetchedInlineVote.type === VoteType.Approval) {
          fetchedInlineVote.status = ((userVoteFrequencyRecord.Yes * 100) / totalVotes) >= threshold ? VoteStatus.Passed : VoteStatus.Rejected;
        } // If any of the option passed the threshold amount
        else if (Object.values(userVoteFrequencyRecord).some(voteCount => ((voteCount / totalVotes) * 100) >= threshold)) {
          fetchedInlineVote.status = VoteStatus.Passed;
        }
        else {
          fetchedInlineVote.status = VoteStatus.Rejected;
        }
      }
      return fetchedInlineVote;
    });
  });

  const [currentSpace] = useCurrentSpace();
  const { mutate: mutateTasks } = useTasks();

  async function castVote (voteId: string, choice: string) {
    const userVote = await charmClient.castVote(voteId, choice);
    setInlineVotes((_inlineVotes) => {
      const vote = _inlineVotes[voteId];
      if (vote && user) {
        const existingUserVote = vote.userVotes.find(_userVote => _userVote.userId === user.id);
        if (existingUserVote) {
          existingUserVote.choice = choice;
          existingUserVote.updatedAt = new Date();
        }
        // Vote casted for the first time
        else {
          vote.userVotes.unshift({
            ...userVote,
            user
          });
          mutateTasks((tasks) => {
            return tasks ? {
              ...tasks,
              votes: tasks.votes.filter(_vote => _vote.id !== voteId)
            } : undefined;
          }, {
            revalidate: false
          });
        }
        _inlineVotes[voteId] = {
          ...vote
        };
      }
      return { ..._inlineVotes };
    });
  }

  async function createVote (votePayload: Omit<VoteDTO, 'createdBy' | 'spaceId'>): Promise<ExtendedVote> {
    const extendedVote = await charmClient.createVote({
      ...votePayload,
      createdBy: user!.id,
      pageId: cardId ?? currentPageId,
      spaceId: currentSpace!.id
    });

    mutateTasks((tasks) => {
      // Add the vote to the task
      if (tasks) {
        tasks.votes.push({
          ...extendedVote,
          space: currentSpace!,
          page: pages[currentPageId]!
        });
      }
      return tasks;
    }, {
      revalidate: false
    });
    setInlineVotes({
      ...inlineVotes,
      [extendedVote.id]: {
        ...extendedVote,
        userVotes: []
      }
    });
    return extendedVote;
  }

  async function deleteVote (voteId: string) {
    await charmClient.deleteVote(voteId);
    delete inlineVotes[voteId];
    setInlineVotes({ ...inlineVotes });
  }

  async function cancelVote (voteId: string) {
    await charmClient.cancelVote(voteId);
    inlineVotes[voteId] = {
      ...inlineVotes[voteId],
      status: 'Cancelled'
    };
    setInlineVotes({ ...inlineVotes });
  }

  useEffect(() => {
    setInlineVotes(data?.reduce((acc, voteWithUser) => ({ ...acc, [voteWithUser.id]: voteWithUser }), {}) || {});
  }, [data]);

  const value: IContext = useMemo(() => ({
    inlineVotes,
    isValidating,
    castVote,
    createVote,
    deleteVote,
    cancelVote
  }), [currentPageId, inlineVotes, isValidating]);

  return (
    <InlineVotesContext.Provider value={value}>
      {children}
    </InlineVotesContext.Provider>
  );
}

export const useInlineVotes = () => useContext(InlineVotesContext);

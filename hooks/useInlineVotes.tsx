import { User } from '@prisma/client';
import charmClient from 'charmClient';
import { VoteWithUsers } from 'lib/inline-votes/interfaces';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { v4 } from 'uuid';
import { usePages } from './usePages';
import { useUser } from './useUser';

type IContext = {
  isValidating: boolean,
  inlineVotes: Record<string, VoteWithUsers>
  castVote: (voteId: string, option: string) => Promise<void>
  createVote: (votePayload: Pick<VoteWithUsers, 'title' | 'deadline' | 'description' | 'options' | 'pageId' | 'threshold'>) => Promise<VoteWithUsers>,
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
  const { currentPageId } = usePages();

  const [inlineVotes, setInlineVotes] = useState<IContext['inlineVotes']>({});
  const [user] = useUser();
  const { data, isValidating } = useSWR(() => currentPageId ? `pages/${currentPageId}/inline-votes` : null, () => charmClient.getPageInlineVotesWithUsers(currentPageId));

  async function castVote (voteId: string, choice: string) {
    // TODO: Implement & Call charmClient function
    setInlineVotes((_inlineVotes) => {
      const vote = _inlineVotes[voteId];
      if (vote && user) {
        const userVote = vote.userVotes.find(_userVote => _userVote.userId === user.id);
        if (userVote) {
          userVote.choice = choice;
        }
        else {
          vote.userVotes.push({
            choice,
            // TODO: Remove any
            user: user as any,
            userId: user.id,
            voteId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        _inlineVotes[voteId] = {
          ...vote
        };
      }
      return { ..._inlineVotes };
    });
  }

  async function createVote (votePayload: Pick<VoteWithUsers, 'title' | 'deadline' | 'description' | 'options' | 'pageId' | 'threshold'>): Promise<VoteWithUsers> {
    // TODO: Implement & Call charmClient function
    const voteId = v4();
    const vote = {
      ...votePayload,
      id: voteId,
      userVotes: [],
      initiatorId: user!.id,
      createdAt: new Date(),
      status: 'InProgress'
    } as VoteWithUsers;

    setInlineVotes({
      ...inlineVotes,
      [voteId]: vote
    });
    return vote;
  }

  async function deleteVote (voteId: string) {
    // TODO: Implement & Call charmClient function
    delete inlineVotes[voteId];
    setInlineVotes({ ...inlineVotes });
  }

  async function cancelVote (voteId: string) {
    // TODO: Implement & Call charmClient function
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

import charmClient from 'charmClient';
import { VoteWithUsers } from 'lib/inline-votes/interfaces';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { usePages } from './usePages';

type IContext = {
  isValidating: boolean,
  inlineVotes: Record<string, VoteWithUsers>
};

export const InlineVotesContext = createContext<Readonly<IContext>>({
  isValidating: true,
  inlineVotes: {}
});

export function InlineVotesProvider ({ children }: { children: ReactNode }) {
  const { currentPageId } = usePages();

  const [inlineVotes, setInlineVotes] = useState<IContext['inlineVotes']>({});

  const { data, isValidating } = useSWR(() => currentPageId ? `pages/${currentPageId}/inline-votes` : null, () => charmClient.getPageInlineVotesWithUsers(currentPageId));

  useEffect(() => {
    setInlineVotes(data?.reduce((acc, voteWithUser) => ({ ...acc, [voteWithUser.id]: voteWithUser }), {}) || {});
  }, [data]);

  const value: IContext = useMemo(() => ({
    inlineVotes,
    isValidating
  }), [currentPageId, inlineVotes, isValidating]);

  return (
    <InlineVotesContext.Provider value={value}>
      {children}
    </InlineVotesContext.Provider>
  );
}

export const useInlineVotes = () => useContext(InlineVotesContext);

import React, { ReactElement, useReducer, useMemo, useContext } from 'react';

import { findIndex } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import type { IBountyCard } from 'models/Bounty';

const BountyContext = React.createContext<any | null>(null);

interface BountyProviderProps {
  children: React.ReactNode;
}

const buildMockData = (
  id: string,
  title: string,
  author: string,
  status: 'pending' | 'inprogress' | 'done',
  type: 'content' | 'social',
  content: Object,
  createdAt: Date
): IBountyCard => ({
  title,
  author,
  status,
  type,
  id,
  content,
  createdAt
});

const initialBountyState = {
  bounties: [1, 2, 3, 4, 5].map((index) => buildMockData(
    uuidv4(),
    `Card title ${index}`,
    'Author',
    index % 2 === 0 ? 'pending' : 'inprogress',
    index % 3 === 0 ? 'content' : 'social',
    { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
    new Date('2/10/2022')
  ))
};

function bountyReducer (state: any, action: any) {
  switch (action.type) {
    case 'UPDATE_BOUNTY': {
      // xtungvo TODO: improve not to use robust approach later
      const updatingBounties = [...state.bounties];
      const index = findIndex(state.bounties, { id: action.iemId });
      updatingBounties.splice(index, 1, action.item);

      return {
        bounties: updatingBounties
      };
    }
    default:
      throw new Error();
  }
}

export function BountyProvider (props: BountyProviderProps): ReactElement {
  const [state, dispatch] = useReducer(bountyReducer, initialBountyState);
  const contextValue = useMemo(
    () => ({
      bounties: state.bounties,
      addBounty: (bounty: any) => {
        dispatch({ type: 'UPDATE_BOUNTY', itemId: bounty.id, item: bounty });
      }
    }),
    [state, dispatch]
  );
  const { children } = props;

  return <BountyContext.Provider value={contextValue}>{children}</BountyContext.Provider>;
}

export const useBounty = () => useContext(BountyContext);

import React, { ReactElement, useReducer, useMemo, useContext } from 'react';

import { findIndex } from 'lodash';

import type { Bounty } from 'models/Bounty';

export interface BountyAction {
  type: string;
  item?: Bounty;
  itemId?: string;
}

interface IBountyContext {
  bounties: Bounty[];
  addBounty: (bounty: Bounty) => void;
  updateBounty: (bounty: Bounty) => void;
}
const BountyContext = React.createContext<IBountyContext>({
  bounties: [],
  addBounty: (bounty) => undefined,
  updateBounty: (bounty) => undefined
});

interface BountyProviderProps {
  children: React.ReactNode;
}

const initialBountyState = {
  bounties: []
};

function bountyReducer (state: any, action: BountyAction) {
  switch (action.type) {
    case 'ADD_BOUNTY': {
      return {
        bounties: [...state.bounties, action.item]
      };
    }
    case 'UPDATE_BOUNTY': {
      // xtungvo TODO: improve not to use robust approach later
      const updatingBounties = [...state.bounties];
      const index = findIndex(state.bounties, { id: action.itemId });
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
      addBounty: (bounty: Bounty) => {
        dispatch({ type: 'ADD_BOUNTY', item: bounty });
      },
      updateBounty: (bounty: Bounty) => {
        dispatch({ type: 'UPDATE_BOUNTY', itemId: bounty.id, item: bounty });
      }
    }),
    [state, dispatch]
  );
  const { children } = props;

  return <BountyContext.Provider value={contextValue}>{children}</BountyContext.Provider>;
}

export const useBounty = () => useContext(BountyContext);

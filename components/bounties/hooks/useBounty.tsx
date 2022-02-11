import React, { ReactElement, useReducer, useMemo, useContext } from 'react';

import { findIndex } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import type { IBountyAction } from 'models/Bounty';

const BountyContext = React.createContext<any | null>(null);

interface BountyProviderProps {
  children: React.ReactNode;
}

const initialBountyState = {
  bounties: []
};

function bountyReducer (state: any, action: IBountyAction) {
  switch (action.type) {
    case 'ADD_BOUNTY': {
      const updatingBounties = [...state.bounties, action.item];
      return {
        bounties: updatingBounties
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
      addBounty: (bounty: any) => {
        dispatch({ type: 'ADD_BOUNTY', item: bounty });
      },
      updateBounty: (bounty: any) => {
        dispatch({ type: 'UPDATE_BOUNTY', itemId: uuidv4(), item: bounty });
      }
    }),
    [state, dispatch]
  );
  const { children } = props;

  return <BountyContext.Provider value={contextValue}>{children}</BountyContext.Provider>;
}

export const useBounty = () => useContext(BountyContext);

import React, { ReactElement, useReducer, useMemo, useContext } from 'react';

import { findIndex } from 'lodash';

const BountyContext = React.createContext<any | null>(null);

interface BountyProviderProps {
  children: React.ReactNode
}
const initialBountyState = {
  bounties: [{ content: { type: 'doc', content: [{ type: 'paragraph', content: [] }] }, author: 'Author', createdAt: '2/10/2022', description: 'description placeholder', title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', status: 'Not Started', type: 'Content', id: 1 },
    { author: 'Author', createdAt: '2/10/2022', description: 'description placeholder', title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content', id: 2 },
    { author: 'Author', createdAt: '2/10/2022', description: 'description placeholder', title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content', id: 3 },
    { author: 'Author', createdAt: '2/10/2022', description: 'description placeholder', title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content', id: 4 },
    { author: 'Author', createdAt: '2/10/2022', description: 'description placeholder', title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content', id: 5 }]
};

function bountyReducer (state: any, action: any) {
  switch (action.type) {
    case 'UPDATE_BOUNTY':
    {
      // xtungvo TODO: improve not to use robust approach later
      const updatingBounties = [...state.bounties];
      const index = findIndex(state.bounties, { id: action.iemId });
      updatingBounties.splice(index, 1, action.item);

      return {
        bounties: updatingBounties
      };
    }
    default: throw new Error();
  }
}

export function BountyProvider (props: BountyProviderProps): ReactElement {

  const [state, dispatch] = useReducer(bountyReducer, initialBountyState);
  const contextValue = useMemo(() => ({
    bounties: state.bounties,
    addBounty: (bounty: any) => {
      const buildAction = () => (
        { type: 'UPDATE_BOUNTY', itemId: bounty.id, item: bounty }
      );
      dispatch(buildAction());
    }

  }), [state, dispatch]);
  const { children } = props;

  return (
    <BountyContext.Provider value={contextValue}>
      {children}
    </BountyContext.Provider>
  );
}

export const useBounty = () => useContext(BountyContext);

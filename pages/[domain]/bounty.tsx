import { PageLayout } from 'components/common/page-layout';
import BountyCard from 'components/bounty/BountyCard';
import BountyTable from 'components/bounty/BountyTable';
import BountyEditorModal from 'components/bounty/BountyEditorModal';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { findIndex } from 'lodash';

import React, { ReactElement, useReducer, useState, useCallback, useMemo, useContext } from 'react';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';

// xtungvo TODO: refactor code to separate file
const initialSuggestionState = { suggestedBounties: [] };
const initialBountyState = {
  bounties: [{ content: { type: 'doc', content: [{ type: 'paragraph', content: [] }] }, author: 'Author', createdAt: '2/10/2022', description: 'description placeholder', title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', status: 'Not Started', type: 'Content', id: 1 },
    { author: 'Author', createdAt: '2/10/2022', description: 'description placeholder', title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content', id: 2 },
    { author: 'Author', createdAt: '2/10/2022', description: 'description placeholder', title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content', id: 3 },
    { author: 'Author', createdAt: '2/10/2022', description: 'description placeholder', title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content', id: 4 },
    { author: 'Author', createdAt: '2/10/2022', description: 'description placeholder', title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content', id: 5 }]
};

function suggestionReducer (state: any, action: any) {
  switch (action.type) {
    case 'ADD_SUGGESTED_BOUNTY':
      return {
        suggestedBounties: [...state.suggestedBounties, action.item]
      };
    default: throw new Error();
  }
}

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

const BountyContext = React.createContext<any | null>(null);
const SuggestionContext = React.createContext<any | null>(null);

interface BountyProviderProps {
  children: React.ReactNode
}
function BountyProvider (props: BountyProviderProps): ReactElement {

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

function SuggestionProvider (props: { children: React.ReactNode }): ReactElement {
  const [state, dispatch] = useReducer(suggestionReducer, initialSuggestionState);
  const contextValue = useMemo(() => ({
    suggestedBounties: state.suggestedBounties,
    addBounty: (bounty: any) => {
      console.log('objeczzzzzzt', bounty);
      const buildAction = () => (
        { type: 'ADD_SUGGESTED_BOUNTY', item: { id: Math.random(), ...bounty } }
      );
      dispatch(buildAction());
    }

  }), [state, dispatch]);
  const { children } = props;
  return (
    <SuggestionContext.Provider value={contextValue}>
      {children}
    </SuggestionContext.Provider>
  );
}
function BountyContainer (): ReactElement {
  const { bounties } = useContext(BountyContext);
  return (
    <Grid container direction='row' spacing={3} sx={{ padding: '16px' }}>
      {bounties.map((bounty: any) => (
        <Grid item key={bounty.id}>
          {/* // xtungvo TODO: update to handle action for editing bounty */}
          <BountyCard {...bounty} />
        </Grid>
      ))}
    </Grid>
  );
}
function SuggestionContainer (): ReactElement {
  const { suggestedBounties, addBounty } = useContext(SuggestionContext);
  const [bountyDialogOpen, setBountyDialogOpen] = useState(false);
  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'row' }}>
        <Typography>Suggestions</Typography>
        <Button onClick={() => {
          setBountyDialogOpen(true);
        }}
        >
          Suggest (+)
        </Button>
      </Box>
      <BountyTable items={suggestedBounties} />
      <BountyEditorModal
        open={bountyDialogOpen}
        onClose={() => {
          setBountyDialogOpen(false);
        }}
        onSubmit={(bounty) => {
          addBounty(bounty); setBountyDialogOpen(false);
        }}
      />
    </>
  );
}
export default function BountyPage () {
  return (
    <>
      <BountyProvider>
        <BountyContainer />
      </BountyProvider>
      <SuggestionProvider>
        <SuggestionContainer />
      </SuggestionProvider>
    </>

  );
}

BountyPage.getLayout = (page: ReactElement) => {
  return <PageLayout>{page}</PageLayout>;
};

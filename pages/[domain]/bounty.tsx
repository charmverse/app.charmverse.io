import { PageLayout } from 'components/common/page-layout';
import BountyCard from 'components/bounty/BountyCard';
import BountyTable from 'components/bounty/BountyTable';
import BountyEditorModal from 'components/bounty/BountyEditorModal';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { findIndex } from 'lodash';

import { ReactElement, useReducer, useState } from 'react';
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

export default function BountyPage () {
  // reducers
  const [suggestionState, dispatchSuggestion] = useReducer(suggestionReducer, initialSuggestionState);
  const [bountyState, dispatchBounty] = useReducer(bountyReducer, initialBountyState);
  const { suggestedBounties } = suggestionState;
  const { bounties } = bountyState;

  const [bountyDialogOpen, setBountyDialogOpen] = useState(false);

  const submitSuggestion = (suggestingBounty: any) => {
    const buildAction = () => (
      { type: 'ADD_SUGGESTED_BOUNTY', item: { id: Math.random(), ...suggestingBounty } }
    );
    dispatchSuggestion(buildAction());
  };
  return (
    <>
      <Grid container direction='row' spacing={3} sx={{ padding: '16px' }}>
        {bounties.map((card) => (
          <Grid item key={card.id}>
            {/* // xtungvo TODO: update to handle action for editing card */}
            <BountyCard {...card} />
          </Grid>
        ))}
      </Grid>
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
      {/* // xtungvo TODO: update component name to match with the responding modal for creating/editing bounty */}
      <BountyEditorModal
        open={bountyDialogOpen}
        onClose={() => {
          setBountyDialogOpen(false);
        }}
        onSubmit={submitSuggestion}
      />
    </>
  );
}

BountyPage.getLayout = (page: ReactElement) => {
  return <PageLayout>{page}</PageLayout>;
};

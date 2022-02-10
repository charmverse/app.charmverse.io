import { PageLayout } from 'components/common/page-layout';
import BountyCard from 'components/bounty/BountyCard';
import BountyTable from 'components/bounty/BountyTable';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';

import { ReactElement, useReducer } from 'react';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';

const initialSuggestionState = { suggestedBounties: [] };

function suggestionReducer (state: any, action: any) {
  switch (action.type) {
    case 'ADD_SUGGESTED_BOUNTY':
      return {
        suggestedBounties: [...state.suggestedBounties, action.item]
      };
    default: throw new Error();
  }
}

export default function BountyPage () {
  const mockCards = [
    { author: 'Author', createdAt: '2/10/2022', description: 'description placeholder', title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', status: 'Not Started', type: 'Content', id: 1 },
    { author: 'Author', createdAt: '2/10/2022', description: 'description placeholder', title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content', id: 2 },
    { author: 'Author', createdAt: '2/10/2022', description: 'description placeholder', title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content', id: 3 },
    { author: 'Author', createdAt: '2/10/2022', description: 'description placeholder', title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content', id: 4 },
    { author: 'Author', createdAt: '2/10/2022', description: 'description placeholder', title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content', id: 5 }
  ];

  const [suggestionState, dispatchSuggestion] = useReducer(suggestionReducer, initialSuggestionState);
  const { suggestedBounties } = suggestionState;
  return (
    <>
      <Grid container direction='row' spacing={3} sx={{ padding: '16px' }}>
        {mockCards.map((card) => (
          <Grid item key={card.id}>
            <BountyCard {...card} />
          </Grid>
        ))}
      </Grid>
      <Box sx={{ display: 'flex', flexDirection: 'row' }}>
        <Typography>Suggestions</Typography>
        <Button onClick={() => {
          const buildAction = () => (
            { type: 'ADD_SUGGESTED_BOUNTY', item: { id: Math.random(), author: 'Author', createdAt: new Date(), description: 'description placeholder', title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content' } }
          );
          dispatchSuggestion(buildAction());
        }}
        >
          Suggest (+)
        </Button>
      </Box>
      <BountyTable items={suggestedBounties} />
    </>
  );
}

BountyPage.getLayout = (page: ReactElement) => {
  return <PageLayout>{page}</PageLayout>;
};

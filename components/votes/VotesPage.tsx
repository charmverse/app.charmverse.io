import { Box, Grid, Typography } from '@mui/material';
import { useReducer, Reducer } from 'react';
import useSWR from 'swr';
import { VoteStatus } from '@prisma/client';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import charmClient from 'charmClient';
import { ViewOptions, VoteSort, VoteFilter, sortVotes, filterVotes } from 'components/[pageId]/DocumentPage/components/VotesSidebar';
import VotesTable from './components/VotesTable';
import CreateProposal from './components/Proposal/CreateProposal';

export interface ViewState {
  sortBy: VoteSort;
  filterBy: VoteFilter;
  visibleStatuses: VoteStatus[];
}

const defaultViewState: ViewState = {
  sortBy: 'latest_deadline',
  filterBy: 'in_progress',
  visibleStatuses: ['InProgress', 'Passed', 'Rejected']
};

type ViewStateReducer = Reducer<ViewState, Partial<ViewState>>;

export default function VotesPage () {

  const [viewState, setViewState] = useReducer<ViewStateReducer>((state, updates) => ({ ...state, ...updates }), defaultViewState);

  const [currentSpace] = useCurrentSpace();
  const { data } = useSWR(() => `votesBySpace/${currentSpace?.id}`, () => currentSpace ? charmClient.getVotesBySpace(currentSpace.id) : []);

  const filteredVotes = data ? filterVotes(data, viewState.filterBy) : undefined;
  const sortedVotes = filteredVotes ? sortVotes(filteredVotes, viewState.sortBy) : undefined;

  function setVoteSort (sortBy: VoteSort) {
    setViewState({ sortBy });
  }

  function setVoteFilter (filterBy: VoteFilter) {
    setViewState({ filterBy });
  }

  return (
    <CenteredPageContent>
      <Grid container mb={6}>
        <Grid item xs>
          <Typography variant='h1' gutterBottom>
            <strong>Votes</strong>
          </Typography>
        </Grid>
        <Grid xs={12} lg={8} display='flex'>
          <Box display='flex' gap={3} sx={{ width: '100%', justifyContent: { xs: 'flex-start', lg: 'flex-end' }, flexDirection: { xs: 'column-reverse', lg: 'row' } }}>
            <ViewOptions voteSort={viewState.sortBy} voteFilter={viewState.filterBy} setVoteSort={setVoteSort} setVoteFilter={setVoteFilter} />
            <CreateProposal />
          </Box>
        </Grid>
      </Grid>
      <VotesTable votes={data ? sortedVotes : undefined} />
    </CenteredPageContent>
  );
}

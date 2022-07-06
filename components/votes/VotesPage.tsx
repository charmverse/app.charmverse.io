import { Box, Stack, Typography } from '@mui/material';
import { useReducer, Reducer } from 'react';
import useSWR from 'swr';
import VoteIcon from '@mui/icons-material/HowToVoteOutlined';
import { VoteStatus } from '@prisma/client';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { ExtendedVote } from 'lib/votes/interfaces';
import charmClient from 'charmClient';
import { ViewOptions, VoteSort, VoteFilter, sortVotes, filterVotes } from 'components/[pageId]/DocumentPage/components/PageInlineVotesList';
import VotesTable from './components/VotesTable';

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
      <Stack direction='row' alignItems='center' justifyContent='space-between' gap={1} mb={3}>
        {/* <VoteIcon fontSize='large' /> */}
        <Typography variant='h1'>
          <strong>Votes</strong>
        </Typography>
        <ViewOptions voteSort={viewState.sortBy} voteFilter={viewState.filterBy} setVoteSort={setVoteSort} setVoteFilter={setVoteFilter} />
      </Stack>
      <VotesTable votes={data ? sortedVotes : undefined} />
    </CenteredPageContent>
  );
}

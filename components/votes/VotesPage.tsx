import { Box, Grid, Typography } from '@mui/material';
import { VoteStatus } from '@prisma/client';
import charmClient from 'charmClient';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { filterVotes, sortVotes, ViewOptions, VoteFilter, VoteSort } from 'components/[pageId]/DocumentPage/components/VotesSidebar';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { ExtendedVote } from 'lib/votes/interfaces';
import { Reducer, useReducer } from 'react';
import useSWR from 'swr';
import NewProposalButton from './components/NewProposalButton';
import VotesTable, { VoteRow } from './components/VotesTable';

export interface ViewState {
  sortBy: VoteSort;
  filterBy: VoteFilter;
  visibleStatuses: VoteStatus[];
}

const defaultViewState: ViewState = {
  sortBy: 'latest_created',
  filterBy: 'in_progress',
  visibleStatuses: ['InProgress', 'Passed', 'Rejected']
};

type ViewStateReducer = Reducer<ViewState, Partial<ViewState>>;

export default function VotesPage () {

  const [viewState, setViewState] = useReducer<ViewStateReducer>((state, updates) => ({ ...state, ...updates }), defaultViewState);

  const [currentSpace] = useCurrentSpace();
  const { data, mutate: mutateVotes } = useSWR(() => `votesBySpace/${currentSpace?.id}`, () => currentSpace ? charmClient.getVotesBySpace(currentSpace.id) : []);

  // votes dont exist right away for proposals, so treat them like draft votes
  const { pages } = usePages();
  const proposalsWithoutVotes = Object.values(pages).filter(page => page?.type === 'proposal' && !page.deletedAt && !data?.some(vote => vote.pageId === page.id && vote.context === 'proposal'));
  const draftVotes: VoteRow[] = proposalsWithoutVotes.map(page => ({
    id: page!.id,
    createdAt: page!.createdAt,
    createdBy: page!.createdBy,
    deadline: null,
    pageId: page!.id,
    status: 'Draft',
    title: '',
    context: 'proposal'
  }));

  const sortedVotes = sortVotes(
    filterVotes<VoteRow>(draftVotes.concat(data ?? []), viewState.filterBy),
    viewState.sortBy
  ) as ExtendedVote[];

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
            Votes
          </Typography>
        </Grid>
        <Grid item xs={12} lg={8} display='flex'>
          <Box gap={3} sx={{ display: 'flex', alignItems: { xs: 'flex-start', lg: 'center' }, width: '100%', justifyContent: { xs: 'flex-start', lg: 'flex-end' }, flexDirection: { xs: 'column-reverse', lg: 'row' } }}>
            <ViewOptions voteSort={viewState.sortBy} voteFilter={viewState.filterBy} setVoteSort={setVoteSort} setVoteFilter={setVoteFilter} />
            <NewProposalButton />
          </Box>
        </Grid>
      </Grid>
      <VotesTable votes={sortedVotes} mutateVotes={mutateVotes} />
    </CenteredPageContent>
  );
}

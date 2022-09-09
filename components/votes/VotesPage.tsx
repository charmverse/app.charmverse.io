import { Grid, Typography } from '@mui/material';
import { VoteStatus } from '@prisma/client';
import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { filterVotes, sortVotes, VoteFilter, VoteSort } from 'components/[pageId]/DocumentPage/components/VotesSidebar';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { Reducer, useReducer } from 'react';
import useSWR from 'swr';
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
  const { data, mutate: mutateVotes } = useSWR(() => currentSpace ? `votesBySpace/${currentSpace.id}` : null, () => charmClient.votes.getVotesBySpace(currentSpace!.id));

  // votes dont exist right away for proposals, so treat them like draft votes
  const { pages } = usePages();

  // For now, consider that empty pages list means we are loading pages
  const loadingData = !pages || Object.keys(pages).length === 0 || !data;

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
    filterVotes<VoteRow>(draftVotes.concat(data as any as VoteRow[] ?? []), viewState.filterBy),
    viewState.sortBy
  ) as VoteRow[];

  return (
    <CenteredPageContent>
      <Grid container mb={6}>
        <Grid item xs>
          <Typography variant='h1' gutterBottom>
            Votes
          </Typography>
        </Grid>

        {
            loadingData ? (
              <Grid item xs={12} sx={{ mt: 12 }}>
                <LoadingComponent isLoading size={50} />
              </Grid>
            ) : (
              <Grid item xs={12} sx={{ mt: 5 }}>
                <VotesTable votes={sortedVotes} mutateVotes={mutateVotes} />
              </Grid>
            )
          }
      </Grid>
    </CenteredPageContent>
  );
}

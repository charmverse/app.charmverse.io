import { Box, Stack, Typography } from '@mui/material';
import { useReducer, Reducer } from 'react';
import useSWR from 'swr';
import VoteIcon from '@mui/icons-material/HowToVoteOutlined';
import { Vote, VoteStatus } from '@prisma/client';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import sortBy from 'lodash/sortBy';
import charmClient from 'charmClient';
import VotesTable from './components/VotesTable';

// TODO: figure out how to determine the variant
type VoteVariant = 'page' | 'page-inline';

export interface UIVote extends Vote {
  type: VoteVariant;
}

export interface ViewState {
  variant: 'table' | 'columns';
  sortBy: 'createdAt' | 'deadline' | 'title' | 'type';
  visibleStatuses: VoteStatus[];
}

interface StatusOption {
  id: VoteStatus;
  label: string;
  color: string;
}

const statusOptions: StatusOption[] = [
  { id: 'InProgress', label: 'In Progress', color: 'propColorYellow' },
  { id: 'Passed', label: 'Passed', color: 'propColorTeal' },
  { id: 'Rejected', label: 'Rejected', color: 'propColorRed' },
  { id: 'Cancelled', label: 'Cancelled', color: 'propColorGray' }
];

const defaultViewState: ViewState = {
  variant: 'table',
  sortBy: 'createdAt',
  visibleStatuses: statusOptions.map(option => option.id)
};

type ViewStateReducer = Reducer<ViewState, Partial<ViewState>>;

export default function VotesPage () {

  const [viewState, setViewState] = useReducer<ViewStateReducer>((state, updates) => ({ ...state, ...updates }), defaultViewState);

  const [currentSpace] = useCurrentSpace();
  const { data } = useSWR(() => `votesBySpace/${currentSpace?.id}`, () => currentSpace ? charmClient.getVotesBySpace(currentSpace.id) : []);

  const votes: UIVote[] | undefined = data?.map(vote => ({
    ...vote,
    type: 'page'
  }));

  const sortedVotes = sortBy(votes, viewState.sortBy);

  function toggleVariant (variant: ViewState['variant']) {
    setViewState({ variant });
  }

  function filterByStatus (visibleStatuses: ViewState['visibleStatuses']) {
    setViewState({ visibleStatuses });
  }

  return (
    <CenteredPageContent>
      <Stack direction='row' alignItems='center' gap={1} mb={1}>
        {/* <VoteIcon fontSize='large' /> */}
        <Typography variant='h1'>
          <strong>Votes</strong>
        </Typography>
      </Stack>
      <VotesTable votes={data ? sortedVotes : undefined} />
    </CenteredPageContent>
  );
}

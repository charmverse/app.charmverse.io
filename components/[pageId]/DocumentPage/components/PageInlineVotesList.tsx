import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { Box, InputLabel, List, MenuItem, Select, Typography } from '@mui/material';
import PageInlineVote from 'components/common/CharmEditor/components/PageInlineVote';
import { useInlineVotes } from 'hooks/useInlineVotes';
import { findTotalInlineVotes } from 'lib/inline-votes/findTotalInlineVotes';
import { isTruthy } from 'lib/utilities/types';
import { ExtendedVote } from 'lib/votes/interfaces';
import { useMemo, useState } from 'react';
import NoVotesMessage from 'components/votes/components/NoVotesMessage';
import PageActionToggle from './PageActionToggle';

export const StyledPageInlineVotesList = styled(List)`
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: 0px;
  padding-bottom: 0px;
  height: calc(100%);
`;

type TVoteSort = 'position' | 'latest_deadline' | 'highest_votes' | 'latest_created';
type TVoteFilter = 'in_progress' | 'completed';

export default function PageInlineVotesList () {
  const { inlineVotes } = useInlineVotes();
  const allVotes = Object.values(inlineVotes);
  const view = useEditorViewContext();
  const [voteFilter, setVoteFilter] = useState<TVoteFilter>('in_progress');
  const [voteSort, setVoteSort] = useState<TVoteSort>('position');
  const inlineVoteIds = voteSort === 'position' ? findTotalInlineVotes(view, view.state.doc, inlineVotes).voteIds : [];

  const sortedVotes = useMemo(() => {
    let _sortedVotes: ExtendedVote[] = [];
    if (voteSort === 'highest_votes') {
      _sortedVotes = allVotes.sort((voteA, voteB) => voteA.userVotes.length > voteB.userVotes.length ? -1 : 1);
    }
    else if (voteSort === 'latest_created') {
      _sortedVotes = allVotes.sort(
        (voteA, voteB) => new Date(voteA.createdAt) > new Date(voteB.createdAt) ? -1 : 1
      );
    }
    else if (voteSort === 'latest_deadline') {
      _sortedVotes = allVotes.sort(
        (voteA, voteB) => new Date(voteA.deadline) < new Date(voteB.deadline) ? -1 : 1
      );
    }
    else if (voteSort === 'position') {
      _sortedVotes = inlineVoteIds.map(inlineVoteId => inlineVotes[inlineVoteId]).filter(isTruthy);
    }
    return _sortedVotes;
  }, [inlineVotes, allVotes, voteSort]);

  const filteredVotes = voteFilter === 'completed' ? allVotes.filter(sortedVote => sortedVote.status !== 'InProgress') : sortedVotes.filter(sortedVote => sortedVote.status === 'InProgress');

  return (
    <Box sx={{
      height: 'calc(100%)',
      gap: 1,
      display: 'flex',
      flexDirection: 'column'
    }}
    >
      <Box display='flex' gap={1}>
        <PageActionToggle />
        <Typography fontWeight={600} fontSize={20}>Votes</Typography>
      </Box>
      <Box display='flex' gap={1} alignItems='center'>
        <InputLabel>Sort</InputLabel>
        <Select label='Filter' variant='outlined' value={voteSort} onChange={(e) => setVoteSort(e.target.value as TVoteSort)}>
          <MenuItem value='position'>Position</MenuItem>
          <MenuItem value='highest_votes'>Votes</MenuItem>
          <MenuItem value='latest_deadline'>Deadline</MenuItem>
          <MenuItem value='latest_created'>Created</MenuItem>
        </Select>
        <InputLabel>Filter</InputLabel>
        <Select variant='outlined' value={voteFilter} onChange={(e) => setVoteFilter(e.target.value as TVoteFilter)}>
          <MenuItem value='in_progress'>In progress</MenuItem>
          <MenuItem value='completed'>Completed</MenuItem>
        </Select>
      </Box>
      <StyledPageInlineVotesList>
        {filteredVotes.length === 0
          ? <NoVotesMessage message={`No ${voteFilter === 'completed' ? 'completed' : 'in progress'} votes yet`} />
          : filteredVotes.map(inlineVote => <PageInlineVote detailed={false} inlineVote={inlineVote} key={inlineVote.id} />)}
      </StyledPageInlineVotesList>
    </Box>
  );
}

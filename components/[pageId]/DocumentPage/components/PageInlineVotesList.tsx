import styled from '@emotion/styled';
import { List, MenuItem, Select, Typography } from '@mui/material';
import { Box } from '@mui/system';
import PageInlineVote from 'components/common/CharmEditor/components/PageInlineVote';
import { useInlineVotes } from 'hooks/useInlineVotes';
import { VoteWithUsers } from 'lib/inline-votes/interfaces';
import { useMemo, useState } from 'react';

export const StyledPageInlineVotesList = styled(List)`
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding-top: 0px;
  padding-bottom: 0px;
  height: calc(100% - 50px);
`;

export default function PageInlineVotesList () {
  const { inlineVotes } = useInlineVotes();
  const allVotes = Object.values(inlineVotes);
  const [votesInProgress, votesCompleted] = useMemo(() => {
    const _votesInProgress: VoteWithUsers[] = [];
    const _votesCompleted: VoteWithUsers[] = [];
    allVotes.forEach(vote => {
      if (vote.status === 'InProgress') {
        _votesInProgress.push(vote);
      }
      else {
        _votesCompleted.push(vote);
      }
    });

    return [_votesInProgress, _votesCompleted];
  }, [inlineVotes]);

  const [voteFilter, setVoteFilter] = useState<'in_progress' | 'completed'>('in_progress');
  // const [voteSort, setVoteSort] = useState<'latest_updated' | 'highest_votes'>('latest_updated')

  const filteredVotes = voteFilter === 'completed' ? votesCompleted : votesInProgress;
  return (
    <Box>
      <Box display='flex' alignItems='center' justifyContent='space-between' mb={1}>
        <Typography fontWeight={600} fontSize={20}>
          Votes
        </Typography>
        <Box display='flex' gap={1}>
          <Select variant='outlined' value={voteFilter} onChange={(e) => setVoteFilter(e.target.value as 'in_progress' | 'completed')}>
            <MenuItem value='in_progress'>In progress</MenuItem>
            <MenuItem value='completed'>Completed</MenuItem>
          </Select>
        </Box>
      </Box>
      <StyledPageInlineVotesList>
        {filteredVotes.map(inlineVote => <PageInlineVote detailed={false} inlineVote={inlineVote} key={inlineVote.id} />)}
      </StyledPageInlineVotesList>
    </Box>
  );
}

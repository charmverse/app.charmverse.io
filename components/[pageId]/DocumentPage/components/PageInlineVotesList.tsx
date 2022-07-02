import styled from '@emotion/styled';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import { InputLabel, List, MenuItem, Select, Typography } from '@mui/material';
import { Box } from '@mui/system';
import PageInlineVote from 'components/common/CharmEditor/components/PageInlineVote';
import { useInlineVotes } from 'hooks/useInlineVotes';
import { ExtendedVote } from 'lib/votes/interfaces';
import { useMemo, useState } from 'react';

export const StyledPageInlineVotesList = styled(List)`
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: 0px;
  padding-bottom: 0px;
  height: calc(100%);
`;

const EmptyVoteContainerBox = styled(Box)`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.palette.background.light};
`;

const Center = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display: flex;
  align-items: center;
  flex-direction: column;
`;

type TVoteSort = 'latest_deadline' | 'highest_votes' | 'latest_created';
type TVoteFilter = 'in_progress' | 'completed';

export default function PageInlineVotesList () {
  const { inlineVotes } = useInlineVotes();
  const allVotes = Object.values(inlineVotes);
  const [votesInProgress, votesCompleted] = useMemo(() => {
    const _votesInProgress: ExtendedVote[] = [];
    const _votesCompleted: ExtendedVote[] = [];
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

  const [voteFilter, setVoteFilter] = useState<TVoteFilter>('in_progress');
  const [voteSort, setVoteSort] = useState<TVoteSort>('latest_deadline');

  const filteredVotes = voteFilter === 'completed' ? votesCompleted : votesInProgress;

  const sortedVotes = useMemo(() => {
    let _sortedVotes: ExtendedVote[] = filteredVotes;
    if (voteSort === 'highest_votes') {
      _sortedVotes = filteredVotes.sort((filteredVoteA, filteredVoteB) => filteredVoteA.userVotes.length > filteredVoteB.userVotes.length ? -1 : 1);
    }
    else if (voteSort === 'latest_created') {
      _sortedVotes = filteredVotes.sort(
        (filteredVoteA, filteredVoteB) => new Date(filteredVoteA.createdAt) > new Date(filteredVoteB.createdAt) ? -1 : 1
      );
    }
    else if (voteSort === 'latest_deadline') {
      _sortedVotes = filteredVotes.sort(
        (filteredVoteA, filteredVoteB) => new Date(filteredVoteA.deadline) < new Date(filteredVoteB.deadline) ? -1 : 1
      );
    }
    return _sortedVotes;
  }, [filteredVotes, voteSort]);
  return (
    <Box sx={{
      height: 'calc(100%)',
      gap: 1,
      display: 'flex',
      flexDirection: 'column'
    }}
    >
      <Typography fontWeight={600} fontSize={20}>
        Votes
      </Typography>
      <Box display='flex' gap={1} alignItems='center'>
        <InputLabel>Sort</InputLabel>
        <Select label='Filter' variant='outlined' value={voteSort} onChange={(e) => setVoteSort(e.target.value as TVoteSort)}>
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
        {sortedVotes.length === 0 ? (
          <EmptyVoteContainerBox>
            <Center>
              <HowToVoteOutlinedIcon
                fontSize='large'
                color='secondary'
                sx={{
                  height: '2em',
                  width: '2em'
                }}
              />
              <Typography variant='subtitle1' color='secondary'>No {voteFilter === 'completed' ? 'completed' : 'in progress'} votes yet</Typography>
            </Center>
          </EmptyVoteContainerBox>
        ) : sortedVotes.map(inlineVote => <PageInlineVote detailed={false} inlineVote={inlineVote} key={inlineVote.id} />)}
      </StyledPageInlineVotesList>
    </Box>
  );
}

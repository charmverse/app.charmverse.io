import styled from '@emotion/styled';
import { List, MenuItem, Select, Typography } from '@mui/material';
import { Box } from '@mui/system';
import PageInlineVote from 'components/common/CharmEditor/components/PageInlineVote';
import { useInlineVotes } from 'hooks/useInlineVotes';
import { ExtendedVote } from 'lib/votes/interfaces';
import { useMemo, useState } from 'react';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';

export const StyledPageInlineVotesList = styled(List)`
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-right: ${({ theme }) => theme.spacing(1)};
  padding-top: 0px;
  padding-bottom: 0px;
  height: calc(100% - 50px);
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

  const [voteFilter, setVoteFilter] = useState<'in_progress' | 'completed'>('in_progress');
  // const [voteSort, setVoteSort] = useState<'latest_updated' | 'highest_votes'>('latest_updated')

  const filteredVotes = voteFilter === 'completed' ? votesCompleted : votesInProgress;

  return (
    <Box sx={{
      height: 'calc(100% - 50px)'
    }}
    >
      <Box display='flex' alignItems='center' justifyContent='space-between' mb={1} ml={2} mr={1}>
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
        {filteredVotes.length === 0 ? (
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
        ) : filteredVotes.map(inlineVote => <PageInlineVote detailed={false} inlineVote={inlineVote} key={inlineVote.id} />)}
      </StyledPageInlineVotesList>
    </Box>
  );
}

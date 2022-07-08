import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { Box, InputLabel, List, MenuItem, Select, Typography } from '@mui/material';
import PageInlineVote from 'components/common/CharmEditor/components/PageInlineVote';
import { useInlineVotes } from 'hooks/useInlineVotes';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { highlightDomElement, silentlyUpdateURL } from 'lib/browser';
import { findTotalInlineVotes } from 'lib/inline-votes/findTotalInlineVotes';
import { isTruthy } from 'lib/utilities/types';
import { ExtendedVote } from 'lib/votes/interfaces';
import { useEffect, useState } from 'react';
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

export type VoteSort = 'position' | 'latest_deadline' | 'highest_votes' | 'latest_created';
export type VoteFilter = 'in_progress' | 'completed' | 'all';

export default function PageInlineVotesList () {
  const { inlineVotes } = useInlineVotes();
  const allVotes = Object.values(inlineVotes);
  const view = useEditorViewContext();
  const [voteFilter, setVoteFilter] = useState<VoteFilter>('in_progress');
  const [voteSort, setVoteSort] = useState<VoteSort>('position');
  const inlineVoteIds = voteSort === 'position' ? findTotalInlineVotes(view, view.state.doc, inlineVotes).voteIds : [];
  const { setCurrentPageActionDisplay } = usePageActionDisplay();

  const filteredVotes = filterVotes(allVotes, voteFilter);

  const sortedVotes = sortVotes(filteredVotes, voteSort, inlineVoteIds, inlineVotes);

  useEffect(() => {
    // Highlight the vote id when navigation from nexus votes tasks list tab
    const highlightedVoteId = (new URLSearchParams(window.location.search)).get('voteId');
    if (highlightedVoteId) {
      const highlightedVote = allVotes.find(vote => vote.id === highlightedVoteId);
      if (highlightedVote) {
        const highlightedVoteDomNode = document.getElementById(`vote.${highlightedVoteId}`);
        if (highlightedVoteDomNode) {
          setTimeout(() => {
            setCurrentPageActionDisplay('votes');
            setVoteFilter('all');
            // Remove query parameters from url
            silentlyUpdateURL(window.location.href.split('?')[0]);
            requestAnimationFrame(() => {
              highlightedVoteDomNode.scrollIntoView({
                behavior: 'smooth'
              });
              setTimeout(() => {
                requestAnimationFrame(() => {
                  highlightDomElement(highlightedVoteDomNode);
                });
              }, 250);
            });
          }, 250);
        }
      }
    }
  }, [allVotes, window.location.search]);

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
      <ViewOptions showPosition={true} voteSort={voteSort} voteFilter={voteFilter} setVoteFilter={setVoteFilter} setVoteSort={setVoteSort} />
      <StyledPageInlineVotesList>
        {sortedVotes.length === 0
          ? <NoVotesMessage message={`No ${voteFilter === 'completed' ? 'completed' : 'in progress'} votes yet`} />
          : sortedVotes.map(inlineVote => <PageInlineVote detailed={false} inlineVote={inlineVote} key={inlineVote.id} />)}
      </StyledPageInlineVotesList>
    </Box>
  );
}

interface ViewOptionsProps {
  showPosition?: boolean;
  voteSort: VoteSort;
  voteFilter: VoteFilter;
  setVoteFilter: (value: VoteFilter) => void;
  setVoteSort: (value: VoteSort) => void;
}

export function ViewOptions ({ voteSort, voteFilter, setVoteFilter, setVoteSort, showPosition }: ViewOptionsProps) {
  return (
    <Box display='flex' gap={1} alignItems='center'>
      <InputLabel>Sort</InputLabel>
      <Select variant='outlined' value={voteSort} onChange={(e) => setVoteSort(e.target.value as VoteSort)} sx={{ mr: 2 }}>
        {showPosition && <MenuItem value='position'>Position</MenuItem>}
        <MenuItem value='highest_votes'>Votes</MenuItem>
        <MenuItem value='latest_deadline'>Deadline</MenuItem>
        <MenuItem value='latest_created'>Created</MenuItem>
      </Select>
      <InputLabel>Filter</InputLabel>
      <Select variant='outlined' value={voteFilter} onChange={(e) => setVoteFilter(e.target.value as VoteFilter)}>
        <MenuItem value='in_progress'>In progress</MenuItem>
        <MenuItem value='completed'>Completed</MenuItem>
        <MenuItem value='all'>All</MenuItem>
      </Select>
    </Box>
  );
}

export function filterVotes <T extends ExtendedVote> (votes: T[], voteFilter: VoteFilter) {
  if (voteFilter === 'completed') {
    return votes.filter(sortedVote => sortedVote.status !== 'InProgress');
  }
  else if (voteFilter === 'in_progress') {
    return votes.filter(sortedVote => sortedVote.status === 'InProgress');
  }
  return votes;
}

export function sortVotes <T extends ExtendedVote> (
  votes: T[],
  voteSort: VoteSort,
  inlineVoteIds: string[] = [],
  inlineVotes: Record<string, T> = {}
) {
  if (voteSort === 'highest_votes') {
    votes.sort((voteA, voteB) => voteA.userVotes.length > voteB.userVotes.length ? -1 : 1);
  }
  else if (voteSort === 'latest_created') {
    votes.sort(
      (voteA, voteB) => new Date(voteA.createdAt) > new Date(voteB.createdAt) ? -1 : 1
    );
  }
  else if (voteSort === 'latest_deadline') {
    votes.sort(
      (voteA, voteB) => new Date(voteA.deadline) > new Date(voteB.deadline) ? -1 : 1
    );
  }
  else if (voteSort === 'position') {
    const voteIds = new Set(votes.map(vote => vote.id));
    const votesWithoutPosition = votes.filter(vote => !inlineVoteIds.includes(vote.id))
    // sort by created Date
      .sort(
        (voteA, voteB) => new Date(voteA.createdAt) > new Date(voteB.createdAt) ? -1 : 1
      );
    return [
      ...votesWithoutPosition,
      ...inlineVoteIds.map(inlineVoteId => inlineVotes[inlineVoteId]).filter((vote) => isTruthy(vote) && voteIds.has(vote.id))
    ];
  }
  return votes;
}

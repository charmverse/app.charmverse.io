import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { Box, InputLabel, List, MenuItem, Select, Typography } from '@mui/material';
import PageInlineVote from 'components/common/CharmEditor/components/inlineVote/components/PageInlineVote';
import { useVotes } from 'hooks/useVotes';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { highlightDomElement, silentlyUpdateURL } from 'lib/browser';
import { findTotalInlineVotes } from 'lib/inline-votes/findTotalInlineVotes';
import { isTruthy } from 'lib/utilities/types';
import { ExtendedVote } from 'lib/votes/interfaces';
import { useEffect, useState } from 'react';
import NoVotesMessage from 'components/votes/components/NoVotesMessage';
import PageActionToggle from './PageActionToggle';

const VotesContainer = styled(List)`
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

export default function VotesSidebar () {
  const { votes, castVote, deleteVote, cancelVote } = useVotes();
  const votesArray = Object.values(votes);
  const view = useEditorViewContext();
  const [voteFilter, setVoteFilter] = useState<VoteFilter>('in_progress');
  const [voteSort, setVoteSort] = useState<VoteSort>('position');
  const inlineVoteIds = voteSort === 'position' ? findTotalInlineVotes(view, view.state.doc, votes).voteIds : [];
  const { setCurrentPageActionDisplay } = usePageActionDisplay();

  const filteredVotes = filterVotes(votesArray, voteFilter);

  const sortedVotes = sortVotes(filteredVotes, voteSort, inlineVoteIds, votes);

  useEffect(() => {
    // Highlight the vote id when navigation from nexus votes tasks list tab
    const highlightedVoteId = (new URLSearchParams(window.location.search)).get('voteId');
    if (highlightedVoteId) {
      const highlightedVote = votes[highlightedVoteId];
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
  }, [votes, window.location.search]);

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
      <ViewOptions
        showPosition={true}
        showVotes={true}
        voteSort={voteSort}
        voteFilter={voteFilter}
        setVoteFilter={setVoteFilter}
        setVoteSort={setVoteSort}
      />
      <VotesContainer>
        {sortedVotes.length === 0
          ? <NoVotesMessage message={`No ${voteFilter === 'completed' ? 'completed' : 'in progress'} votes yet`} />
          : sortedVotes.map(inlineVote => (
            <PageInlineVote
              key={inlineVote.id}
              detailed={false}
              inlineVote={inlineVote}
              castVote={castVote}
              deleteVote={deleteVote}
              cancelVote={cancelVote}
            />
          ))}
      </VotesContainer>
    </Box>
  );
}

interface ViewOptionsProps {
  showPosition?: boolean;
  showVotes?: boolean;
  voteSort: VoteSort;
  voteFilter: VoteFilter;
  setVoteFilter: (value: VoteFilter) => void;
  setVoteSort: (value: VoteSort) => void;
}

export function ViewOptions ({ voteSort, voteFilter, setVoteFilter, setVoteSort, showPosition, showVotes }: ViewOptionsProps) {
  return (
    <Box display='flex' gap={1} alignItems='center'>
      <InputLabel>Sort</InputLabel>
      <Select variant='outlined' value={voteSort} onChange={(e) => setVoteSort(e.target.value as VoteSort)} sx={{ mr: 2 }}>
        {showPosition && <MenuItem value='position'>Position</MenuItem>}
        {showVotes && <MenuItem value='highest_votes'>Votes</MenuItem>}
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

export function filterVotes <T extends { status: string }> (votes: T[], voteFilter: VoteFilter) {
  if (voteFilter === 'completed') {
    return votes.filter(sortedVote => sortedVote.status !== 'InProgress');
  }
  else if (voteFilter === 'in_progress') {
    return votes.filter(sortedVote => sortedVote.status === 'InProgress' || sortedVote.status === 'Draft');
  }
  return votes;
}

export function sortVotes <T extends Pick<ExtendedVote, 'createdAt' | 'deadline' | 'id'> & { totalVotes?: number }> (
  votes: T[],
  voteSort: VoteSort,
  inlineVoteIds: string[] = [],
  inlineVotes: Record<string, T> = {}
) {
  if (voteSort === 'highest_votes') {
    votes.sort((voteA, voteB) => (typeof voteA.totalVotes === 'number' && typeof voteB.totalVotes === 'number' && voteA.totalVotes > voteB.totalVotes) ? -1 : 1);
  }
  else if (voteSort === 'latest_created') {
    votes.sort(
      (voteA, voteB) => new Date(voteA.createdAt) > new Date(voteB.createdAt) ? -1 : 1
    );
  }
  else if (voteSort === 'latest_deadline') {
    votes.sort(
      (voteA, voteB) => {
        // if neither vote has a deadline, sort by created date
        if (!voteA.deadline && !voteB.deadline) {
          return new Date(voteA.createdAt) > new Date(voteB.createdAt) ? -1 : 1;
        }
        else if (!voteA.deadline) {
          return -1;
        }
        else if (!voteB.deadline) {
          return 1;
        }
        return new Date(voteA.deadline) > new Date(voteB.deadline) ? -1 : 1;
      }
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

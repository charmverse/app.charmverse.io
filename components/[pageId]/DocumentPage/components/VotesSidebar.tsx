import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { InputLabel, MenuItem, Select } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import VoteDetail from 'components/common/CharmEditor/components/inlineVote/components/VoteDetail';
import NoVotesMessage from 'components/votes/components/NoVotesMessage';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { useVotes } from 'hooks/useVotes';
import { findTotalInlineVotes } from 'lib/inline-votes/findTotalInlineVotes';
import { highlightDomElement, setUrlWithoutRerender } from 'lib/utilities/browser';
import { isTruthy } from 'lib/utilities/types';
import type { ExtendedVote } from 'lib/votes/interfaces';

import { StyledSidebar as CommentsSidebar } from './CommentsSidebar';

const StyledSidebar = styled(CommentsSidebar)`
  height: calc(100%);
`;

export type VoteSort = 'position' | 'latest_deadline' | 'highest_votes' | 'latest_created';
export type VoteFilter = 'in_progress' | 'completed' | 'all';

export default function VotesSidebar () {
  const router = useRouter();
  const { votes, cancelVote, castVote, deleteVote } = useVotes();
  const votesArray = Object.values(votes);
  const view = useEditorViewContext();
  const [voteFilter, setVoteFilter] = useState<VoteFilter>('in_progress');
  const [voteSort, setVoteSort] = useState<VoteSort>('position');
  const inlineVoteIds = voteSort === 'position' ? findTotalInlineVotes(view, view.state.doc, votes).voteIds : [];
  const { setCurrentPageActionDisplay } = usePageActionDisplay();

  // Don't show a proposal vote inside the votes
  const filteredVotes = filterVotes(votesArray, voteFilter).filter(v => v.context !== 'proposal');

  const sortedVotes = sortVotes(filteredVotes, voteSort, inlineVoteIds, votes);

  useEffect(() => {
    // Highlight the vote id when navigation from nexus votes tasks list tab
    const highlightedVoteId = router.query.voteId;
    if (typeof highlightedVoteId === 'string') {
      const highlightedVote = votes[highlightedVoteId];
      if (highlightedVote && votes[highlightedVoteId].context !== 'proposal') {
        const highlightedVoteDomNode = document.getElementById(`vote.${highlightedVoteId}`);
        if (highlightedVoteDomNode) {
          setTimeout(() => {
            setCurrentPageActionDisplay('polls');
            setVoteFilter('all');
            // Remove query parameters from url
            setUrlWithoutRerender(router.pathname, { voteId: null });
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
    <>
      <ViewOptions
        showPosition={true}
        showVotes={true}
        voteSort={voteSort}
        voteFilter={voteFilter}
        setVoteFilter={setVoteFilter}
        setVoteSort={setVoteSort}
      />
      <StyledSidebar>
        {sortedVotes.length === 0
          ? <NoVotesMessage message={`No ${voteFilter === 'completed' ? 'completed' : 'in progress'} polls yet`} />
          : sortedVotes.map(inlineVote => (
            <VoteDetail
              cancelVote={cancelVote}
              castVote={castVote}
              deleteVote={deleteVote}
              key={inlineVote.id}
              detailed={false}
              vote={inlineVote}
            />
          ))}
      </StyledSidebar>
    </>
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

const StyledViewOptions = styled.div`
  align-items: center;
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  .MuiInputLabel-root, .MuiSelect-select {
    font-size: .85em;
  }
`;

export function ViewOptions ({ voteSort, voteFilter, setVoteFilter, setVoteSort, showPosition, showVotes }: ViewOptionsProps) {
  return (
    <StyledViewOptions>
      <InputLabel>Sort</InputLabel>
      <Select variant='outlined' value={voteSort} onChange={(e) => setVoteSort(e.target.value as VoteSort)} sx={{ mr: 2 }}>
        {showPosition && <MenuItem value='position'>Position</MenuItem>}
        {showVotes && <MenuItem value='highest_votes'>Most voted</MenuItem>}
        <MenuItem value='latest_deadline'>Deadline</MenuItem>
        <MenuItem value='latest_created'>Created</MenuItem>
      </Select>
      <InputLabel>Filter</InputLabel>
      <Select variant='outlined' value={voteFilter} onChange={(e) => setVoteFilter(e.target.value as VoteFilter)}>
        <MenuItem value='in_progress'>In progress</MenuItem>
        <MenuItem value='completed'>Completed</MenuItem>
        <MenuItem value='all'>All</MenuItem>
      </Select>
    </StyledViewOptions>
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

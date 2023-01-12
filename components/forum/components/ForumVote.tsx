import { useTheme } from '@emotion/react';
import { IconButton, Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { MouseEvent } from 'react';
import { ImArrowUp, ImArrowDown } from 'react-icons/im';

import type { ForumVotes } from 'lib/forums/posts/interfaces';

export function ForumVote({ votes, onVote }: { votes: ForumVotes; onVote: (upvoted: boolean | null) => void }) {
  const theme = useTheme();
  const { downvotes, upvotes, upvoted } = votes;

  function clickVote(e: MouseEvent, newUpvotedStatus: boolean) {
    e.preventDefault();
    e.stopPropagation();
    if (upvoted === newUpvotedStatus) {
      onVote(null);
    } else {
      onVote(newUpvotedStatus);
    }
  }

  function getStyle(activeColor: string | null) {
    if (activeColor) {
      return { fill: activeColor, fontSize: 16 };
    } else {
      return {
        fontSize: 16,
        fill: 'none',
        stroke: 'var(--primary-text)',
        strokeWidth: '1px'
      };
    }
  }

  return (
    <Box display='flex' alignItems='center' gap={0.5}>
      <IconButton
        size='small'
        onClick={(e) => {
          clickVote(e, true);
        }}
      >
        <ImArrowUp style={getStyle(upvoted === true ? theme.palette.success.main : null)} />
      </IconButton>
      <Box minWidth={14}>
        <Typography align='center' variant='body2'>
          {upvotes - downvotes}
        </Typography>
      </Box>
      <IconButton
        size='small'
        onClick={(e) => {
          clickVote(e, false);
        }}
      >
        <ImArrowDown style={getStyle(upvoted === false ? 'var(--text-red)' : null)} />
      </IconButton>
    </Box>
  );
}

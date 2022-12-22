import { useTheme } from '@emotion/react';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import { IconButton, Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { MouseEvent } from 'react';

export function ForumVote({
  downvotes,
  upvotes,
  upvoted,
  vote: _vote
}: {
  upvoted?: boolean | null;
  upvotes: number;
  downvotes: number;
  vote: (upvoted?: boolean) => void;
}) {
  const theme = useTheme();

  function vote(e: MouseEvent, newUpvotedStatus: boolean) {
    e.preventDefault();
    e.stopPropagation();
    if (upvoted === newUpvotedStatus) {
      _vote(undefined);
    } else {
      _vote(newUpvotedStatus);
    }
  }

  return (
    <Box display='flex' alignItems='center' gap={0.5}>
      <IconButton
        size='small'
        onClick={(e) => {
          vote(e, true);
        }}
      >
        <NorthIcon
          sx={{
            fill: upvoted === true ? theme.palette.success.main : '',
            fontSize: 16
          }}
        />
      </IconButton>
      <Box minWidth={14}>
        <Typography align='center' variant='body2'>
          {upvotes - downvotes}
        </Typography>
      </Box>
      <IconButton
        size='small'
        onClick={(e) => {
          vote(e, false);
        }}
      >
        <SouthIcon
          sx={{
            fill: upvoted === false ? theme.palette.error.main : '',
            fontSize: 16
          }}
        />
      </IconButton>
    </Box>
  );
}

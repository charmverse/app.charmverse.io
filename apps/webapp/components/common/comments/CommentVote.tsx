import { useTheme } from '@emotion/react';
import { IconButton, Tooltip, Typography, Box } from '@mui/material';
import type { MouseEvent } from 'react';
import { ImArrowDown, ImArrowUp } from 'react-icons/im';

import type { CommentPermissions, GenericCommentVote } from '@packages/lib/comments';

type Props = {
  votes: GenericCommentVote;
  onVote: (upvoted: boolean | null) => void;
  permissions?: CommentPermissions;
};

export function CommentVote({ votes, onVote, permissions }: Props) {
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
      <Tooltip title={permissions?.upvote === false ? 'You do not have permissions to upvote this post' : ''}>
        <div>
          <IconButton
            data-test='upvote-post'
            disabled={!permissions?.upvote}
            size='small'
            onClick={(e) => {
              clickVote(e, true);
            }}
          >
            <ImArrowUp style={getStyle(upvoted === true ? theme.palette.success.main : null)} />
          </IconButton>
        </div>
      </Tooltip>
      <Box minWidth={14}>
        <Typography data-test='post-score' align='center' variant='body2'>
          {upvotes - downvotes}
        </Typography>
      </Box>
      <Tooltip title={permissions?.downvote === false ? 'You do not have permissions to downvote this post.' : ''}>
        <div>
          <IconButton
            data-test='downvote-post'
            disabled={!permissions?.downvote}
            size='small'
            onClick={(e) => {
              clickVote(e, false);
            }}
          >
            <ImArrowDown style={getStyle(upvoted === false ? 'var(--text-red)' : null)} />
          </IconButton>
        </div>
      </Tooltip>
    </Box>
  );
}

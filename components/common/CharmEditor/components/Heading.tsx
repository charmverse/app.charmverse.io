import { NodeViewProps, PluginKey } from '@bangle.dev/core';
import { ReactNode, useMemo } from 'react';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import { Box, Typography } from '@mui/material';
import { useEditorViewContext } from '@bangle.dev/react';
import { useThreads } from 'hooks/useThreads';
import { findTotalInlineComments } from 'lib/inline-comments/findTotalInlineComments';
import styled from '@emotion/styled';
import { findTotalInlineVotes } from 'lib/inline-votes/findTotalInlineVotes';
import { useVotes } from 'hooks/useVotes';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import { renderSuggestionsTooltip } from './@bangle.dev/tooltip/suggest-tooltip';
import { InlineCommentPluginState } from './inlineComment';
import { InlineVotePluginState } from './inlineVote';

// this span is necessary to prevent the cursor from becoming trapped by the action container with `position: absolute`
const CursorBoundary = styled.span`
  display: block;
`;

const InlineActionCountContainer = styled.span`
  position: absolute;
  top: 5px;
  display: flex;
  right: -40px;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  cursor: pointer;
  user-select: none;
`;

interface ParagraphProps extends NodeViewProps{
  children: ReactNode,
  calculateActions?: boolean,
  inlineCommentPluginKey: PluginKey<InlineCommentPluginState>,
  inlineVotePluginKey: PluginKey<InlineVotePluginState>
}

export default function Heading (
  { node, children, calculateActions = true, inlineCommentPluginKey, inlineVotePluginKey }: ParagraphProps
) {
  const isShowingCardModal = (new URLSearchParams(window.location.href)).get('cardId');
  const view = useEditorViewContext();
  const { threads } = useThreads();
  const { votes } = useVotes();
  const { threadIds, totalInlineComments } = useMemo(() => (calculateActions || isShowingCardModal)
    ? findTotalInlineComments(view, node, threads)
    : { threadIds: [], totalInlineComments: 0 }, [node, calculateActions, isShowingCardModal]);

  const { voteIds, totalInlineVotes } = useMemo(() => (calculateActions || isShowingCardModal)
    ? findTotalInlineVotes(view, node, votes)
    : { voteIds: [], totalInlineVotes: 0 }, [node, calculateActions, isShowingCardModal]);

  const level = node.attrs.level;

  let content = null;

  if (level === 1) {
    content = (
      <h1>
        {children}
      </h1>
    );
  }
  else if (level === 2) {
    content = (
      <h2>
        {children}
      </h2>
    );
  }
  else if (level === 3) {
    content = (
      <h3>
        {children}
      </h3>
    );
  }

  return (
    <>
      {content}
      <CursorBoundary contentEditable='false'>
        <InlineActionCountContainer>
          {totalInlineComments > 0 && (
          <Box
            display='flex'
            gap={0.5}
            alignItems='center'
            onClick={() => {
              renderSuggestionsTooltip(inlineCommentPluginKey, { ids: threadIds })(view.state, view.dispatch, view);
            }}
          >
            <CommentOutlinedIcon
              color='secondary'
              fontSize='small'
            />
            <Typography
              component='span'
              variant='subtitle1'
            >{totalInlineComments}
            </Typography>
          </Box>
          )}
          {totalInlineVotes > 0 && (
          <Box
            display='flex'
            gap={0.5}
            alignItems='center'
            onClick={() => {
              renderSuggestionsTooltip(inlineVotePluginKey, { ids: voteIds })(view.state, view.dispatch, view);
            }}
          >
            <HowToVoteOutlinedIcon
              color='secondary'
              fontSize='small'
            />
            <Typography
              component='span'
              variant='subtitle1'
            >{totalInlineVotes}
            </Typography>
          </Box>
          )}
        </InlineActionCountContainer>
      </CursorBoundary>
    </>
  );
}

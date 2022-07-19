import { NodeViewProps, PluginKey } from '@bangle.dev/core';
import { memo, useMemo } from 'react';
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
  right: -70px;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  cursor: pointer;
  user-select: none;
`;

interface InlineActionCounterProps {
  calculateActions?: boolean,
  inlineVotePluginKey: PluginKey<InlineVotePluginState>
  node: NodeViewProps['node']
}

function InlineActionCounter (
  { node, calculateActions = true, inlineVotePluginKey }: InlineActionCounterProps
) {
  const isShowingCardModal = (new URLSearchParams(window.location.href)).get('cardId');
  const view = useEditorViewContext();
  const { votes } = useVotes();

  const { voteIds, totalInlineVotes } = useMemo(() => (calculateActions || isShowingCardModal)
    ? findTotalInlineVotes(view, node, votes)
    : { voteIds: [], totalInlineVotes: 0 }, [node, calculateActions, isShowingCardModal, view, votes]);

  return (
    <CursorBoundary contentEditable='false' suppressContentEditableWarning>
      <InlineActionCountContainer>
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
  );
}

export default memo(InlineActionCounter);

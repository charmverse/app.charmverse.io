import { NodeViewProps, PluginKey } from '@bangle.dev/core';
import { ReactNode, useMemo } from 'react';
import ModeCommentOutlinedIcon from '@mui/icons-material/ModeCommentOutlined';
import { Box, Typography } from '@mui/material';
import { useEditorViewContext } from '@bangle.dev/react';
import { useThreads } from 'hooks/useThreads';
import { findTotalInlineComments } from 'lib/inline-comments/findTotalInlineComments';
import styled from '@emotion/styled';
import { renderSuggestionsTooltip } from './@bangle.dev/tooltip/suggest-tooltip';
import { InlineCommentPluginState } from './inlineComment';

const InlineCommentContainer = styled.div`
  position: absolute;
  right: -40px;
  top: 5px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
`;

export default function Paragraph (
  { node, children, calculateInlineComments = true, inlineCommentPluginKey }:
  NodeViewProps & {children: ReactNode, calculateInlineComments?: boolean, inlineCommentPluginKey: PluginKey<InlineCommentPluginState>}
) {
  const view = useEditorViewContext();
  const { threads } = useThreads();
  const { threadIds, totalInlineComments } = useMemo(() => calculateInlineComments
    ? findTotalInlineComments(view, node, threads)
    : { threadIds: [], totalInlineComments: 0 }, [node, calculateInlineComments]);

  return (
    <>
      {children}
      {totalInlineComments > 0 && (
        <InlineCommentContainer
          onClick={() => {
            renderSuggestionsTooltip(inlineCommentPluginKey, { threadIds })(view.state, view.dispatch, view);
          }}
        >
          <ModeCommentOutlinedIcon
            color='secondary'
            fontSize='small'
          />
          <Typography
            component='span'
            variant='subtitle1'
          >{totalInlineComments}
          </Typography>
        </InlineCommentContainer>
      )}
    </>
  );
}

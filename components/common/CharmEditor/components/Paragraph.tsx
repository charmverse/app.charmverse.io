import { NodeViewProps, PluginKey } from '@bangle.dev/core';
import { ReactNode, useMemo } from 'react';
import ModeCommentOutlinedIcon from '@mui/icons-material/ModeCommentOutlined';
import { Box, Typography } from '@mui/material';
import { useEditorViewContext } from '@bangle.dev/react';
import { useThreads } from 'hooks/useThreads';
import { findTotalInlineComments } from 'lib/inline-comments/findTotalInlineComments';
import { renderSuggestionsTooltip } from './@bangle.dev/tooltip/suggest-tooltip';
import { InlineCommentPluginState } from './inlineComment';

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
      <Box
        alignItems='center'
        display='flex'
        gap={0.5}
        sx={{
          cursor: 'pointer',
          userSelect: 'none'
        }}
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
      </Box>
      )}
    </>
  );
}

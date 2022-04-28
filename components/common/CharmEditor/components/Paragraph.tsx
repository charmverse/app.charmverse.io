import { NodeViewProps } from '@bangle.dev/core';
import { useInlineComment } from 'hooks/useInlineComment';
import { ReactNode, useMemo } from 'react';
import ModeCommentOutlinedIcon from '@mui/icons-material/ModeCommentOutlined';
import { Box, Typography } from '@mui/material';
import { useEditorViewContext } from '@bangle.dev/react';
import { renderSuggestionsTooltip, SuggestTooltipPluginKey } from './@bangle.dev/tooltip/suggest-tooltip';

export default function Paragraph (
  { node, children, calculateInlineComments = true }:
  NodeViewProps & {children: ReactNode, calculateInlineComments?: boolean}
) {
  const { findTotalInlineComments } = useInlineComment();
  const { threadIds, totalInlineComments } = useMemo(() => calculateInlineComments
    ? findTotalInlineComments(node)
    : { threadIds: [], totalInlineComments: 0 }, [node, calculateInlineComments]);

  const view = useEditorViewContext();
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
          renderSuggestionsTooltip(SuggestTooltipPluginKey, { component: 'inlineComment', threadIds })(view.state, view.dispatch, view);
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

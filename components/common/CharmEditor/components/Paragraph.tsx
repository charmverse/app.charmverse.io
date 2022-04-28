import { NodeViewProps } from '@bangle.dev/core';
import { useInlineComment } from 'hooks/useInlineComment';
import { useThreads } from 'hooks/useThreads';
import { ReactNode, useMemo } from 'react';
import ModeCommentOutlinedIcon from '@mui/icons-material/ModeCommentOutlined';
import { Box } from '@mui/material';
import { useEditorViewContext } from '@bangle.dev/react';
import { useSWRConfig } from 'swr';
import { renderSuggestionsTooltip, SuggestTooltipPluginKey } from './@bangle.dev/tooltip/suggest-tooltip';

export default function Paragraph (
  { node, children, calculateInlineComments = true }:
  NodeViewProps & {children: ReactNode, calculateInlineComments?: boolean}
) {
  const { findTotalInlineComments } = useInlineComment();
  const { threads } = useThreads();
  const { threadIds, totalInlineComments } = useMemo(() => calculateInlineComments
    ? findTotalInlineComments(node)
    : { threadIds: [], totalInlineComments: 0 }, [threads, node, calculateInlineComments]);

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
          cursor: 'pointer'
        }}
      >
        <ModeCommentOutlinedIcon
          onClick={() => {
            renderSuggestionsTooltip(SuggestTooltipPluginKey, { component: 'inlineComment', threadIds })(view.state, view.dispatch, view);
          }}
          color='secondary'
          fontSize='small'
        />
        <Box
          component='span'
          sx={{
            fontSize: 12
          }}
        >{totalInlineComments}
        </Box>
      </Box>
      )}
    </>
  );
}

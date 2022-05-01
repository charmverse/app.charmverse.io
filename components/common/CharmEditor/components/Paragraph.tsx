import { NodeViewProps } from '@bangle.dev/core';
import { ReactNode, useMemo, useState } from 'react';
import ModeCommentOutlinedIcon from '@mui/icons-material/ModeCommentOutlined';
import { Box, IconButton, Typography } from '@mui/material';
import { useEditorViewContext } from '@bangle.dev/react';
import { useThreads } from 'hooks/useThreads';
import { findTotalInlineComments } from 'lib/inline-comments/findTotalInlineComments';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import { renderSuggestionsTooltip, SuggestTooltipPluginKey } from './@bangle.dev/tooltip/suggest-tooltip';

const StyledHandleContainer = styled.div`
  position: absolute;
  top: 1px;
  left: -65px;
  opacity: 0;
  cursor: pointer;
  transition: opacity 150ms ease-in-out;
  display: flex;
`;

function Handle () {
  return (
    <StyledHandleContainer className='handle'>
      <IconButton
        size='small'
      >
        <AddIcon fontSize='small' />
      </IconButton>
      <IconButton
        size='small'
      >
        <DragIndicatorIcon fontSize='small' />
      </IconButton>
    </StyledHandleContainer>
  );
}

const StyleParagraphContainer = styled.div`
  &:hover .handle {
    transition: opacity 150ms ease-in-out;
    opacity: 0.5;
  }
`;

// TODO: Remove node handle for inline charmeditor !!!
export default function Paragraph (
  { node, children, calculateInlineComments = true }:
  NodeViewProps & {children: ReactNode, calculateInlineComments?: boolean}
) {
  const view = useEditorViewContext();
  const { threads } = useThreads();
  const { threadIds, totalInlineComments } = useMemo(() => calculateInlineComments
    ? findTotalInlineComments(view, node, threads)
    : { threadIds: [], totalInlineComments: 0 }, [node, calculateInlineComments]);

  return (
    <StyleParagraphContainer>
      <Handle />
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
    </StyleParagraphContainer>
  );
}

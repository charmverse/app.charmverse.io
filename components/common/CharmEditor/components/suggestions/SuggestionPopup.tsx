import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { Box, ClickAwayListener, Grow, Paper } from '@mui/material';
import { createPortal } from 'react-dom';
import type { PluginKey } from 'prosemirror-state';
import React from 'react';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { getEventsFromDoc } from './getEvents';
import { hideSuggestionsTooltip } from '../@bangle.dev/tooltip/suggest-tooltip';
import type { SuggestionPluginState } from './suggestions.plugins';

import { SuggestionCard } from './SuggestionCard';

const ThreadContainer = styled(Paper)`
  max-height: 400px;
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  flex-direction: column;
  min-width: 500px;
  overflow: auto;
`;

export default function SuggestionsPopup ({ pluginKey }: { pluginKey: PluginKey<SuggestionPluginState> }) {
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    show: isVisible,
    rowPos
  } = usePluginState(pluginKey) as SuggestionPluginState;
  const { currentPageActionDisplay } = usePageActionDisplay();

  const isInPageDialog = (new URLSearchParams(window.location.href)).get('cardId');
  const popupIsVisible = (currentPageActionDisplay !== 'suggestions' || isInPageDialog) && isVisible;

  if (popupIsVisible) {
    const rows = getEventsFromDoc({ state: view.state });
    const activeSuggestion = rows.map(row => row.marks).flat().find(mark => mark.active);
    const suggestions = activeSuggestion ? [activeSuggestion] : rows.find(row => row.pos === rowPos)?.marks ?? [];
    return createPortal(
      <ClickAwayListener onClickAway={() => {
        hideSuggestionsTooltip(pluginKey)(view.state, view.dispatch, view);
      }}
      >
        <Grow
          in
          style={{
            transformOrigin: 'left top'
          }}
          easing={{
            enter: 'ease-in-out'
          }}
          timeout={250}
        >
          <Box display='flex' flexDirection='column' gap={1}>
            {suggestions.map(suggestion => (
              // dont show suggestion card as active when inside popup
              <ThreadContainer elevation={4} sx={{ background: 'transparent' }}>
                <SuggestionCard {...suggestion} active={false} />
              </ThreadContainer>
            ))}
          </Box>
        </Grow>
      </ClickAwayListener>,
      tooltipContentDOM
    );
  }
  return null;
}

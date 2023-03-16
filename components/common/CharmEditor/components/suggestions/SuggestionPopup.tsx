import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { Box, ClickAwayListener, Grow } from '@mui/material';
import type { PluginKey } from 'prosemirror-state';
import React from 'react';
import { createPortal } from 'react-dom';

import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { useUser } from 'hooks/useUser';

import { hideSuggestionsTooltip } from '../@bangle.dev/tooltip/suggest-tooltip';
import { ThreadContainer } from '../inlineComment/inlineComment.components';

import { getEventsFromDoc } from './getEvents';
import { SuggestionCard } from './SuggestionCard';
import type { SuggestionPluginState } from './suggestions.plugins';

export function SuggestionsPopup({
  pluginKey,
  readOnly,
  pageId,
  spaceId
}: {
  pluginKey: PluginKey<SuggestionPluginState>;
  readOnly: boolean;
  pageId: string;
  spaceId: string;
}) {
  const view = useEditorViewContext();
  const { tooltipContentDOM, show: isVisible, rowPos } = usePluginState(pluginKey) as SuggestionPluginState;
  const { currentPageActionDisplay } = usePageActionDisplay();
  const { user } = useUser();

  const isInPageDialog = new URLSearchParams(window.location.href).get('cardId');
  const popupIsVisible = (currentPageActionDisplay !== 'suggestions' || isInPageDialog) && isVisible;

  if (popupIsVisible) {
    const rows = getEventsFromDoc({ state: view.state });
    const activeSuggestion = rows
      .map((row) => row.marks)
      .flat()
      .find((mark) => mark.active);
    const suggestions = activeSuggestion ? [activeSuggestion] : rows.find((row) => row.pos === rowPos)?.marks ?? [];

    return createPortal(
      <ClickAwayListener
        onClickAway={() => {
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
            {suggestions.map((suggestion) => (
              // dont show suggestion card as active when inside popup
              <ThreadContainer key={suggestion.pos + suggestion.type} elevation={4} sx={{ background: 'transparent' }}>
                <SuggestionCard
                  {...suggestion}
                  pageId={pageId}
                  spaceId={spaceId}
                  active={false}
                  readOnly={readOnly}
                  isOwner={suggestion.data.user === user?.id}
                />
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

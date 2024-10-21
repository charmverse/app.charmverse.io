import { Box, ClickAwayListener, Grow } from '@mui/material';
import type { PluginKey } from 'prosemirror-state';
import { createPortal } from 'react-dom';

import { useEditorViewContext, usePluginState } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import { useUser } from 'hooks/useUser';

import { hideSuggestionsTooltip } from '../@bangle.dev/tooltip/suggestTooltipSpec';
import { ThreadContainer } from '../inlineComment/components/InlineCommentThread';

import { getEventsFromDoc } from './getEvents';
import { SuggestionCard } from './SuggestionCard';
import type { SuggestionPluginState } from './suggestions.plugins';

export function SuggestionsPopup({
  pluginKey,
  readOnly,
  pageId,
  spaceId,
  isSuggestionSidebarOpen
}: {
  pluginKey: PluginKey<SuggestionPluginState>;
  readOnly: boolean;
  pageId: string;
  spaceId: string;
  isSuggestionSidebarOpen: boolean;
}) {
  const view = useEditorViewContext();
  const { tooltipContentDOM, show: isVisible, rowPos } = usePluginState(pluginKey) as SuggestionPluginState;
  const { user } = useUser();

  const popupIsVisible = !isSuggestionSidebarOpen && isVisible;

  if (popupIsVisible) {
    const rows = getEventsFromDoc({ state: view.state });
    const activeSuggestion = rows
      .map((row) => row.marks)
      .flat()
      .find((mark) => mark.active);
    const suggestions =
      rowPos !== undefined
        ? (rows.find((row) => row.pos === rowPos)?.marks ?? [])
        : activeSuggestion
          ? [activeSuggestion]
          : [];

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

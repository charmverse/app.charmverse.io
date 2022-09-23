import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { Box, Button, ClickAwayListener, Grow, Paper, TextField } from '@mui/material';
import { useThreads } from 'hooks/useThreads';
import { createPortal } from 'react-dom';
import { hideSelectionTooltip } from '@bangle.dev/tooltip/selection-tooltip';
import charmClient from 'charmClient';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import { useInlineComment } from 'hooks/useInlineComment';
import { usePages } from 'hooks/usePages';
import type { PageContent } from 'models';
import type { PluginKey } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';
import React, { useState } from 'react';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { getTracksFromDoc } from './track/getTracks';
import { hideSuggestionsTooltip } from '../@bangle.dev/tooltip/suggest-tooltip';
import type { SuggestionPluginState } from './plugins';

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
    pos
  } = usePluginState(pluginKey) as SuggestionPluginState;
  const cardId = (new URLSearchParams(window.location.href)).get('cardId');

  const { currentPageActionDisplay } = usePageActionDisplay();
  if ((currentPageActionDisplay !== 'suggestions' || cardId) && isVisible) {
    const suggestions = getTracksFromDoc({ state: view.state });
    const suggestionPos = parseInt(pos || '', 10);
    const suggestion = suggestions.find(s => s.pos === suggestionPos || s.active);
    if (!suggestion) {
      return null;
    }
    const { active, ...rest } = suggestion; // dont show suggestion card as active
    // Only show comment thread on inline comment if the page threads list is not active
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
          <ThreadContainer elevation={4}>
            <SuggestionCard active={false} {...rest} />
          </ThreadContainer>
        </Grow>
      </ClickAwayListener>,
      tooltipContentDOM
    );
  }
  return null;
}

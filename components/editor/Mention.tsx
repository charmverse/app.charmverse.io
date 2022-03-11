import { RawSpecs } from '@bangle.dev/core';
import { Command, DOMOutputSpec, PluginKey } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { useTheme } from '@emotion/react';
import { ClickAwayListener } from '@mui/material';
import * as emojiSuggest from 'components/editor/@bangle.dev/react-emoji-suggest/emoji-suggest';
import { getSuggestTooltipKey } from 'components/editor/@bangle.dev/react-emoji-suggest/emoji-suggest';
import * as suggestTooltip from 'components/editor/@bangle.dev/tooltip/suggest-tooltip';
import { useCallback } from 'react';
import { createPortal } from 'react-dom';

const name = 'mention';

export const mentionSuggestKey = new PluginKey('mentionSuggestKey');
export const mentionSuggestMarkName = 'mentionSuggest';
export const mentionTrigger = '@';

export function mentionSpec (): RawSpecs {
  return [
    {
      type: 'node',
      name,
      schema: {
        attrs: {
          value: {
            default: null
          },
          type: {
            default: 'user'
          }
        },
        inline: true,
        group: 'inline',
        draggable: true,
        atom: true,
        parseDOM: [{ tag: 'span' }],
        toDOM: (): DOMOutputSpec => {
          return ['span', { class: 'mention' }];
        }
      }
    },
    emojiSuggest.spec({ markName: mentionSuggestMarkName, trigger: mentionTrigger })
  ];
}

export function mentionPlugins () {
  return emojiSuggest.plugins({
    key: mentionSuggestKey,
    markName: mentionSuggestMarkName,
    tooltipRenderOpts: {
      placement: 'bottom'
    }
  });
}

export function selectMention (key: PluginKey, mentionValue: string, mentionType: string): Command {
  return (state, dispatch, view) => {
    const mentionNode = state.schema.nodes.mention.create({
      value: mentionValue,
      type: mentionType
    });

    const suggestKey = getSuggestTooltipKey(key)(state);

    return suggestTooltip.replaceSuggestMarkWith(suggestKey, mentionNode)(
      state,
      dispatch,
      view
    );
  };
}

export function MentionSuggest () {
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    suggestTooltipKey
  } = usePluginState(mentionSuggestKey);

  const {
    show: isVisible
  } = usePluginState(suggestTooltipKey);

  const theme = useTheme();

  function closeTooltip () {
    if (view.dispatch!) {
      view.dispatch(
        // Chain transactions together
        view.state.tr.setMeta(suggestTooltipKey, { type: 'HIDE_TOOLTIP' }).setMeta('addToHistory', false)
      );
    }
  }

  const onSelectMention = useCallback(
    (value: string, type: string) => {
      selectMention(mentionSuggestKey, value, type)(view.state, view.dispatch, view);
      closeTooltip();
    },
    [view, mentionSuggestKey]
  );

  if (isVisible) {
    return createPortal(
      <ClickAwayListener onClickAway={closeTooltip}>
        <div>Hello World</div>
      </ClickAwayListener>,
      tooltipContentDOM
    );
  }
  return null;
}

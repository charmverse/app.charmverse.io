import type { SpecRegistry } from '@bangle.dev/core';
import type { Command, EditorState, EditorView, Schema } from '@bangle.dev/pm';
import { Plugin, PluginKey } from '@bangle.dev/pm';
import { createTooltipDOM } from '@bangle.dev/tooltip';

import * as suggestTooltip from '../@bangle.dev/tooltip/suggest-tooltip';

import { markName } from './emojiSuggest.constants';

export const plugins = pluginsFactory;
export const commands = {
  queryTriggerText,
  selectEmoji
};

function pluginsFactory ({
  key
}: {
  key: PluginKey;
}) {
  return ({
    specRegistry
  }: {
    schema: Schema;
    specRegistry: SpecRegistry;
  }) => {
    const { trigger } = specRegistry.options[markName as any] as any;

    const suggestTooltipKey = new PluginKey('suggestTooltipKey');

    const tooltipRenderOpts: suggestTooltip.SuggestTooltipRenderOpts = {
      getScrollContainer,
      placement: 'bottom-start'
    };

    // We are converting to DOM elements so that their instances
    // can be shared across plugins.
    const tooltipDOMSpec = createTooltipDOM(tooltipRenderOpts.tooltipDOMSpec);

    return [
      new Plugin({
        key,
        state: {
          init () {
            return {
              tooltipContentDOM: tooltipDOMSpec.contentDOM,
              markName,
              suggestTooltipKey
            };
          },
          apply (_, pluginState) {
            return pluginState;
          }
        }
      }),
      suggestTooltip.plugins({
        key: suggestTooltipKey,
        markName,
        trigger,
        tooltipRenderOpts: {
          ...tooltipRenderOpts,
          tooltipDOMSpec
        }
      })
    ];
  };
}

function getScrollContainer (view: EditorView) {
  return view.dom.parentElement!;
}

export function getSuggestTooltipKey (key: PluginKey) {
  return (state: EditorState) => {
    return key.getState(state).suggestTooltipKey as PluginKey;
  };
}

/** Commands */
export function queryTriggerText (key: PluginKey) {
  return (state: EditorState) => {
    const suggestKey = getSuggestTooltipKey(key)(state);
    return suggestTooltip.queryTriggerText(suggestKey)(state);
  };
}

export function selectEmoji (key: PluginKey, emoji: string): Command {
  return (state, dispatch, view) => {
    const emojiNode = state.schema.nodes.emoji.create({
      emoji
    });

    const suggestKey = getSuggestTooltipKey(key)(state);

    return suggestTooltip.replaceSuggestMarkWith(suggestKey, emojiNode)(
      state,
      dispatch,
      view
    );
  };
}

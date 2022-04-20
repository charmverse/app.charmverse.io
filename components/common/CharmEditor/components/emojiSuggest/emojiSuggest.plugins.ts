import { SpecRegistry } from '@bangle.dev/core';
import { Command, EditorState, Plugin, PluginKey, Schema } from '@bangle.dev/pm';
import { createTooltipDOM, SuggestTooltipRenderOpts } from '@bangle.dev/tooltip';
import * as suggestTooltip from '../@bangle.dev/tooltip/suggest-tooltip';
import { markName, pluginKey } from './emojiSuggest.constants';

export const plugins = pluginsFactory;
export const commands = {
  queryTriggerText,
  selectEmoji
};

function pluginsFactory ({
  tooltipRenderOpts = {}
}: {
  tooltipRenderOpts?: SuggestTooltipRenderOpts;
} = {}) {
  return ({
    specRegistry
  }: {
    schema: Schema;
    specRegistry: SpecRegistry;
  }) => {
    const { trigger } = specRegistry.options[markName as any] as any;

    const suggestTooltipKey = new PluginKey('suggestTooltipKey');

    // We are converting to DOM elements so that their instances
    // can be shared across plugins.
    const tooltipDOMSpec = createTooltipDOM(tooltipRenderOpts.tooltipDOMSpec);

    return [
      new Plugin({
        key: pluginKey,
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

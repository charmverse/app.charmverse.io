import * as suggestTooltip from '@packages/bangleeditor/components/@bangle.dev/tooltip/suggestTooltipSpec';
import type { Schema } from 'prosemirror-model';
import type { Command, EditorState } from 'prosemirror-state';
import { Plugin, PluginKey } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import type { SpecRegistry } from '../@bangle.dev/core/specRegistry';
import { createTooltipDOM } from '../@bangle.dev/tooltip/createTooltipDOM';
import * as suggestTooltipPlugins from '../@bangle.dev/tooltip/suggestTooltipPlugin';

import { markName } from './emojiSuggest.constants';

export const plugins = pluginsFactory;
export const commands = {
  queryTriggerText,
  selectEmoji
};

function pluginsFactory({ key }: { key: PluginKey }) {
  return ({ specRegistry }: { schema: Schema; specRegistry: SpecRegistry }) => {
    const { trigger } = specRegistry.options[markName as any] as any;

    const suggestTooltipKey = new PluginKey('suggestTooltipKey');

    const tooltipRenderOpts: suggestTooltipPlugins.SuggestTooltipRenderOpts = {
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
          init() {
            return {
              tooltipContentDOM: tooltipDOMSpec.contentDOM,
              markName,
              suggestTooltipKey
            };
          },
          apply(_, pluginState) {
            return pluginState;
          }
        }
      }),
      suggestTooltipPlugins.plugins({
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

function getScrollContainer(view: EditorView) {
  return view.dom.parentElement!;
}

function getSuggestTooltipKey(key: PluginKey) {
  return (state: EditorState) => {
    const pluginState = key.getState(state);
    if (pluginState) {
      return pluginState.suggestTooltipKey as PluginKey;
    }
    return '';
  };
}

/** Commands */
export function queryTriggerText(key: PluginKey) {
  return (state: EditorState) => {
    const suggestKey = getSuggestTooltipKey(key)(state);
    if (suggestKey) {
      return suggestTooltip.queryTriggerText(suggestKey)(state);
    }
    return '';
  };
}

export function selectEmoji(key: PluginKey, emoji: string): Command {
  return (state, dispatch, view) => {
    const emojiNode = state.schema.nodes.emoji.create({
      emoji
    });

    const suggestKey = getSuggestTooltipKey(key)(state);
    if (suggestKey) {
      return suggestTooltip.replaceSuggestMarkWith(suggestKey, emojiNode)(state, dispatch, view);
    }
    return false;
  };
}

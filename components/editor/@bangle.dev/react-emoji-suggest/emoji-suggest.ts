import { BaseRawMarkSpec, SpecRegistry } from '@bangle.dev/core';
import { Command, EditorState, Plugin, PluginKey, Schema } from '@bangle.dev/pm';
import { EmojiGroupType } from '@bangle.dev/react-emoji-suggest/types';
import { resolveCounter } from '@bangle.dev/react-emoji-suggest/utils';
import { createTooltipDOM, SuggestTooltipRenderOpts } from '@bangle.dev/tooltip';
import {
  rafCommandExec,
  uuid
} from '@bangle.dev/utils';
import * as suggestTooltip from "components/editor/@bangle.dev/tooltip/suggest-tooltip";

const {
  removeSuggestMark,
  resetSuggestTooltipCounter,
} = suggestTooltip;

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  queryTriggerText,
  selectEmoji,
};

const defaultTrigger = ':';
const defaultMaxItems = 2000;

function specFactory({
  markName,
  trigger = defaultTrigger,
}: {
  markName: string;
  trigger?: string;
}): BaseRawMarkSpec {
  const spec = suggestTooltip.spec({ markName, trigger });

  return {
    ...spec,
    options: {
      trigger,
    },
  };
}

export type GetEmojiGroupsType = (queryText: string) => EmojiGroupType;

function pluginsFactory({
  key = new PluginKey('emojiSuggestMenu'),
  markName,
  tooltipRenderOpts = {},
  getEmojiGroups,
}: {
  markName: string;
  key?: PluginKey;
  tooltipRenderOpts?: SuggestTooltipRenderOpts;
  getEmojiGroups: GetEmojiGroupsType;
}) {
  return ({
    schema,
    specRegistry,
  }: {
    schema: Schema;
    specRegistry: SpecRegistry;
  }) => {
    const { trigger } = specRegistry.options[markName as any] as any;

    const suggestTooltipKey = new PluginKey('suggestTooltipKey');

    // We are converting to DOM elements so that their instances
    // can be shared across plugins.
    const tooltipDOMSpec = createTooltipDOM(tooltipRenderOpts.tooltipDOMSpec);

    const selectedEmojiSquareId = uuid(6);

    return [
      new Plugin({
        key,
        state: {
          init() {
            return {
              getEmojiGroups,
              tooltipContentDOM: tooltipDOMSpec.contentDOM,
              markName,
              selectedEmojiSquareId,
              suggestTooltipKey,
              getPos: null,
              onClick: () => {}
            };
          },
          apply(tr, pluginState) {
            const meta = tr.getMeta(key);
            if (meta === undefined) {
              return pluginState;
            }
          },
        },
      }),
      suggestTooltip.plugins({
        key: suggestTooltipKey,
        markName,
        trigger,
        tooltipRenderOpts: {
          ...tooltipRenderOpts,
          tooltipDOMSpec,
        },

        onEnter: (state, dispatch, view) => {
          const emojiGroups = getEmojiGroups(queryTriggerText(key)(state));
          const matchedEmojis = emojiGroups.flatMap((r) => r.emojis);
          if (matchedEmojis.length === 0) {
            return removeSuggestMark(key)(state, dispatch, view);
          }

          const { counter } = suggestTooltipKey.getState(state);
          const { item: activeItem } = resolveCounter(counter, emojiGroups);

          if (!activeItem) {
            return removeSuggestMark(key)(state, dispatch, view);
          }

          const emojiAlias = activeItem[0];
          view &&
            rafCommandExec(view, resetSuggestTooltipCounter(suggestTooltipKey));
          return selectEmoji(key, emojiAlias)(state, dispatch, view);
        },
      }),
    ];
  };
}

export function getSuggestTooltipKey(key: PluginKey) {
  return (state: EditorState) => {
    return key.getState(state).suggestTooltipKey as PluginKey;
  };
}

/** Commands */
export function queryTriggerText(key: PluginKey) {
  return (state: EditorState) => {
    const suggestKey = getSuggestTooltipKey(key)(state);
    return suggestTooltip.queryTriggerText(suggestKey)(state);
  };
}

export function selectEmoji(key: PluginKey, emojiAlias: string): Command {
  return (state, dispatch, view) => {
    const emojiNode = state.schema.nodes.emoji.create({
      emojiAlias: emojiAlias,
    });

    const suggestKey = getSuggestTooltipKey(key)(state);

    return suggestTooltip.replaceSuggestMarkWith(suggestKey, emojiNode)(
      state,
      dispatch,
      view,
    );
  };
}

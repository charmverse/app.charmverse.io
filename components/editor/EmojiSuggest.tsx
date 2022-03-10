import { PluginKey } from '@bangle.dev/core';
import { emojiSpec } from 'components/editor/@bangle.dev/emoji/emoji';
import * as emojiSuggest from 'components/editor/@bangle.dev/react-emoji-suggest/emoji-suggest';
import { EmojiSuggest } from 'components/editor/@bangle.dev/react-emoji-suggest/EmojiSuggest';
import gemojiData from 'emoji-lookup-data/data/gemoji.json';

export const emojiSuggestKey = new PluginKey('emojiSuggestKey');
export const emojiSuggestMarkName = 'emojiSuggest';

const emojiData = Object.values(
  gemojiData.reduce((prev, obj) => {
    if (!prev[obj.category]) {
      prev[obj.category] = { name: obj.category, emojis: [] };
    }
    prev[obj.category].emojis.push([obj.aliases[0], obj.emoji]);

    return prev;
  }, {} as Record<string, { name: string, emojis: [string, string][] }>)
);

export const getEmojiByAlias = (emojiAlias: string) => {
  for (const { emojis } of emojiData) {
    const match = emojis.find(e => e[0] === emojiAlias);
    if (match) {
      return match;
    }
  }
};

export const emojiSpecs = () => {
  return [
    emojiSpec({}),
    emojiSuggest.spec({ markName: emojiSuggestMarkName })
  ];
};

export const emojiPlugins = () => {
  return [
    emojiSuggest.plugins({
      key: emojiSuggestKey,
      markName: emojiSuggestMarkName,
      tooltipRenderOpts: {
        placement: 'bottom'
      }
    })
  ];
};

export default <EmojiSuggest emojiSuggestKey={emojiSuggestKey} />;

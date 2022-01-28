import { PluginKey } from '@bangle.dev/core';
import { emoji } from '@bangle.dev/emoji';
import { EmojiSuggest as BangleEmojiSuggest, emojiSuggest } from '@bangle.dev/react-emoji-suggest';
import gemojiData from 'emoji-lookup-data/data/gemoji.json';

const emojiSuggestKey = new PluginKey('emojiSuggestKey');

const emojiData = Object.values(
  gemojiData.reduce((prev, obj) => {
    if (!prev[obj.category]) {
      prev[obj.category] = { name: obj.category, emojis: [] };
    }
    prev[obj.category].emojis.push([obj.aliases[0], obj.emoji]);

    return prev;
  }, {} as Record<string, { name: string, emojis: [string, string][] }>),
);

const getEmojiByAlias = (emojiAlias: string) => {
  for (const { emojis } of emojiData) {
    const match = emojis.find((e) => e[0] === emojiAlias);
    if (match) {
      return match;
    }
  }
};

export const emojiSpecs = () => {
  return [
    emoji.spec({
      getEmoji: (emojiAlias) =>
        (getEmojiByAlias(emojiAlias) || ['question', '❓'])[1],
    }),
    emojiSuggest.spec({ markName: 'emojiSuggest' }),
  ]
};

export const emojiPlugins = () => {
  return [
    emoji.plugins(),
    emojiSuggest.plugins({
      key: emojiSuggestKey,
      getEmojiGroups: (queryText) => {
        if (!queryText) {
          return emojiData;
        }
        return emojiData
          .map((group) => {
            return {
              name: group.name,
              emojis: group.emojis.filter(([emojiAlias]) =>
                emojiAlias.includes(queryText),
              ),
            };
          })
          .filter((group) => group.emojis.length > 0);
      },
      markName: 'emojiSuggest',
      tooltipRenderOpts: {
        placement: 'bottom',
      },
    })
  ]
}

export default () => {
  return <BangleEmojiSuggest emojiSuggestKey={emojiSuggestKey} />
};
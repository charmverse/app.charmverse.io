import { PluginKey } from '@bangle.dev/core';
import { emojiSpec } from 'components/editor/@bangle.dev/emoji/emoji';
import * as emojiSuggest from 'components/editor/@bangle.dev/react-emoji-suggest/emoji-suggest';
import { EmojiSuggest } from 'components/editor/@bangle.dev/react-emoji-suggest/EmojiSuggest';

export const emojiSuggestKey = new PluginKey('emojiSuggestKey');
export const emojiSuggestMarkName = 'emojiSuggest';

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

import { PluginKey } from '@bangle.dev/core';
import { emojiSpec } from 'components/common/CharmEditor/components/@bangle.dev/emoji/emoji';
import * as emojiSuggest from './EmojiSuggest/EmojiSuggest.plugin';
import { EmojiSuggest } from './EmojiSuggest/EmojiSuggest';

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

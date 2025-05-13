import { log } from '@charmverse/core/log';
import { getTwitterEmoji } from '@packages/lib/utils/emoji';

import { domSerializationHelpers } from '../@bangle.dev/core/domSerializationHelpers';
import type { RawSpecs, BaseRawMarkSpec } from '../@bangle.dev/core/specRegistry';
import { spec as suggestTooltipSpec } from '../@bangle.dev/tooltip/suggestTooltipSpec';

import { markName } from './emojiSuggest.constants';

const defaultTrigger = ':';
const name = 'emoji';

export function specs() {
  return [emojiSpec(), specMark()];
}

function emojiSpec({ defaultEmoji = '😃' }: { defaultEmoji?: string } = {}): RawSpecs {
  const { parseDOM, toDOM } = domSerializationHelpers(name, {
    tag: 'span',
    parsingPriority: 51,
    content: (node) => {
      return node.attrs.emoji;
    }
  });

  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        emoji: {
          default: defaultEmoji
        }
      },
      inline: true,
      group: 'inline',
      draggable: false,
      atom: true,
      // format emoji for plain text
      leafText: (node) => {
        return node.attrs.emoji;
      },
      toDOM: (node) => {
        const twemojiImage = getTwitterEmoji(node.attrs.emoji);
        return twemojiImage
          ? ['img', { src: twemojiImage, style: 'width: 18px; height: 18px; position: relative; top: 4px;' }]
          : toDOM(node);
      },
      parseDOM,
      selectable: true
    },
    markdown: {
      toMarkdown: (state, node) => {
        if (node.attrs?.emoji) {
          try {
            state.text(node.attrs.emoji);
          } catch (err) {
            log.warn('Conversion err', err);
          }
        }
      }
    }
  };
}

function specMark({
  trigger = defaultTrigger
}: {
  trigger?: string;
} = {}): BaseRawMarkSpec {
  const _spec = suggestTooltipSpec({ markName, trigger });

  return {
    ..._spec,
    markdown: {
      toMarkdown: {
        open: '',
        close: '',
        mixable: false,
        expelEnclosingWhitespace: true
      }
    },
    options: {
      trigger
    }
  };
}

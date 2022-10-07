
import type { RawSpecs, BaseRawMarkSpec } from '@bangle.dev/core';
import { domSerializationHelpers } from '@bangle.dev/core';

import { getTwitterEmoji } from 'components/common/Emoji';
import log from 'lib/log';

import * as suggestTooltip from '../@bangle.dev/tooltip/suggest-tooltip';

import { markName } from './emojiSuggest.constants';

const defaultTrigger = ':';
const name = 'emoji';

export function specs () {
  return [
    emojiSpec(),
    specMark()
  ];
}

function emojiSpec ({ defaultEmoji = '😃' }: { defaultEmoji?: string } = {}): RawSpecs {
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
      toDOM: (node) => {
        const twemojiImage = getTwitterEmoji(node.attrs.emoji);
        return twemojiImage ? ['img', { src: twemojiImage,
          style: 'width: 18px; height: 18px; position: relative; top: 4px;' }] : toDOM(node);
      },
      parseDOM,
      selectable: true
    },
    markdown: {
      toMarkdown: (state, node) => {
        try {
          state.text(node.attrs.emoji);
        }
        catch (err) {
          log.warn('Conversion err', err);
        }
      }
    }
  };
}

function specMark ({
  trigger = defaultTrigger
}: {
  trigger?: string;
} = {}): BaseRawMarkSpec {
  const _spec = suggestTooltip.spec({ markName, trigger });

  return {
    ..._spec,
    options: {
      trigger
    }
  };
}

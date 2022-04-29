
import { domSerializationHelpers, RawSpecs, BaseRawMarkSpec } from '@bangle.dev/core';
import { markName } from './emojiSuggest.constants';
import * as suggestTooltip from '../@bangle.dev/tooltip/suggest-tooltip';

const defaultTrigger = ':';
const name = 'emoji';

export function specs () {
  return [
    emojiSpec(),
    specMark()
  ];
}

function emojiSpec ({ defaultEmoji = '😃' }: { defaultEmoji?: string } = {}): RawSpecs {
  const { toDOM, parseDOM } = domSerializationHelpers(name, {
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
      draggable: true,
      atom: true,
      toDOM,
      parseDOM,
      selectable: true,
      allowGapCursor: true
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

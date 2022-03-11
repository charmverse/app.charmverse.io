import { domSerializationHelpers, RawSpecs } from "@bangle.dev/core";

const name = 'emoji';

export function emojiSpec({
  defaultEmoji = '😃',
}: {
  defaultEmoji?: string;
}): RawSpecs {
  const { toDOM, parseDOM } = domSerializationHelpers(name, {
    tag: 'span',
    parsingPriority: 51,
    content: (node) => {
      return node.attrs.emoji;
    },
  });

  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        emoji: {
          default: defaultEmoji,
        },
      },
      inline: true,
      group: 'inline',
      draggable: true,
      atom: true,
      toDOM,
      parseDOM,
    },
  };
}
import type { RawSpecs } from '@bangle.dev/core';
import type { Node } from '@bangle.dev/pm';

import type { TweetNodeAttrs } from 'lib/twitter/interface';

export const name = 'tweet';

export function spec(): RawSpecs {
  return {
    type: 'node',
    name,
    markdown: {
      toMarkdown: (state, node) => {
        const { screenName, id } = node.attrs as TweetNodeAttrs;

        if (screenName && id) {
          const toRender = `Embedded Twitter Url: https://twitter.com/${screenName}/status/${id}`;

          // Ensure markdown html will be separated by newlines
          state.ensureNewLine();
          state.text(toRender);
          state.ensureNewLine();
        }
      }
    },
    schema: {
      attrs: {
        screenName: {
          default: ''
        },
        id: {
          default: ''
        },
        track: {
          default: []
        }
      },
      group: 'block',
      inline: false,
      draggable: false,
      isolating: true, // dont allow backspace to delete
      parseDOM: [
        {
          tag: 'tweet-embed',
          getAttrs: (dom: any) => {
            return {
              screenName: dom.getAttribute('data-screen-name'),
              tweetId: dom.getAttribute('data-tweet-id')
            };
          }
        }
      ],
      toDOM: (node: Node) => {
        return ['tweet-embed', { 'data-tweet-id': node.attrs.tweetId, 'data-screen-name': node.attrs.screenName }];
      }
    }
  };
}

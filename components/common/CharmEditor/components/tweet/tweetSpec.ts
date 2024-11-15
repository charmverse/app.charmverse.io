import type { Node } from 'prosemirror-model';

import type { RawSpecs } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

export const name = 'tweet';

export type TweetNodeAttrs = {
  id: string;
  screenName: string;
};

// a function to extract user screen name and tweet id from a tweet url
export function extractTweetAttrs(url: string): TweetNodeAttrs | null {
  if (!url) {
    return null;
  }

  const match = url.match(/twitter\.com\/([^/]+)\/status\/(\d+)/);
  if (!match) {
    return null;
  }
  return {
    screenName: match[1],
    id: match[2]
  };
}
export function spec(): RawSpecs {
  return {
    type: 'node',
    name,
    markdown: {
      toMarkdown: (state, node) => {
        const { screenName, id } = node.attrs as TweetNodeAttrs;

        if (screenName && id) {
          const toRender = `Embedded Twitter Url: https://x.com/${screenName}/status/${id}`;

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

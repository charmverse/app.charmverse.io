import type { RawSpecs } from '@bangle.dev/core';
import { Plugin, NodeView } from '@bangle.dev/core';
import type { EditorView, Node, Slice } from '@bangle.dev/pm';

import { insertNode } from 'lib/prosemirror/insertNode';

const name = 'tweet';

export interface TweetNodeAttrs {
  id: string;
  screenName: string;
}

// a function to extract user screen name and tweet id from a tweet url
export function extractTweetAttrs (url: string): TweetNodeAttrs | null {

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

// inject a tweet node when pasting twitter url

export function plugins () {
  return [
    NodeView.createPlugin({
      name: 'tweet',
      containerDOM: ['tweet-embed']
    }),
    new Plugin({
      props: {
        handlePaste: (view: EditorView, rawEvent: ClipboardEvent, slice: Slice) => {
          // @ts-ignore
          const contentRow = slice.content.content?.[0]?.content.content;
          const tweetParams = extractTweetAttrs(contentRow?.[0]?.text);
          if (tweetParams) {
            insertNode(name, view.state, view.dispatch, view, tweetParams);
            return true;
          }
          return false;
        }
      }
    })
  ];
}

export function spec (): RawSpecs {
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
              screenName: dom.getAttribute('screen-name'),
              tweetId: dom.getAttribute('tweet-id')
            };
          }
        }
      ],
      toDOM: (node: Node) => {
        return ['tweet-embed', { 'tweet-id': node.attrs.tweetId, 'screen-name': node.attrs.screenName }];
      }
    }
  };
}

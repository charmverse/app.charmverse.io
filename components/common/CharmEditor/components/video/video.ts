import { NodeView } from '@bangle.dev/core';

export { spec } from './videoSpec';

// inject a tweet node when pasting twitter url

export function plugins() {
  return [
    NodeView.createPlugin({
      name: 'video',
      containerDOM: ['video-embed']
    })
  ];
}

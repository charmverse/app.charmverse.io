import { NodeView } from '../@bangle.dev/core/node-view';

// inject a tweet node when pasting twitter url

export function plugins() {
  return [
    NodeView.createPlugin({
      name: 'video',
      containerDOM: ['div', { class: 'video-container' }]
    })
  ];
}

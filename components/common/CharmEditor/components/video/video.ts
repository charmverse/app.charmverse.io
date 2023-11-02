import { NodeView } from '../@bangle.dev/core/node-view';

export { spec } from './videoSpec';

// inject a tweet node when pasting twitter url

export function plugins() {
  return [
    NodeView.createPlugin({
      name: 'video',
      containerDOM: ['div', { class: 'video-container' }]
    })
  ];
}

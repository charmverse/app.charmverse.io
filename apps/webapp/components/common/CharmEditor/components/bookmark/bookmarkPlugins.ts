import { NodeView } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';

export function plugins() {
  return NodeView.createPlugin({
    name: 'bookmark',
    containerDOM: ['div', { draggable: 'false' }]
  });
}

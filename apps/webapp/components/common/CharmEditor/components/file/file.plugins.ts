import { NodeView } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';

export function plugins() {
  return [
    NodeView.createPlugin({
      name: 'file',
      containerDOM: ['div', { draggable: 'false' }]
    })
  ];
}

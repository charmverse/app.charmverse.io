import type { NodeViewProps } from '../../@bangle.dev/core/node-view';
import { NestedPage } from '../../nestedPage/components/NestedPage';

export function LinkedPage(props: NodeViewProps) {
  return <NestedPage isLinkedPage {...props} />;
}

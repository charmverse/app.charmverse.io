import { log } from '@charmverse/core/log';
import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { flushSync } from 'react-dom';

import { saveRenderHandlers } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';
import type { NodeView, RenderHandlers } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';

export const nodeViewUpdateStore = new WeakMap();

type NodeViewsUpdater = (nodeViewUpdateStore: NodeView[]) => NodeView[];
type UpdateNodeViewsFunction = (updater: NodeViewsUpdater) => void;

const nodeViewRenderHandlers = (updateNodeViews: UpdateNodeViewsFunction): RenderHandlers => ({
  create: (nodeView, _nodeViewProps) => {
    // log.debug('create', objectUid.get(nodeView), new Error().stack);
    updateNodeViews((nodeViews) => [...nodeViews, nodeView]);
  },
  update: (nodeView, _nodeViewProps) => {
    // log.debug('update', objectUid.get(nodeView));
    const updateCallback = nodeViewUpdateStore.get(nodeView);
    // If updateCallback is undefined (which can happen if react took long to mount),
    // we are still okay, as the latest nodeViewProps will be accessed whenever it mounts.
    if (updateCallback) {
      updateCallback();
    }
  },
  destroy: (nodeView) => {
    // log.debug('destroy', objectUid.get(nodeView));
    updateNodeViews((nodeViews) => nodeViews.filter((n) => n !== nodeView));
  }
});

export function useNodeViews(ref: RefObject<HTMLElement>) {
  const [nodeViews, setNodeViews] = useState<NodeView[]>([]);
  useEffect(() => {
    // save the renderHandlers in the dom to decouple nodeView instantiating code
    // from the editor. Since PM passing view when nodeView is created, the author
    // of the component can get the handler reference from `getRenderHandlers(view)`.
    // Note: this assumes that the pm's dom is the direct child of `editorRenderTarget`.
    let destroyed = false;
    saveRenderHandlers(
      ref.current!,
      nodeViewRenderHandlers((cb) => {
        if (!destroyed) {
          // make sure that updates run sequentially for prosemiror, or we get infinite recursion of node views being created and destroyed.
          // See also: https://github.com/ueberdosis/tiptap/pull/2985
          flushSync(() => {
            // use callback variant of setState to
            // always get freshest nodeViews.
            setNodeViews((_nodeViews) => cb(_nodeViews));
          });
        }
      })
    );
    return () => {
      destroyed = true;
    };
  }, [ref]);

  return nodeViews;
}

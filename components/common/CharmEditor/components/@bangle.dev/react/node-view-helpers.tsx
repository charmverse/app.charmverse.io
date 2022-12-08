import type { NodeView, RenderHandlers } from '@bangle.dev/core';
import { saveRenderHandlers } from '@bangle.dev/core';
import { objectUid } from '@bangle.dev/utils';
import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

import log from 'lib/log';

export const nodeViewUpdateStore = new WeakMap();

type NodeViewsUpdater = (nodeViewUpdateStore: NodeView[]) => NodeView[];
type UpdateNodeViewsFunction = (updater: NodeViewsUpdater) => void;

export const nodeViewRenderHandlers = (updateNodeViews: UpdateNodeViewsFunction): RenderHandlers => ({
  create: (nodeView, _nodeViewProps) => {
    // log.debug('create', objectUid.get(nodeView));
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
          // use callback variant of setState to
          // always get freshest nodeViews.
          setNodeViews((_nodeViews) => cb(_nodeViews));
        }
      })
    );
    return () => {
      destroyed = true;
    };
  }, [ref]);

  return nodeViews;
}

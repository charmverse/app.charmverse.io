import { Plugin, NodeView } from '@bangle.dev/core';
import { TextSelection } from '@bangle.dev/pm';
import type { PageType } from '@charmverse/core/prisma-client';

import { emitSocketMessage } from 'hooks/useWebSocketClient';

import { HOVERED_PAGE_NODE_CLASS, pageNodeDropPluginKey } from '../prosemirror/prosemirror-dropcursor/dropcursor';

export function nestedPagePlugins() {
  return () => {
    return [
      NodeView.createPlugin({
        name: 'page',
        containerDOM: ['div', { class: 'page-container' }]
      })
    ];
  };
}

export function pageNodeDropPlugin({ pageId }: { pageId?: string | null }) {
  return () => {
    return [
      new Plugin({
        key: pageNodeDropPluginKey,
        state: {
          init: () => {
            return {
              hoveredDomNode: null
            };
          },
          apply: (tr, pluginState: { hoveredDomNode: Element | null }) => {
            const newPluginState = tr.getMeta(pageNodeDropPluginKey);
            if (newPluginState) {
              return { ...pluginState, ...newPluginState };
            }
            return pluginState;
          }
        },
        props: {
          handleDOMEvents: {
            drop(view, ev) {
              const hoveredDomNode = pageNodeDropPluginKey.getState(view.state).hoveredDomNode as Element;
              view.dispatch(view.state.tr.setMeta(pageNodeDropPluginKey, { hoveredDomNode: null }));
              hoveredDomNode?.classList.remove(HOVERED_PAGE_NODE_CLASS);

              if (!ev.dataTransfer || !pageId) {
                return false;
              }

              const sidebarPageData = ev.dataTransfer.getData('sidebar-page');

              const hoveredPageId = hoveredDomNode?.getAttribute('data-id')?.split('page-')[1];

              if (sidebarPageData) {
                const coordinates = view.posAtCoords({
                  left: ev.clientX,
                  top: ev.clientY
                });

                if (!coordinates) {
                  return false;
                }

                try {
                  const parsedData = JSON.parse(sidebarPageData) as { pageId: string | null; pageType: PageType };
                  if (!parsedData.pageId) {
                    return false;
                  }
                  ev.preventDefault();
                  emitSocketMessage(
                    {
                      type: 'page_reordered_sidebar_to_editor',
                      payload: {
                        pageId: parsedData.pageId,
                        newParentId: hoveredPageId ?? pageId,
                        dropPos: hoveredPageId
                          ? null
                          : coordinates.pos + (view.state.doc.nodeAt(coordinates.pos) ? 0 : 1)
                      }
                    },
                    () => {
                      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 0)));
                    }
                  );
                  // + 1 for dropping in non empty node
                  // + 0 for dropping in empty node (blank line)
                  return false;
                } catch (_) {
                  return false;
                }
              } else if (hoveredDomNode) {
                const draggedNode = view.state.doc.nodeAt(view.state.selection.$anchor.pos);

                if (!draggedNode || hoveredDomNode.getAttribute('data-page-type') !== 'page') {
                  return false;
                }

                const draggedPageId = draggedNode.attrs.id;

                if (!hoveredPageId || hoveredPageId === draggedPageId) {
                  return false;
                }

                ev.preventDefault();
                emitSocketMessage(
                  {
                    type: 'page_reordered_editor_to_editor',
                    payload: {
                      pageId: draggedPageId,
                      newParentId: hoveredPageId,
                      draggedNode: draggedNode.toJSON(),
                      dragNodePos: view.state.selection.$anchor.pos,
                      currentParentId: pageId
                    }
                  },
                  () => {
                    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 0)));
                  }
                );
                return false;
              }

              return false;
            }
          }
        }
      })
    ];
  };
}

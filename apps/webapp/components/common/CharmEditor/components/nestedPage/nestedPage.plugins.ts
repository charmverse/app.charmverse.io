import type { PageType } from '@charmverse/core/prisma-client';
import { TextSelection, Plugin } from 'prosemirror-state';

import { NodeView } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';
import { emitSocketMessage } from 'hooks/useWebSocketClient';

import { pageNodeDropPluginKey } from '../prosemirror/prosemirror-dropcursor/dropcursor';

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
              hoveredPageDomNode: null
            };
          },
          apply: (tr, pluginState: { hoveredPageDomNode: HTMLElement | null }) => {
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
              const hoveredPageDomNode = pageNodeDropPluginKey.getState(view.state)
                .hoveredPageDomNode as HTMLElement | null;
              view.dispatch(view.state.tr.setMeta(pageNodeDropPluginKey, { hoveredPageDomNode: null }));
              hoveredPageDomNode?.removeAttribute('id');

              if (!ev.dataTransfer || !pageId) {
                return false;
              }

              const sidebarPageData = ev.dataTransfer.getData('sidebar-page');

              const hoveredPageId = hoveredPageDomNode?.dataset.id;

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
              } else if (hoveredPageDomNode) {
                const draggedNode = view.state.doc.nodeAt(view.state.selection.$anchor.pos);

                if (!draggedNode || !hoveredPageDomNode.getAttribute('data-page-type')?.match(/(page|card)/)) {
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

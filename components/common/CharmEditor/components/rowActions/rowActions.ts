
import { createElement } from '@bangle.dev/core';
import { Plugin, PluginKey } from '@bangle.dev/pm';
import throttle from 'lodash/throttle';

// inspiration for this plugin: https://discuss.prosemirror.net/t/creating-a-wrapper-for-all-blocks/3310/9

export interface PluginState {
  tooltipDOM: HTMLElement;
  open: boolean;
  rowDOM?: HTMLElement;
  rowPos?: number;
  rowNodeOffset?: number;
  isDragging: boolean
}

export function plugins ({ key }: { key: PluginKey }) {

  const tooltipDOM = createElement(['div', { class: 'row-handle', draggable: true as any }]);

  return [

    new Plugin({
      key,
      state: {
        init: (): PluginState => {
          return {
            tooltipDOM,
            // For tooltipPlacement plugin
            open: false,
            isDragging: false
          };
        },
        apply: (tr, pluginState: PluginState) => {
          const newPluginState = tr.getMeta(key);
          if (newPluginState) {
            return { ...pluginState, ...newPluginState };
          }

          return pluginState;
        }
      },
      view: (view) => {

        view.dom.parentNode?.appendChild(tooltipDOM);

        function onMouseOver (e: MouseEventInit) {
          const pluginState = key.getState(view.state) as PluginState;
          if (!pluginState.isDragging) {
            // @ts-ignore
            const containerXOffset = e.target.getBoundingClientRect().left;
            const clientX = e.clientX as number;
            const left = (clientX - containerXOffset) < 50 ? clientX + 50 : clientX;

            const ob = view.posAtCoords({ left, top: e.clientY as number });

            if (ob) {
              // Note '.inside' refers to the position of the parent node, it is -1 if the position is at the root
              const startPos = ob.inside > 0 ? ob.inside : ob.pos;

              // Step 1. grab the top-most ancestor of the related DOM element
              const dom = view.domAtPos(startPos);
              let hoveredElement = dom.node;
              // Note: for leaf nodes, domAtPos() only returns the parent with an offset. text nodes have an offset but don't have childNodes
              // ref: https://github.com/atlassian/prosemirror-utils/issues/8
              if (dom.offset && dom.node.childNodes[dom.offset]) {
                hoveredElement = dom.node.childNodes[dom.offset];
              }
              let levels = 10; // pre-caution to prevent infinite loop
              while (hoveredElement && hoveredElement.parentNode !== view.dom && levels > 0) {
                levels -= 1;
                if (hoveredElement.parentNode && view.dom.contains(hoveredElement.parentNode)) {
                  hoveredElement = hoveredElement.parentNode;
                }
              }

              // console.log('hoveredElement', hoveredElement, 'from dom', dom);

              // @ts-ignore pm types are wrong
              if (hoveredElement && view.dom.contains(hoveredElement.parentNode) && hoveredElement.getBoundingClientRect) {
                // @ts-ignore pm types are wrong
                const box = hoveredElement.getBoundingClientRect();
                const viewBox = view.dom.getBoundingClientRect();
                const top = box.top - viewBox.top;
                tooltipDOM.style.top = `${top}px`;

                const newState = {
                  rowPos: startPos,
                  rowDOM: hoveredElement,
                  rowNodeOffset: dom.offset && dom.node.childNodes[dom.offset] ? dom.offset : 0
                };
                view.dispatch(view.state.tr.setMeta(key, newState));
              }
            }
          }
        }

        const throttled = throttle(onMouseOver, 100);

        function dragend (e: DragEvent) {
          const menuState = key.getState(view.state) as PluginState;
          if (!menuState.rowPos || !menuState.rowDOM) {
            return null;
          }

          // calculate the node at the mouse position. do it on click in case the content has changed
          let topPos = view.state.doc.resolve(menuState.rowPos);
          while (topPos.depth > 1 || (topPos.depth === 1 && topPos.parentOffset > 0)) {
            const parentOffset = topPos.pos - (topPos.parentOffset > 0 ? topPos.parentOffset : 1); // if parentOffset is 0, step back by 1
            topPos = view.state.doc.resolve(parentOffset);
          }

          // console.log('Position of row', topPos, { node: topPos.node() });

          let pmNode = topPos.node();
          // handle top-level children, where pmNode === doc
          if (menuState.rowNodeOffset && menuState.rowNodeOffset > 0) {
            const child = pmNode.maybeChild(menuState.rowNodeOffset);
            pmNode = child || pmNode;
          }

          const nodeStart = topPos.pos;
          const nodeSize = (pmNode && pmNode.type.name !== 'doc') ? pmNode.nodeSize : 0;
          let nodeEnd = nodeStart + nodeSize; // nodeSize includes the start and end tokens, so we need to subtract 1

          // dont delete past end of document - according to PM guide, use content.size not nodeSize for the doc
          if (nodeEnd > view.state.doc.content.size) {
            nodeEnd = view.state.doc.content.size;
          }

          if (pmNode) {
            const containerXOffset = (e?.target as Element)?.getBoundingClientRect().left;
            const clientX = e.clientX as number;
            const left = (clientX - containerXOffset) < 50 ? clientX + 50 : clientX;
            const ob = view.posAtCoords({ left, top: e.clientY });

            if (ob) {
              const destinationPos = ob.inside > 0 ? ob.inside : ob.pos;
              const node = view.state.doc.nodeAt(destinationPos);
              if (node) {
                // view.dispatch(view.state.tr.setMeta(key, { isDragging: true }));
                view.dispatch(
                  view.state.tr
                    .deleteRange(nodeStart, nodeEnd)
                    // Need to find the correct destinationPos
                    .insert(nodeStart < destinationPos ? destinationPos - 1 : destinationPos, pmNode)
                );
              }
            }
          }
        }

        view.dom.addEventListener('mousemove', throttled);
        tooltipDOM.addEventListener('dragstart', throttle(dragend, 100));
        // tooltipDOM.addEventListener('dragend', () => {
        //   console.log('dropped');
        // });

        return {
          destroy () {
            view.dom.removeEventListener('mousemove', throttled);
            tooltipDOM.addEventListener('dragstart', dragend);
          }
        };
      }
    })
  ];
}

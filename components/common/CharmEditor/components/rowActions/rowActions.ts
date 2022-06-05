
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
}

export function plugins ({ key }: { key: PluginKey }) {

  const tooltipDOM = createElement(['div', { class: 'row-handle' }]);

  return [

    new Plugin({
      key,
      state: {
        init: (): PluginState => {
          return {
            tooltipDOM,
            // For tooltipPlacement plugin
            open: false
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
          const isEditorEmpty = Boolean(document.querySelector('.empty-editor'));
          const rowHandleElement = document.querySelector('.row-handle') as HTMLDivElement;
          if (rowHandleElement) {
            if (!isEditorEmpty) {
              rowHandleElement.style.display = 'initial';
            }
            else {
              rowHandleElement.style.display = 'none';
            }
          }
          // @ts-ignore
          const containerXOffset = e.target.getBoundingClientRect().left;
          const clientX = e.clientX!;
          const left = (clientX - containerXOffset) < 50 ? clientX + 50 : clientX;

          const ob = view.posAtCoords({ left, top: e.clientY! });

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

        const throttled = throttle(onMouseOver, 100);

        view.dom.addEventListener('mousemove', throttled);

        return {
          destroy () {
            view.dom.removeEventListener('mousemove', throttled);
          }
        };
      }
    })
  ];
}

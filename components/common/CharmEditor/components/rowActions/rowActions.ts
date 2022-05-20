
import { createElement } from '@bangle.dev/core';
import { Fragment, Plugin, PluginKey, Node } from '@bangle.dev/pm';
import { findDomRefAtPos } from 'prosemirror-utils';
import log from 'lib/log';

// inspiration for this plugin: https://discuss.prosemirror.net/t/creating-a-wrapper-for-all-blocks/3310/9

interface PluginState {
  domElement: HTMLElement;
}

export function plugins () {

  const handlesKey = new PluginKey<PluginState>('handles');
  const domElement = createElement(['div', { class: 'row-handle' }]);

  return [

    new Plugin({
      key: handlesKey,
      view: (view) => {

        view.dom.parentNode?.appendChild(domElement);

        function onMouseOver (e: MouseEventInit) {

          const ob = view.posAtCoords({ left: e.clientX!, top: e.clientY! });

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
              domElement.style.top = `${top}px`;

              domElement.onclick = () => {

                // calculate the node at the mouse position. do it on click in case content has changed
                let topPos = view.state.doc.resolve(startPos);
                while (topPos.depth > 1 || (topPos.depth === 1 && topPos.parentOffset > 0)) {
                  const parentOffset = topPos.pos - (topPos.parentOffset > 0 ? topPos.parentOffset : 1); // if parentOffset is 0, step back by 1
                  topPos = view.state.doc.resolve(parentOffset);
                }

                // console.log('Position of row', topPos, { startPos, ogPos: ob, node: topPos.node() });

                let pmNode = topPos.node();
                if (dom.offset > 0) {
                  const child = pmNode.maybeChild(dom.offset);
                  pmNode = child || pmNode;
                }

                const nodeStart = topPos.pos;
                const nodeSize = (pmNode && pmNode.type.name !== 'doc') ? pmNode.nodeSize : 0;
                let nodeEnd = nodeStart + nodeSize; // nodeSize includes the start and end tokens, so we need to subtract 1

                // dont delete past end of document - according to PM guide, use content.size not nodeSize for the doc
                if (nodeEnd > view.state.doc.content.size) {
                  nodeEnd = view.state.doc.content.size;
                }

                log.debug('Delete range', { nodeStart, topPos: topPos.pos, pmNode, nodeEnd, nodeSize });

                view.dispatch(view.state.tr.deleteRange(nodeStart, nodeEnd));
              };
            }
          }
        }

        view.dom.addEventListener('mouseover', onMouseOver);

        return {
          destroy () {
            view.dom.removeEventListener('mouseover', onMouseOver);
          }
        };
      }
    })
  ];
}

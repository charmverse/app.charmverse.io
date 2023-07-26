import { createElement } from '@bangle.dev/core';
import type { EditorView, PluginKey } from '@bangle.dev/pm';
import { Plugin } from '@bangle.dev/pm';
import throttle from 'lodash/throttle';
import { NodeSelection } from 'prosemirror-state';
// @ts-ignore
import { __serializeForClipboard as serializeForClipboard } from 'prosemirror-view';

// TODO: Support disclosures somehow. BUt if we use 'disclosureDetails', then you cant drag/drop the toggle. There is no 'container' for the hidden contents
const containerNodeTypes = ['columnBlock', 'columnLayout', 'bulletList', 'orderedList'];

// inspiration for this plugin: https://discuss.prosemirror.net/t/creating-a-wrapper-for-all-blocks/3310/9
// helpful links:
// Indexing in PM: https://prosemirror.net/docs/guide/#doc.indexing
/**
 *
 * How it works:
 *  A Prosemirror plugin is created to listen to mouse events on the editor.
 * 1. On clicking a handle (dragStart), create a node selection a snapshot of the current row. Serialize the content that is stored in the event
 * 2. On mouse move, keep track of the document pos
 *
 *
 *
 *
 *
 */

export interface PluginState {
  tooltipDOM: HTMLElement;
  open: boolean;
  rowDOM?: HTMLElement;
  rowPos?: number;
  rowNodeOffset?: number;
}

// A Prosemirror plugin is needed to listen to mouse events on the editor.
export function plugins({ key }: { key: PluginKey }) {
  const tooltipDOM = createElement(['div', { class: 'row-handle' }]);

  // Track the pos of the row to be moved, as the cursor moves around the editor.
  // This is used to position the handlebar which appears in the margin.
  function onMouseOver(view: EditorView, e: MouseEventInit) {
    if (view.isDestroyed) {
      return;
    }
    // mouse is hovering over the editor container (left side margin for example)
    // @ts-ignore
    if (e.target === view.dom) {
      return;
    }
    // @ts-ignore
    const startPos = view.posAtDOM(e.target, 0);

    // old way of determining pos using coords - maybe not needed?
    // const docLeftMargin = 50;
    // const containerXOffset = e.target.getBoundingClientRect().left;
    // const clientX = e.clientX!;
    // const left = clientX - containerXOffset < docLeftMargin ? clientX + docLeftMargin : clientX;
    // const startPos = posAtCoords(view, { left, top: e.clientY! });

    if (startPos !== undefined) {
      // Step 1. grab the top-most ancestor of the related DOM element
      const dom = rowNodeAtPos(view, startPos);
      const rowNode = dom?.rowNode;
      // @ts-ignore pm types are wrong
      if (rowNode && view.dom.contains(rowNode.parentNode) && rowNode.getBoundingClientRect) {
        // @ts-ignore pm types are wrong
        const box = rowNode.getBoundingClientRect();
        const viewBox = view.dom.getBoundingClientRect();
        // align to the top of the row
        const top = box.top - viewBox.top;
        let left = box.left - viewBox.left - 50; // 50: some default padding
        // handle when nodes have negative margin
        if (left < 0) {
          left = 0;
        }
        // Hack: subtract the left padding from UL/OL tags - TODO: find a better way to add list padding without putting it on OL/UL tags
        if (rowNode.nodeName === 'LI') {
          left -= 24;
        }
        tooltipDOM.style.top = `${top}px`;
        tooltipDOM.style.left = `${left}px`;
        const newState = {
          rowPos: startPos,
          rowDOM: dom.rowNode,
          rowNodeOffset: dom.offset && dom.node.childNodes[dom.offset] ? dom.offset : 0
        };
        view.dispatch(view.state.tr.setMeta(key, newState));
      }
    }
  }

  const throttledMouseOver = throttle(onMouseOver, 100);

  const brokenClipboardAPI = false;

  // Listen to drag start events on the .charm-drag-handle elements and set the dragged content based on prosemiror content.
  function dragStart(view: EditorView, e: DragEvent) {
    if (!e.dataTransfer || !/charm-drag-handle/.test((e.target as HTMLElement)?.className)) return;

    const coords = { left: e.clientX + 100, top: e.clientY };
    const pos = blockPosAtCoords(view, coords);
    if (pos != null) {
      view.dispatch(
        view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)).setMeta('row-handle-is-dragging', true)
      );

      const slice = view.state.selection.content();
      const { dom, text } = serializeForClipboard(view, slice);

      e.dataTransfer.clearData();
      e.dataTransfer.setData(brokenClipboardAPI ? 'Text' : 'text/html', dom.innerHTML);
      if (!brokenClipboardAPI) e.dataTransfer.setData('text/plain', text);

      view.dragging = { slice, move: true };
    }
  }

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
      props: {
        handleDOMEvents: {
          // set meta on drop so that floating menu (selection-tooltip) can ignore the event
          drop: (view) => {
            view.dispatch(view.state.tr.setMeta('row-handle-is-dragging', true));
          },
          mousemove: (view: EditorView, event: MouseEvent) => {
            throttledMouseOver(view, event);
            return false;
          }
        }
      },
      view: (view) => {
        function onDragStart(e: DragEvent) {
          return dragStart(view, e);
        }
        view.dom.parentNode?.appendChild(tooltipDOM);
        tooltipDOM.addEventListener('dragstart', onDragStart);

        return {
          destroy() {
            // remove tooltip from DOM
            tooltipDOM.parentNode?.removeChild(tooltipDOM);
            tooltipDOM.removeEventListener('dragstart', onDragStart);
          }
        };
      }
    })
  ];
}

export function posAtCoords(view: EditorView, coords: { left: number; top: number }) {
  const pos = view.posAtCoords(coords);
  if (!pos) {
    return null;
  }
  // Note '.inside' refers to the position of the parent node, it is -1 if the position is at the root
  const startPos = pos.inside > 0 ? pos.inside : pos.pos;
  return startPos;
}

function getFirstChildBlock(children: HTMLCollection) {
  for (const child of children) {
    if (child.pmViewDesc?.node?.isBlock) {
      return child;
    }
  }
}

export function rowNodeAtPos(
  view: EditorView,
  startPos: number
): null | { node: HTMLElement; rowNode: HTMLElement; offset: number } {
  const dom = view.domAtPos(startPos);
  let rowNode = dom.node;
  // if startPos = 0, domAtPos gives us the doc container
  if (rowNode === view.dom) {
    rowNode = getFirstChildBlock(view.dom.children) || view.dom;
  }
  // Note: for leaf nodes, domAtPos() only returns the parent with an offset. text nodes have an offset but don't have childNodes
  // ref: https://github.com/atlassian/prosemirror-utils/issues/8
  if (dom.offset && dom.node.childNodes[dom.offset]) {
    rowNode = dom.node.childNodes[dom.offset];
  }
  if (startPos > 0 && rowNode === view.dom) {
    // return null if pos is outside of document
    return null;
  }
  // if (isContainerNode(rowNode)) {
  //   return null;
  // }
  // if we are over a container, select the first child
  while (isContainerNode(rowNode)) {
    const firstChild = getFirstChildBlock(rowNode.childNodes as any);
    if (!firstChild) {
      return null;
    }
    rowNode = firstChild;
  }
  let levels = 20; // pre-caution to prevent infinite loop
  while (rowNode && !isContainerNode(rowNode.parentNode) && levels > 0) {
    levels -= 1;
    if (rowNode.parentNode && view.dom.contains(rowNode.parentNode)) {
      rowNode = rowNode.parentNode;
    }
  }

  function isContainerNode(node: Node | null) {
    if (node === view.dom) {
      return true; // document container
    }
    const pmNodeType = node?.pmViewDesc?.node?.type.name;
    if (pmNodeType && containerNodeTypes.includes(pmNodeType)) {
      return true;
    }
    return false;
  }
  // another approach, which may require checking the nodeType:
  // while (node && node.parentNode) {
  //   if ((node.parentNode as Element).classList?.contains('ProseMirror')) { // todo
  //     break;
  //   }
  //   node = node.parentNode;
  // }
  return {
    ...dom,
    node: dom.node as HTMLElement,
    rowNode: rowNode as HTMLElement
  };
}

function blockPosAtCoords(view: EditorView, coords: { left: number; top: number }) {
  const startPos = posAtCoords(view, coords);
  if (!startPos) {
    return;
  }
  const dom = rowNodeAtPos(view, startPos);

  const node = dom?.rowNode;

  // nodeType === 1 is an element like <p> or <div>
  if (node && node.nodeType === 1) {
    // @ts-ignore
    const docView = view.docView;
    const desc = docView.nearestDesc(node, true);
    if (!(!desc || desc === docView)) {
      return desc.posBefore;
    }
  }
  return null;
}

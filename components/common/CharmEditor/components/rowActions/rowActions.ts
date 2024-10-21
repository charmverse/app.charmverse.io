import { log } from '@charmverse/core/log';
import throttle from 'lodash/throttle';
import type { PluginKey } from 'prosemirror-state';
import { Plugin, NodeSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
// @ts-ignore
import { __serializeForClipboard as serializeForClipboard } from 'prosemirror-view';

import { createElement } from 'components/common/CharmEditor/components/@bangle.dev/core/createElement';

// TODO: Support disclosures somehow. BUt if we use 'disclosureDetails', then you cant drag/drop the toggle. There is no 'container' for the hidden contents
const containerNodeTypes = ['columnBlock', 'columnLayout', 'bulletList', 'orderedList', 'bullet_list', 'ordered_list'];

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

    // ignore UL and OL tags, using native browser list icons means we need to use padding on these container elements
    // @ts-ignore
    if (e.target.nodeName === 'OL' || e.target.nodeName === 'UL') {
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

  // keepy track of mouse being dragged
  let dragging = false;

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
          mousedown: () => {
            dragging = true;
          },
          mouseup: () => {
            dragging = false;
          },
          mousemove: (view: EditorView, event: MouseEvent) => {
            // dont update view when user is dragging cursor - this causes the table columns to snap back and forth
            if (!dragging) {
              throttledMouseOver(view, event);
            }
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
  if (dom.node.childNodes[dom.offset]) {
    rowNode = dom.node.childNodes[dom.offset];
  }

  if (isContainerNode(rowNode)) {
    return null;
  }

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

export function getNodeForRowPosition({
  rowPosition,
  rowNodeOffset,
  view
}: {
  rowPosition?: number;
  rowNodeOffset?: number;
  view: EditorView;
}) {
  if (rowPosition === undefined) {
    return null;
  }

  // calculate the node at the mouse position. do it on click in case the content has changed
  let topPos = view.state.doc.resolve(rowPosition);
  // Skip stepping up the document tree if the current node is columnBlock, it will calculate the child in the next step
  while (topPos.depth > 1 || (topPos.depth === 1 && topPos.parentOffset > 0)) {
    const parentOffset = topPos.pos - (topPos.parentOffset > 0 ? topPos.parentOffset : 1); // if parentOffset is 0, step back by 1
    const parentOffsetNode = view.state.doc.resolve(parentOffset);
    const nodeAfterType = topPos.nodeAfter?.type.name;
    if (nodeAfterType === 'page') {
      break;
    }
    if (parentOffsetNode.node().type.name !== 'columnBlock') {
      topPos = parentOffsetNode;
    } else {
      break;
    }
  }

  // console.log('Position of row', topPos, { node: topPos.node() });

  let pmNode = topPos.node();
  // handle top-level children, where pmNode === doc
  if (rowNodeOffset !== undefined && rowNodeOffset >= 0) {
    const child = pmNode.maybeChild(rowNodeOffset);
    pmNode = child || pmNode;
  }

  const nodeStart = topPos.pos;
  const firstChild = pmNode.type.name === 'doc' ? pmNode.firstChild : null;
  const nodeSize =
    pmNode && pmNode.type.name !== 'doc' ? pmNode.nodeSize : (firstChild?.content.size ?? pmNode.content.size);
  // nodeSize includes the start and end tokens, so we need to subtract 1
  // for images, nodeSize is 0
  let nodeEnd = nodeStart + (nodeSize > 0 ? nodeSize - 1 : 0);
  if (nodeEnd === nodeStart) {
    nodeEnd = nodeStart + 1;
  }

  // dont delete past end of document - according to PM guide, use content.size not nodeSize for the doc
  if (nodeEnd > view.state.doc.content.size) {
    nodeEnd = view.state.doc.content.size;
  }

  log.debug('Row meta', {
    child: firstChild?.content.size,
    nodeStart,
    topPos: topPos.pos,
    pmNode,
    nodeEnd,
    nodeSize
  });

  return {
    node: pmNode,
    nodeEnd,
    nodeStart
  };
}

export function deleteRowNode({
  view,
  rowPosition,
  rowNodeOffset
}: {
  view: EditorView;
  rowPosition?: number;
  rowNodeOffset?: number;
}) {
  const node = getNodeForRowPosition({ view, rowPosition, rowNodeOffset });
  if (node) {
    let start = node.nodeStart;
    let end = node.nodeEnd;
    // fix for toggles, but also assuming that pos 1 or 0 is always the first line anyway
    if (start === 1) {
      start = 0;
      end -= 1;
    } else if (node.node.type.name === 'disclosureDetails' || node.node.type.name === 'blockquote') {
      // This removes disclosureSummary node
      start -= 2;
    }

    view.dispatch(view.state.tr.deleteRange(start, end));

    return node;
  }

  return null;
}

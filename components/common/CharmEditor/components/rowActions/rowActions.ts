
import { createElement } from '@bangle.dev/core';
import type { EditorView, PluginKey } from '@bangle.dev/pm';
import { Plugin } from '@bangle.dev/pm';
import throttle from 'lodash/throttle';
import { NodeSelection } from 'prosemirror-state';
// @ts-ignore
import { __serializeForClipboard as serializeForClipboard } from 'prosemirror-view';

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

  function onMouseOver (view: EditorView, e: MouseEventInit) {
    // @ts-ignore
    const containerXOffset = e.target.getBoundingClientRect().left;
    const clientX = e.clientX!;
    const left = (clientX - containerXOffset) < 50 ? clientX + 50 : clientX;

    const startPos = posAtCoords(view, { left, top: e.clientY! });

    if (startPos) {

      // Step 1. grab the top-most ancestor of the related DOM element
      const dom = rowNodeAtPos(view, startPos);
      const rowNode = dom.rowNode;

      // @ts-ignore pm types are wrong
      if (rowNode && view.dom.contains(rowNode.parentNode) && rowNode.getBoundingClientRect) {
        // @ts-ignore pm types are wrong
        const box = rowNode.getBoundingClientRect();
        const viewBox = view.dom.getBoundingClientRect();
        // align to the top of the row
        const top = box.top - viewBox.top;
        tooltipDOM.style.top = `${top}px`;

        const newState = {
          rowPos: startPos,
          rowDOM: dom.rowNode,
          rowNodeOffset: dom.offset && dom.node.childNodes[dom.offset] ? dom.offset : 0
        };
        view.dispatch(view.state.tr.setMeta(key, newState));
      }
    }
  }

  const throttled = throttle(onMouseOver, 100);

  const brokenClipboardAPI = false;

  function dragStart (view: EditorView, e: DragEvent) {

    if (!e.dataTransfer || !/charm-drag-handle/.test((e.target as HTMLElement)?.className)) return;

    const coords = { left: e.clientX + 100, top: e.clientY };
    const pos = blockPosAtCoords(view, coords);
    if (pos != null) {
      view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)));

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
          mousemove: (view: EditorView, event: MouseEvent) => {
            throttled(view, event);
            return false;
          }
        }
      },
      view: (view) => {

        function onDragStart (e: DragEvent) {
          return dragStart(view, e);
        }

        view.dom.parentNode?.appendChild(tooltipDOM);
        tooltipDOM.addEventListener('dragstart', onDragStart);

        return {
          destroy () {
            // remove tooltip from DOM
            tooltipDOM.parentNode?.removeChild(tooltipDOM);
            tooltipDOM.removeEventListener('dragstart', onDragStart);
          }
        };
      }
    })
  ];
}

function posAtCoords (view: EditorView, coords: { left: number, top: number }) {
  const pos = view.posAtCoords(coords);
  if (!pos) {
    return null;
  }
  // Note '.inside' refers to the position of the parent node, it is -1 if the position is at the root
  const startPos = pos.inside > 0 ? pos.inside : pos.pos;
  return startPos;
}

function rowNodeAtPos (view: EditorView, startPos: number) {

  const dom = view.domAtPos(startPos);
  let rowNode = dom.node;
  // Note: for leaf nodes, domAtPos() only returns the parent with an offset. text nodes have an offset but don't have childNodes
  // ref: https://github.com/atlassian/prosemirror-utils/issues/8
  if (dom.offset && dom.node.childNodes[dom.offset]) {
    rowNode = dom.node.childNodes[dom.offset];
  }
  let levels = 10; // pre-caution to prevent infinite loop
  while (rowNode && rowNode.parentNode !== view.dom && levels > 0) {
    levels -= 1;
    if (rowNode.parentNode && view.dom.contains(rowNode.parentNode)) {
      rowNode = rowNode.parentNode;
    }
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
    rowNode
  };
}

function blockPosAtCoords (view: EditorView, coords: { left: number, top: number }) {

  const startPos = posAtCoords(view, coords);
  if (!startPos) {
    return;
  }
  const dom = rowNodeAtPos(view, startPos);

  const node = dom.rowNode;

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

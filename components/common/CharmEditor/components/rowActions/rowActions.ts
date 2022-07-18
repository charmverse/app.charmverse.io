
import { createElement } from '@bangle.dev/core';
import { EditorView, Plugin, PluginKey } from '@bangle.dev/pm';
import { NodeSelection } from 'prosemirror-state';
import { __serializeForClipboard as serializeForClipboard } from 'prosemirror-view';
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

  const tooltipDOM = createElement(['div', { class: 'row-handle', draggable: 'true' }]);

  function onMouseOver (view: EditorView, e: MouseEventInit) {
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

  const brokenClipboardAPI = false;

  function blockPosAtCoords (view: EditorView, coords: { left: number, top: number }) {
    const pos = view.posAtCoords(coords);
    if (!pos) {
      return;
    }
    let { node } = view.domAtPos(pos.pos);

    while (node && node.parentNode) {
      if ((node.parentNode as Element).classList?.contains('ProseMirror')) { // todo
        break;
      }
      node = node.parentNode;
    }

    // nodeType === 1 is an element like <p> or <div>
    if (node && node.nodeType === 1) {
      // console.log('nodeType is 1', view.docView);
      const desc = view.docView.nearestDesc(node, true);
      if (!(!desc || desc === view.docView)) {
        return desc.posBefore;
      }
    }
    return null;
  }

  function dragStart (view: EditorView, e: DragEvent) {
    // console.log('e', e);
    if (!e.dataTransfer) return;

    const coords = { left: e.clientX + 50, top: e.clientY };
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

        function onDragStart (e) {
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

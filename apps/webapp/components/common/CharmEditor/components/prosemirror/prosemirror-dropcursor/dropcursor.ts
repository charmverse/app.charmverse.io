// Reference: https://github.com/ProseMirror/prosemirror-dropcursor/blob/master/src/dropcursor.ts
import type { EditorState } from 'prosemirror-state';
import { Plugin, PluginKey } from 'prosemirror-state';
import { dropPoint } from 'prosemirror-transform';
import type { EditorView } from 'prosemirror-view';

export const pageNodeDropPluginKey = new PluginKey('dragPlugin');
export const HOVERED_PAGE_NODE_ID = 'Prosemirror-hovered-page-node';

interface DropCursorOptions {
  /// The color of the cursor. Defaults to `black`. Use `false` to apply no color and rely only on class.
  color?: string | false;

  /// The precise width of the cursor in pixels. Defaults to 1.
  width?: number;

  /// A CSS class name to add to the cursor element.
  class?: string;
}

class DropCursorView {
  width: number;

  color: string | undefined;

  class: string | undefined;

  cursorPos: number | null = null;

  element: HTMLElement | null = null;

  timeout: number = -1;

  handlers: { name: string; handler: (event: Event) => void }[];

  constructor(
    readonly editorView: EditorView,
    options: DropCursorOptions
  ) {
    this.width = options.width ?? 1;
    this.color = options.color === false ? undefined : options.color || 'black';
    this.class = options.class;

    this.handlers = ['dragover', 'dragend', 'drop', 'dragleave'].map((name) => {
      const handler = (e: Event) => {
        (this as any)[name](e);
      };
      editorView.dom.addEventListener(name, handler);
      return { name, handler };
    });
  }

  destroy() {
    this.handlers.forEach(({ name, handler }) => this.editorView.dom.removeEventListener(name, handler));
  }

  update(editorView: EditorView, prevState: EditorState) {
    if (this.cursorPos != null && prevState.doc !== editorView.state.doc) {
      if (this.cursorPos > editorView.state.doc.content.size) this.setCursor(null);
      else this.updateOverlay();
    }
  }

  setCursor(pos: number | null) {
    if (pos === this.cursorPos) return;
    this.cursorPos = pos;
    if (pos == null) {
      this.element!.parentNode!.removeChild(this.element!);
      this.element = null;
    } else {
      this.updateOverlay();
    }
  }

  updateOverlay() {
    const $pos = this.editorView.state.doc.resolve(this.cursorPos!);
    const isBlock = !$pos.parent.inlineContent;
    let rect;
    const editorDOM = this.editorView.dom;
    const editorRect = editorDOM.getBoundingClientRect();
    const scaleX = editorRect.width / editorDOM.offsetWidth;
    const scaleY = editorRect.height / editorDOM.offsetHeight;

    if (isBlock) {
      const before = $pos.nodeBefore;
      const after = $pos.nodeAfter;
      if (before || after) {
        const node = this.editorView.nodeDOM(this.cursorPos! - (before ? before.nodeSize : 0));
        if (node) {
          const nodeRect = (node as HTMLElement).getBoundingClientRect();
          let top = before ? nodeRect.bottom : nodeRect.top;
          if (before && after)
            top = (top + (this.editorView.nodeDOM(this.cursorPos!) as HTMLElement).getBoundingClientRect().top) / 2;
          const halfWidth = (this.width / 2) * scaleY;
          rect = { left: nodeRect.left, right: nodeRect.right, top: top - halfWidth, bottom: top + halfWidth };
        }
      }
    }
    if (!rect) {
      const coords = this.editorView.coordsAtPos(this.cursorPos!);
      const halfWidth = (this.width / 2) * scaleX;
      rect = { left: coords.left - halfWidth, right: coords.left + halfWidth, top: coords.top, bottom: coords.bottom };
    }

    const parent = this.editorView.dom.offsetParent as HTMLElement;
    if (!this.element) {
      this.element = parent.appendChild(document.createElement('div'));
      if (this.class) this.element.className = this.class;
      this.element.style.cssText = 'position: absolute; z-index: 50; pointer-events: none;';
      if (this.color) {
        this.element.style.backgroundColor = this.color;
      }
    }
    this.element.classList.toggle('prosemirror-dropcursor-block', isBlock);
    this.element.classList.toggle('prosemirror-dropcursor-inline', !isBlock);
    let parentLeft;
    let parentTop;
    if (!parent || (parent === document.body && getComputedStyle(parent).position === 'static')) {
      // eslint-disable-next-line no-restricted-globals
      parentLeft = -window.pageXOffset;
      // eslint-disable-next-line no-restricted-globals
      parentTop = -window.pageYOffset;
    } else {
      const _rect = parent.getBoundingClientRect();
      const parentScaleX = _rect.width / parent.offsetWidth;
      const parentScaleY = _rect.height / parent.offsetHeight;
      parentLeft = _rect.left - parent.scrollLeft * parentScaleX;
      parentTop = _rect.top - parent.scrollTop * parentScaleY;
    }
    this.element.style.left = `${(rect.left - parentLeft) / scaleX}px`;
    this.element.style.top = `${(rect.top - parentTop) / scaleY}px`;
    this.element.style.width = `${(rect.right - rect.left) / scaleX}px`;
    this.element.style.height = `3px`;
  }

  scheduleRemoval(timeout: number) {
    clearTimeout(this.timeout);
    this.timeout = window.setTimeout(() => this.setCursor(null), timeout);
  }

  dragover(event: DragEvent) {
    const view = this.editorView;
    const domElementAtCoords = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
    // Assume that the dragged node is the selected node, this might not be the case if we are dragging from the sidebar
    const draggedNode = view.state.doc.nodeAt(view.state.selection.$anchor.pos);
    // Check if the hovered dom node and dragged node are page nodes
    // Dragged node might not exist if we are dragging from the sidebar
    // Sometimes the hovered dom node is the text node inside the page node, so we need to check the parent element as well
    const hoveredPageDomNode = (
      domElementAtCoords?.dataset?.pageType?.match(/(page|card)/) &&
      (draggedNode ? draggedNode?.type.name === 'page' || draggedNode?.type.name === 'linkedPage' : true)
        ? domElementAtCoords
        : domElementAtCoords?.parentElement?.dataset?.pageType?.match(/(page|card)/)
          ? domElementAtCoords.parentElement
          : null
    ) as HTMLElement | null;

    const hoveredPageDomNodeId = hoveredPageDomNode?.dataset.id;
    const currentHoveredPageDomNode = document.getElementById(HOVERED_PAGE_NODE_ID);
    // Remove the class from the previous hovered page node only if it is not the same as the current hovered page node
    if (currentHoveredPageDomNode && currentHoveredPageDomNode.dataset.id !== hoveredPageDomNodeId) {
      currentHoveredPageDomNode.removeAttribute('id');
    }
    if (hoveredPageDomNode) {
      // Add the class to the current hovered page node only if it is not the same as the dragged node
      // Also update the plugin state with the current hovered dom node
      if (draggedNode?.attrs.id !== hoveredPageDomNodeId) {
        hoveredPageDomNode.setAttribute('id', HOVERED_PAGE_NODE_ID);
        view.dispatch(
          view.state.tr.setMeta(pageNodeDropPluginKey, {
            hoveredPageDomNode
          })
        );
      }
      // Also return as to not show the drop cursor, with the thin line, when hovering over a page node
      return;
    } else {
      // Remove the class from the previous hovered page node
      // Also update the plugin state with null as there is no hovered page dom node
      const previousHoveredPageDomNode = pageNodeDropPluginKey.getState(view.state)?.hoveredPageDomNode;
      if (previousHoveredPageDomNode) {
        previousHoveredPageDomNode.removeAttribute('id');
        view.dispatch(
          view.state.tr.setMeta(pageNodeDropPluginKey, {
            hoveredPageDomNode: null
          })
        );
      }
    }

    if (!this.editorView.editable) return;
    const pos = this.editorView.posAtCoords({ left: event.clientX, top: event.clientY });

    const node = pos && pos.inside >= 0 ? this.editorView.state.doc.nodeAt(pos.inside) : null;
    const disableDropCursor = node && node.type.spec.disableDropCursor;
    const disabled =
      typeof disableDropCursor === 'function' ? disableDropCursor(this.editorView, pos!, event) : disableDropCursor;

    if (pos && !disabled) {
      let target: number | null = pos.pos;
      if (this.editorView.dragging && this.editorView.dragging.slice) {
        const point = dropPoint(this.editorView.state.doc, target, this.editorView.dragging.slice);
        if (point != null) target = point;
      }
      this.setCursor(target);
      this.scheduleRemoval(5000);
    }
  }

  dragend() {
    this.scheduleRemoval(20);
  }

  drop() {
    this.scheduleRemoval(20);
  }

  dragleave(event: DragEvent) {
    if (event.target === this.editorView.dom || !this.editorView.dom.contains((event as any).relatedTarget))
      this.setCursor(null);
  }
}

/// Create a plugin that, when added to a ProseMirror instance,
/// causes a decoration to show up at the drop position when something
/// is dragged over the editor.
///
/// Nodes may add a `disableDropCursor` property to their spec to
/// control the showing of a drop cursor inside them. This may be a
/// boolean or a function, which will be called with a view and a
/// position, and should return a boolean.
export function dropCursor(options: DropCursorOptions = {}): Plugin {
  return new Plugin({
    view(editorView) {
      return new DropCursorView(editorView, options);
    }
  });
}

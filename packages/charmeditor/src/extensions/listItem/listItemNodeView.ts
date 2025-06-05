import type { Node } from 'prosemirror-model';
import type { EditorState, Transaction } from 'prosemirror-state';
import type { EditorView, NodeView, ViewMutationRecord } from 'prosemirror-view';

import { LIST_ITEM } from '../../nodeNames';
import { createElement } from '../../utils/domUtils';

// This implements the `NodeView` interface
// https://prosemirror.net/docs/ref/#view.NodeView
export class ListItemNodeView implements NodeView {
  // This implements the `NodeView` interface
  // The outer DOM node that represents the list item element.
  dom: HTMLLIElement;

  // This implements the `NodeView` interface.
  // The DOM node that should hold the node's content.
  contentDOM: HTMLElement;

  _nodeUpdated?: Node;

  constructor(
    node: Node,
    private view: EditorView,
    private getPos: () => number | undefined,
    private readOnly: boolean
  ) {
    const dom = document.createElement('li');
    this.dom = dom;
    this.contentDOM = dom.appendChild(document.createElement('span'));
    const todoChecked = node.attrs.todoChecked;
    // branch if todo needs to be created
    if (todoChecked !== null) {
      // todo only makes sense if parent is bullet list
      if (checkParentBulletList(view.state, getPos())) {
        setupCheckbox(this.dom!, node.attrs, readOnly, (attrs: Node['attrs']) => {
          view.dispatch(updateAttrs(getPos(), node, attrs, view.state.tr));
        });
      }
    }

    this._updateDOM(node);
  }

  // This implements the `NodeView` interface.
  // update(node: Node, decorations: Decoration[]): boolean {
  update(node: Node): boolean {
    if (LIST_ITEM !== node.type.name) {
      return false;
    }
    return this._updateDOM(node);
  }

  // Disable mutation observer for all attributes except checked
  ignoreMutation(mutation: ViewMutationRecord) {
    if (mutation.type === 'attributes' && mutation.attributeName !== 'checked') {
      return true;
    }

    return false;
  }

  _updateDOM(node: Node): boolean {
    if (this._nodeUpdated === node) {
      return false;
    }

    this._nodeUpdated = node;

    const dom = this.dom;
    // According to `ListItemNodeSpec`, a valid list item has the following
    // structure: `li > span > paragraph > text`.
    const paragraph = node.firstChild;
    const initialContent = paragraph ? paragraph.firstChild : null;

    // TODO: pick up colors, etc
    // This resolves the styles for the counter by examines the marks for the
    // first text node of the list item.
    // const marks = initialContent && initialContent.isText && initialContent.textContent ? initialContent.marks : null;

    // let cssColor;
    // let cssFontSize;
    // let cssText = '';
    // if (Array.isArray(marks)) {
    //   marks.forEach((mark) => {
    //     const { attrs, type } = mark;
    //     switch (type.name) {
    //       case MARK_TEXT_COLOR:
    //         cssColor = attrs.color;
    //         break;
    //       case MARK_FONT_SIZE:
    //         cssFontSize = attrs.pt;
    //         break;
    //       default:
    //         break;
    //     }
    //   });
    // }

    // // The counter of the list item is a pseudo-element that uses
    // // the CSS variables (e.g `--czi-list-style-color`) for styling.
    // // This defines the CSS variables scoped for the pseudo-element.
    // // See `src/ui/czi-list.css` for more details.
    // if (cssColor) {
    //   cssText += `--czi-list-style-color: ${cssColor};`;
    // }

    // if (cssFontSize) {
    //   cssText += `--czi-list-style-font-size: ${cssFontSize}pt;`;
    // }

    // dom.style.cssText = cssText;

    // handle TO DO
    const { todoChecked } = node.attrs;
    if (todoChecked === null) {
      removeCheckbox(this.dom);
      return true;
    }

    // if parent is not bulletList i.e. it is orderedList
    if (!checkParentBulletList(this.view.state, this.getPos())) {
      return true;
    }
    // assume nothing about the dom elements state.
    // for example it is possible that the checkbox is not created
    // when a regular list is converted to todo list only update handler
    // will be called. The create handler was called in the past
    // but without the checkbox element, hence the checkbox wont be there
    setupCheckbox(this.dom, node.attrs, this.readOnly, (attrs: Node['attrs']) => {
      this.view.dispatch(updateAttrs(this.getPos(), node, attrs, this.view.state.tr));
    });
    // const checkbox = this!.containerDOM!.firstChild!.firstChild! as HTMLInputElement;
    // console.log(`updating inputElement, checked = ${todoChecked}`);
    // checkbox.checked = todoChecked;

    return true;
  }
}

function checkParentBulletList(state: EditorState, pos?: number) {
  return pos && state.doc.resolve(pos).parent.type.name === 'bullet_list';
}

export type UpdateAttrsFunction = (attrs: Node['attrs']) => void;

function updateAttrs(pos: number | undefined, node: Node, newAttrs: Node['attrs'], tr: Transaction) {
  if (pos === undefined) {
    return tr;
  }
  return tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    ...newAttrs
  });
}

function createCheckbox(todoChecked: boolean | null, readOnly: boolean, onUpdate: (newValue: boolean) => void) {
  const checkBox = createElement([
    'span',
    { contentEditable: false },
    [
      'input',
      // For some reason the presence of disabled key makes it disabled even if disabled: false
      readOnly
        ? {
            type: 'checkbox',
            disabled: true
          }
        : {
            type: 'checkbox'
          }
    ]
  ]);
  const inputElement = checkBox.querySelector('input')!;

  if (todoChecked) {
    inputElement.setAttribute('checked', '');
  }

  inputElement.addEventListener('input', (_event) => {
    onUpdate(
      // note:  inputElement.checked is a bool
      inputElement.checked
    );
  });

  return checkBox;
}

function setupCheckbox(
  containerDOM: HTMLLIElement,
  attrs: Node['attrs'],
  readOnly: boolean,
  _updateAttrs: UpdateAttrsFunction
) {
  // no need to create as it is already created
  if (containerDOM.hasAttribute('data-bangle-is-todo')) {
    return;
  }

  const checkbox = createCheckbox(attrs.todoChecked, readOnly, (newValue: boolean | null) => {
    _updateAttrs({
      // Fetch latest attrs as the one in outer
      // closure can be stale.
      todoChecked: newValue
    });
  });

  containerDOM.setAttribute('data-bangle-is-todo', '');
  containerDOM.insertAdjacentElement('afterbegin', checkbox);
}

function removeCheckbox(containerDOM: HTMLLIElement) {
  // already removed
  if (!containerDOM.hasAttribute('data-bangle-is-todo')) {
    return;
  }
  containerDOM.removeAttribute('data-bangle-is-todo');
  containerDOM.removeChild(containerDOM.firstChild!);
}

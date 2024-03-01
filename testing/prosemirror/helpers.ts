import { browser } from '@bangle.dev/utils';
import type { Node } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

export function setSelectionNear(view: EditorView, pos: number) {
  const tr = view.state.tr;
  view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(pos))));
}

export function expectNodesAreEqual(a: Node, b: Node) {
  expect(a.toString()).toEqual(b.toString());
}

/**
 *
 *
 * Dispatch a paste event on the given ProseMirror instance
 *
 * Usage:
 *     dispatchPasteEvent(pm, {
 *         plain: 'copied text'
 *     });
 */
export function dispatchPasteEvent(
  editorView: EditorView,
  content: {
    types?: any[];
    files?: DataTransfer['files'];
    items?: DataTransfer['items'];
    html?: string;
    plain?: string;
  }
) {
  const event = createEvent('paste');
  const clipboardData: Partial<DataTransfer> = {
    getData(type: any) {
      if (type === 'text/plain') {
        return content.plain || '';
      }
      if (type === 'text/html') {
        return content.html || '';
      }
      return '';
    },
    types: content.types || [],
    files: content.files || ([] as unknown as DataTransfer['files']),
    items: content.items || ([] as unknown as DataTransfer['items'])
  };
  // Reason: https://github.com/ProseMirror/prosemirror-view/blob/9d2295d03c2d17357213371e4d083f0213441a7e/bangle-play/input.js#L379-L384
  if ((browser.ie && browser.ie_version < 15) || browser.ios) {
    return false;
  }
  Object.defineProperty(event, 'clipboardData', { value: clipboardData });
  (editorView as any).dispatchEvent(event);
  return event;
}

/**
 * Build an event object
 */
function createEvent(name: string, options: EventInit = {}) {
  // if (options.bubbles === undefined) {
  //   options.bubbles = true;
  // }
  // if (options.cancelable === undefined) {
  //   options.cancelable = true;
  // }
  // if (options.composed === undefined) {
  //   options.composed = true;
  // }
  return new Event(name, options);
}

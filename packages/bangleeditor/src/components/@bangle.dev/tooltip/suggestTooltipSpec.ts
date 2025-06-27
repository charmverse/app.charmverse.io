import { findFirstMarkPosition, isChromeWithSelectionBug, safeInsert } from '@bangle.dev/utils';
import { log } from '@packages/core/log';
import { Fragment, Node } from 'prosemirror-model';
import type { Command, EditorState, PluginKey } from 'prosemirror-state';
import { Selection } from 'prosemirror-state';

import type { BaseRawMarkSpec } from '../core/specRegistry';

export const spec = specFactory;

export const commands = {
  queryTriggerText,
  queryIsSuggestTooltipActive,
  replaceSuggestMarkWith,
  incrementSuggestTooltipCounter,
  decrementSuggestTooltipCounter,
  resetSuggestTooltipCounter
};

export const defaultKeys = {
  select: 'Enter',
  up: 'ArrowUp',
  down: 'ArrowDown',
  hide: 'Escape',
  right: undefined,
  left: undefined
};

function specFactory({
  markName,
  trigger,
  markColor,
  excludes
}: {
  excludes?: string;
  markName: string;
  trigger?: string;
  markColor?: string;
}): BaseRawMarkSpec {
  return {
    name: markName,
    type: 'mark',
    schema: {
      excludes,
      inclusive: true,
      group: 'suggestTriggerMarks',
      parseDOM: [{ tag: `span[data-${markName}]` }],
      toDOM: (mark) => {
        return [
          'span',
          {
            'data-bangle-name': markName,
            'data-suggest-trigger': mark.attrs.trigger,
            style: markColor ? `color: ${markColor}` : ''
          }
        ];
      },
      attrs: {
        trigger: { default: trigger }
      },
      markdown: {
        toMarkdown: {
          open: '',
          close: '',
          mixable: true
        }
      }
    }
  };
}

export function renderSuggestionsTooltip(key: PluginKey, value: Record<string, any>): Command {
  return (state, dispatch, _view) => {
    if (dispatch) {
      dispatch(state.tr.setMeta(key, { type: 'RENDER_TOOLTIP', value }).setMeta('addToHistory', false));
    }
    return true;
  };
}

export function hideSuggestionsTooltip(key: PluginKey): Command {
  return (state, dispatch, _view) => {
    if (dispatch) {
      dispatch(state.tr.setMeta(key, { type: 'HIDE_TOOLTIP' }).setMeta('addToHistory', false));
    }
    return true;
  };
}

export function getTriggerText(state: EditorState, markName: string, trigger?: string) {
  const markType = state.schema.marks[markName];

  const { nodeBefore } = state.selection.$from;

  // nodeBefore in a new line (a new paragraph) is null
  if (!nodeBefore) {
    return '';
  }

  const suggestMark = markType.isInSet(nodeBefore.marks || []);

  // suggestMark is undefined if you delete the trigger while keeping rest of the query alive
  if (!suggestMark) {
    return '';
  }

  const textContent = nodeBefore.textContent || '';
  const text = textContent
    // eslint-disable-next-line no-control-regex
    .replace(/^([^\x00-\xFF]|[\s\n])+/g, '');

  if (trigger) {
    return text.replace(trigger, '');
  }
  return text;
}

/** Commands */

export function queryTriggerText(key: PluginKey) {
  return (state: EditorState) => {
    const keyState = key.getState(state);
    if (!keyState) {
      return '';
    }
    const { trigger, markName } = keyState;
    return getTriggerText(state, markName, trigger);
  };
}

export function queryIsSuggestTooltipActive(key: PluginKey) {
  return (state: EditorState) => {
    const keyState = key.getState(state);
    if (keyState) {
      return keyState.show;
    }
    return false;
  };
}

export function replaceSuggestMarkWith(
  key: PluginKey,
  maybeNode?: string | Node | Fragment,
  setSelection?: boolean
): Command {
  return (state, dispatch, view) => {
    const { markName } = key.getState(state);
    const { schema } = state;
    const markType = schema.marks[markName];
    const { selection } = state;
    const queryMark = findFirstMarkPosition(markType, state.doc, selection.from - 1, selection.to);

    if (!queryMark || queryMark.start === -1) {
      return false;
    }

    const getTr = () => {
      const { start, end } = queryMark;
      let tr = state.tr
        .removeStoredMark(markType)
        .replaceWith(start, end, Fragment.empty)
        // set meta so that track plugin ignores this transaction
        .setMeta('suggestTooltipFeature', true);

      if (!maybeNode) {
        return tr;
      }

      const isInputFragment = maybeNode instanceof Fragment;

      let node: any;
      try {
        node =
          maybeNode instanceof Node || isInputFragment
            ? maybeNode
            : typeof maybeNode === 'string'
              ? state.schema.text(maybeNode)
              : Node.fromJSON(state.schema, maybeNode);
      } catch (e) {
        log.error('suggest-tooltip error', e);
        return tr;
      }
      if (node.isText) {
        tr = tr.replaceWith(start, start, node);
      } else if (node.isBlock) {
        tr = safeInsert(node)(tr);
        if (setSelection) {
          tr = tr.setSelection(Selection.near(tr.doc.resolve(start + 1)));
        }
      } else if (node.isInline || isInputFragment) {
        const fragment = isInputFragment ? node : Fragment.fromArray([node, state.schema.text(' ')]);

        tr = tr.replaceWith(start, start, fragment);
        // This problem affects Chrome v58+. See: https://github.com/ProseMirror/prosemirror/issues/710
        if (isChromeWithSelectionBug) {
          const _selection = document.getSelection();
          if (_selection) {
            _selection.empty();
          }
        }

        // Placing cursor after node + space.
        tr = tr.setSelection(Selection.near(tr.doc.resolve(start + (fragment as Fragment).size)));

        return tr;
      }

      return tr;
    };

    const tr = getTr();

    if (dispatch) {
      view?.focus();
      dispatch(tr);
    }

    return true;
  };
}

export function removeSuggestMark(key: PluginKey): Command {
  return (state, dispatch, _view) => {
    const { markName } = key.getState(state);
    const { schema, selection } = state;
    const markType = schema.marks[markName];

    const queryMark = findFirstMarkPosition(markType, state.doc, selection.from - 1, selection.to);

    const { start, end } = queryMark;
    if (start === -1 && state.storedMarks && markType.isInSet(state.storedMarks)) {
      if (dispatch) {
        dispatch(state.tr.removeStoredMark(markType));
      }

      return true;
    }

    if (start === -1) {
      return false;
    }

    if (dispatch) {
      dispatch(
        state.tr
          .removeMark(start, end, markType)
          // stored marks are marks which will be carried forward to whatever
          // the user types next, like if current mark
          // is bold, new input continues being bold
          .removeStoredMark(markType)
          // This helps us avoid the case:
          // when a user deleted the trigger/ in '<suggest_mark>/something</suggest_mark>'
          // and then performs undo.
          // If we do not hide this from history, command z will bring
          // us in the state of `<suggest_mark>something<suggest_mark>` without the trigger `/`
          // and seeing this state `tooltipActivatePlugin` plugin will dispatch a new command removing
          // the mark, hence never allowing the user to command z.
          .setMeta('addToHistory', false)
      );
    }
    return true;
  };
}

export function incrementSuggestTooltipCounter(key: PluginKey): Command {
  return (state, dispatch, _view) => {
    if (dispatch) {
      dispatch(state.tr.setMeta(key, { type: 'INCREMENT_COUNTER' }).setMeta('addToHistory', false));
    }
    return true;
  };
}

export function decrementSuggestTooltipCounter(key: PluginKey): Command {
  return (state, dispatch, _view) => {
    if (dispatch) {
      dispatch(state.tr.setMeta(key, { type: 'DECREMENT_COUNTER' }).setMeta('addToHistory', false));
    }
    return true;
  };
}

export function resetSuggestTooltipCounter(key: PluginKey): Command {
  return (state, dispatch, _view) => {
    if (dispatch) {
      dispatch(state.tr.setMeta(key, { type: 'RESET_COUNTER' }).setMeta('addToHistory', false));
    }
    return true;
  };
}

export function updateSuggestTooltipCounter(key: PluginKey, counter: number): Command {
  return (state, dispatch, _view) => {
    if (dispatch) {
      dispatch(state.tr.setMeta(key, { type: 'UPDATE_COUNTER', value: counter }).setMeta('addToHistory', false));
    }
    return true;
  };
}

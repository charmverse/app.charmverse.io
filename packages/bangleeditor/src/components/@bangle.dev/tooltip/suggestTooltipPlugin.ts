import { findFirstMarkPosition, filter, createObject } from '@bangle.dev/utils';
import { keymap } from 'prosemirror-keymap';
import type { MarkType, Schema } from 'prosemirror-model';
import type { Command, EditorState } from 'prosemirror-state';
import { Plugin, PluginKey } from 'prosemirror-state';

import type { RawPlugins } from '../core/plugin-loader';

import {
  queryIsSuggestTooltipActive,
  removeSuggestMark,
  incrementSuggestTooltipCounter,
  decrementSuggestTooltipCounter,
  hideSuggestionsTooltip,
  renderSuggestionsTooltip,
  getTriggerText
} from './suggestTooltipSpec';
import { plugins as tooltipPlacementPlugins } from './tooltipPlacement';
import type { GetReferenceElementFunction, TooltipRenderOpts } from './tooltipPlacement';
import { triggerInputRule } from './triggerInputRule';

export const defaultKeys = {
  select: 'Enter',
  up: 'ArrowUp',
  down: 'ArrowDown',
  hide: 'Escape',
  right: undefined,
  left: undefined
};

export type SuggestTooltipRenderOpts = Omit<TooltipRenderOpts, 'getReferenceElement'>;

interface PluginsOptions {
  key?: PluginKey;
  tooltipRenderOpts: SuggestTooltipRenderOpts;
  markName: string;
  trigger?: string;
  keybindings?: any;
  onEnter?: Command;
  onArrowDown?: Command;
  onArrowUp?: Command;
  onEscape?: Command;
  onArrowLeft?: Command;
  onArrowRight?: Command;
}

export interface PluginState {
  triggerText: string;
  show: boolean;
  counter: number;
  trigger?: string;
  markName: string;
}

export interface SuggestPluginState {
  tooltipContentDOM: HTMLElement;
  markName: string;
  suggestTooltipKey: PluginKey<PluginState>;
}

export function plugins({
  key = new PluginKey('suggest_tooltip'),
  markName,
  trigger,
  tooltipRenderOpts = {
    placement: 'bottom-start'
  },
  keybindings = defaultKeys,
  onEnter = (state, dispatch, view) => {
    return removeSuggestMark(key)(state, dispatch, view);
  },
  onArrowDown = incrementSuggestTooltipCounter(key),
  onArrowUp = decrementSuggestTooltipCounter(key),
  onEscape = (state, dispatch, view) => {
    return removeSuggestMark(key)(state, dispatch, view);
  },
  onArrowLeft,
  onArrowRight
}: PluginsOptions) {
  return ({ schema }: { schema: Schema }) => {
    const isActiveCheck = queryIsSuggestTooltipActive(key);
    return [
      new Plugin<PluginState>({
        key,
        state: {
          init(_, _state) {
            return {
              trigger,
              markName,
              triggerText: '',
              show: false,
              counter: 0
            };
          },
          apply(tr, pluginState, _oldState, newState) {
            const meta = tr.getMeta(key);
            if (meta === undefined) {
              return pluginState;
            }
            // ignore remote changes
            if (tr.getMeta('remote')) {
              return pluginState;
            }
            if (meta.type === 'RENDER_TOOLTIP') {
              return {
                ...pluginState,
                // Cannot use queryTriggerText because it relies on
                // reading the pluginState which will not be there in newState.
                triggerText: getTriggerText(newState, markName, trigger),
                show: true
              };
            }
            if (meta.type === 'HIDE_TOOLTIP') {
              // Do not change object reference if show was and is false
              if (pluginState.show === false) {
                return pluginState;
              }
              return {
                ...pluginState,
                triggerText: '',
                show: false,
                counter: 0
              };
            }
            if (meta.type === 'INCREMENT_COUNTER') {
              return { ...pluginState, counter: pluginState.counter + 1 };
            }
            if (meta.type === 'RESET_COUNTER') {
              return { ...pluginState, counter: 0 };
            }
            if (meta.type === 'UPDATE_COUNTER') {
              return { ...pluginState, counter: meta.value };
            }
            if (meta.type === 'DECREMENT_COUNTER') {
              return { ...pluginState, counter: pluginState.counter - 1 };
            }
            throw new Error('Unknown type');
          }
        }
      }),
      tooltipPlacementPlugins({
        stateKey: key,
        renderOpts: {
          ...tooltipRenderOpts,
          placement: 'bottom-start',
          getReferenceElement: referenceElement(key, (state: EditorState) => {
            const markType = schema.marks[markName];
            const { selection } = state;
            return findFirstMarkPosition(markType, state.doc, selection.from - 1, selection.to);
          })
        }
      }),
      trigger && triggerInputRule(schema, markName, trigger),
      tooltipController({
        trigger,
        markName,
        key
      }),
      keybindings &&
        keymap(
          createObject([
            [keybindings.select, filter(isActiveCheck, onEnter)],
            [keybindings.up, filter(isActiveCheck, onArrowUp)],
            [keybindings.down, filter(isActiveCheck, onArrowDown)],
            [keybindings.left, filter(isActiveCheck, onArrowLeft)],
            [keybindings.right, filter(isActiveCheck, onArrowRight)],
            [keybindings.hide, filter(isActiveCheck, onEscape)]
          ])
        )
    ];
  };
}

export function referenceElement(
  pluginKey: PluginKey,
  getActiveMarkPos: (state: EditorState) => { start: number; end: number }
): GetReferenceElementFunction {
  return (view) => {
    return {
      getBoundingClientRect: () => {
        const emojiSuggestState = pluginKey.getState(view.state);
        // Ref will be present if we are triggering the emoji suggest by clicking on page icon
        if (emojiSuggestState.ref) {
          return (emojiSuggestState.ref as HTMLDivElement).getBoundingClientRect();
        }

        const state = view.state;
        const markPos = getActiveMarkPos(state);
        // add by + so that we get the position right after trigger
        const startPos = markPos.start > -1 ? markPos.start + 1 : 0;
        const start = view.coordsAtPos(startPos);
        // if the suggestMark text spanned two lines, we want to show the tooltip based on the end pos
        // so that it doesn't hide the text
        const end = view.coordsAtPos(markPos.end > -1 ? markPos.end : startPos);

        const { left, right } = start;
        const { top, bottom } = end;
        const x = left;
        const y = top;
        const width = right - left;
        const height = bottom - top;
        return new DOMRect(x, y, width, height);
      }
    };
  };
}

function tooltipController({ key, trigger, markName }: { key: PluginKey; trigger?: string; markName: string }) {
  return new Plugin({
    view() {
      return {
        update: (view, lastState) => {
          const { state } = view;
          if (lastState === state || !state.selection.empty) {
            return;
          }
          const markType = state.schema.marks[markName];
          if (
            lastState.doc.eq(state.doc) &&
            state.selection.eq(lastState && lastState.selection) &&
            // This is a shorthand for checking if the stored mark  of `markType`
            // has changed within the last step. If it has we need to update the state
            isStoredMark(state, markType) === isStoredMark(lastState, markType)
          ) {
            return;
          }

          const isMarkActive = isSuggestMarkActive(markName)(state);

          // clear the mark if the user delete the trigger but remaining mark text
          // stayed.
          // Example `<mark>/hello</mark>` --(user deletes the /)-> `<mark>hello</mark>`
          // -> (clear) ->  hello
          if (isMarkActive && trigger && !doesQueryHaveTrigger(state, markType, trigger)) {
            removeSuggestMark(key)(state, view.dispatch, view);
            return;
          }

          if (!isMarkActive) {
            const keyState = key.getState(state);
            // performance optimization to prevent unnecessary dispatches
            if (keyState?.show === true) {
              hideSuggestionsTooltip(key)(view.state, view.dispatch, view);
            }
            return;
          }
          renderSuggestionsTooltip(key, {})(view.state, view.dispatch, view);
        }
      };
    }
  });
}

function isStoredMark(state: EditorState, markType: MarkType) {
  return state && state.storedMarks && markType.isInSet(state.storedMarks);
}

function isSuggestMarkActive(markName: string) {
  return (state: EditorState) => {
    const { from, to } = state.selection;

    const markType = state.schema.marks[markName];
    return state.doc.rangeHasMark(from - 1, to, markType);
  };
}

function doesQueryHaveTrigger(state: EditorState, markType: MarkType, trigger: string) {
  const { nodeBefore } = state.selection.$from;

  // nodeBefore in a new line (a new paragraph) is null
  if (!nodeBefore) {
    return false;
  }

  const suggestMark = markType.isInSet(nodeBefore.marks || []);

  // suggestMark is undefined if you delete the trigger while keeping rest of the query alive
  if (!suggestMark) {
    return false;
  }

  const textContent = nodeBefore.textContent || '';

  return textContent.includes(trigger);
}

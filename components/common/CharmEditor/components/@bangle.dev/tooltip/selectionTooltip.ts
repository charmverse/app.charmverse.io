import { log as _log } from '@charmverse/core/log';
import { NodeSelection, Plugin, PluginKey } from 'prosemirror-state';
import type { Command, EditorState, Transaction } from 'prosemirror-state';
import type { DirectEditorProps, EditorView } from 'prosemirror-view';

import type { TooltipDOM } from './createTooltipDOM';
import { createTooltipDOM } from './createTooltipDOM';
import type { TooltipRenderOpts } from './tooltipPlacement';
import * as tooltipPlacement from './tooltipPlacement';

export const plugins = selectionTooltip;
export const commands = {
  updateSelectionTooltipType,
  hideSelectionTooltip,
  queryIsSelectionTooltipActive,
  querySelectionTooltipType
};

const LOG = false;

const log = LOG ? _log.debug : () => {};

type SelectionType = string | null;

type CalculateTypeFunction = (state: EditorState, prevType: SelectionType) => SelectionType;

export interface SelectionTooltipProps {
  key?: PluginKey;
  calculateType?: CalculateTypeFunction;
  tooltipRenderOpts?: Omit<TooltipRenderOpts, 'getReferenceElement'>;
}

function selectionTooltip({
  key = new PluginKey('selectionTooltipPlugin'),
  calculateType = (state, _prevType) => {
    return state.selection.empty ? null : 'default';
  },
  tooltipRenderOpts = {}
}: SelectionTooltipProps) {
  return () => {
    // - We are creating tooltipDOMSpec inside the callback because if we create outside
    //   it might get reused by multiple view instances if the caller of
    //   selectionTooltip is not careful and does not make a new selectionTooltip() call.
    //   Though this doesn't mitigate the risk of caller using real
    //   dom instances in the `tooltipRenderOpts.tooltipDOMSpec`.
    // - We are converting to DOM elements so that their instances
    //   can be shared across plugins.
    const tooltipDOMSpec = createTooltipDOM(tooltipRenderOpts.tooltipDOMSpec);
    return [
      selectionTooltipState({
        key,
        tooltipDOMSpec,
        calculateType
      }),
      selectionTooltipController({ stateKey: key }),
      tooltipPlacement.plugins({
        stateKey: key,
        renderOpts: {
          ...tooltipRenderOpts,
          getReferenceElement: getSelectionReferenceElement,
          tooltipDOMSpec
        }
      })
    ];
  };
}

interface SelectionTooltipStateType {
  type: string | null;
  tooltipContentDOM: HTMLElement;
  show: boolean;
  calculateType: CalculateTypeFunction;
}

function selectionTooltipState({
  key,
  calculateType,
  tooltipDOMSpec
}: {
  key: PluginKey;
  calculateType: CalculateTypeFunction;
  tooltipDOMSpec: TooltipDOM;
}) {
  return new Plugin({
    key,
    state: {
      init: (_: any, state: EditorState) => {
        const type = calculateType(state, null);
        return {
          type,
          tooltipContentDOM: tooltipDOMSpec.contentDOM,
          // For tooltipPlacement plugin
          show: typeof type === 'string',
          // helpers
          calculateType
        };
      },
      apply: (tr: Transaction, pluginState: any) => {
        const meta = tr.getMeta(key);
        if (meta === undefined) {
          return pluginState;
        }

        // Do not change object reference if 'type' was and is null
        if (meta.type == null && pluginState.type == null) {
          return pluginState;
        }

        log('update tooltip state to ', meta.type);
        return {
          ...pluginState,
          type: meta.type,
          show: typeof meta.type === 'string'
        };
      }
    }
  });
}

function selectionTooltipController({ stateKey }: { stateKey: PluginKey }) {
  let mouseDown = false;
  return new Plugin({
    props: {
      handleDOMEvents: {
        mousedown: (_view, _event) => {
          mouseDown = true;

          // add listener to document to capture events outside of prosemirror DOM
          function handleMouseUp() {
            mouseDown = false;
            _syncTooltipOnUpdate(stateKey)(_view.state, _view.dispatch, _view);
            document.removeEventListener('mouseup', handleMouseUp);
            return false;
          }
          document.addEventListener('mouseup', handleMouseUp);

          return false;
        },
        mouseup: (view, _event) => {
          mouseDown = false;
          _syncTooltipOnUpdate(stateKey)(view.state, view.dispatch, view);
          return false;
        },
        // hide or show tooltip on blur based on selection
        blur: (view, event) => {
          if (view) {
            // make sure user is not clicking inside a tooltip, which also triggers the 'blur' event
            const isInsideEditorTooltip = Boolean((event.relatedTarget as any)?.closest?.(`.bangle-tooltip`));
            if (!isInsideEditorTooltip) {
              hideSelectionTooltip(stateKey)(view.state, view.dispatch, view);
            }
          }
        }
      } as DirectEditorProps['handleDOMEvents']
    },
    view() {
      return {
        update(view, lastState) {
          const state = view.state;
          if (mouseDown || lastState === state) {
            return;
          }
          if (lastState && lastState.doc.eq(state.doc) && lastState.selection.eq(state.selection)) {
            return;
          }
          return _syncTooltipOnUpdate(stateKey)(view.state, view.dispatch, view);
        }
      };
    }
  });
}

function getSelectionReferenceElement(view: EditorView) {
  return {
    getBoundingClientRect: () => {
      const { selection } = view.state;
      const { head, from, to } = selection;
      // since head is dependent on the users choice of direction,
      // it is not always equal to `from`.
      // For textSelections we want to show the tooltip at head of the
      // selection.
      // But for NodeSelection we always want `from` since, if we go with `head`
      // coordsAtPos(head) might get the position `to` in head, resulting in
      // incorrectly getting position of the node after the selected Node.
      // const pos = selection instanceof NodeSelection ? from : head;

      // Using head actually puts the floating menu wherever the cursor ends - use from for now: https://prosemirror.net/docs/ref/version/0.20.0.html
      const pos = from;

      const start = view.coordsAtPos(pos);
      const { top, bottom, left, right } = start;
      let width = right - left;

      // Not sure why, but coordsAtPos does not return the correct
      // width of the element, so doing this to override it.
      if (selection instanceof NodeSelection) {
        const domNode = view.nodeDOM(pos) as HTMLElement;
        width = domNode ? domNode.clientWidth : width;
      }

      return {
        width,
        height: bottom - top,
        top,
        right,
        bottom,
        left
      } as DOMRect;
    }
  };
}

export function _syncTooltipOnUpdate(key: PluginKey<SelectionTooltipStateType>): Command {
  return (state, dispatch, view) => {
    const tooltipState = key.getState(state)!;
    const newType = tooltipState.calculateType(state, tooltipState.type);

    if (typeof newType === 'string') {
      return updateSelectionTooltipType(key, newType)(state, dispatch, view);
    }

    // Only hide if it is not already hidden
    if (newType == null && tooltipState.type != null) {
      return hideSelectionTooltip(key)(state, dispatch, view);
    }

    return false;
  };
}

/** Commands  */

// This command will rerender if you call it with the type
// it already has. This is done in order to update the position of a tooltip.
export function updateSelectionTooltipType(key: PluginKey, type: SelectionType): Command {
  return (state, dispatch, _view) => {
    log('updateSelectionTooltipType', type);

    if (dispatch) {
      dispatch(state.tr.setMeta(key, { type }).setMeta('addToHistory', false));
    }
    return true;
  };
}

export function hideSelectionTooltip(key: PluginKey): Command {
  return (state, dispatch, _view) => {
    log('hideSelectionTooltip');

    if (dispatch) {
      dispatch(state.tr.setMeta(key, { type: null }).setMeta('addToHistory', false));
    }
    return true;
  };
}

export function queryIsSelectionTooltipActive(key: PluginKey) {
  return (state: EditorState) => {
    const pluginState = key.getState(state);
    return !!(pluginState && typeof pluginState.type === 'string');
  };
}

export function querySelectionTooltipType(key: PluginKey) {
  return (state: EditorState) => {
    const pluginState = key.getState(state);
    return pluginState && pluginState.type;
  };
}

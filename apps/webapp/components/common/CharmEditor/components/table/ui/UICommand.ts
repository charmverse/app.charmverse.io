import { log } from '@charmverse/core/log';
import type { EditorState, Selection } from 'prosemirror-state';
import { Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { SyntheticEvent } from 'react';

export type IsActiveCall = (state: EditorState) => boolean;

export type FindNodeTypeInSelectionCall = (selection: Selection) => object;

const EventType = {
  CLICK: 'mouseup',
  MOUSEENTER: 'mouseenter'
};

function dryRunEditorStateProxyGetter(state: EditorState, propKey: keyof EditorState): any {
  const val = state[propKey];
  if (propKey === 'tr' && val instanceof Transaction) {
    return val.setMeta('dryrun', true);
  }
  return val;
}

function dryRunEditorStateProxySetter(state: EditorState, propKey: keyof EditorState, propValue: string): boolean {
  // @ts-ignore
  state[propKey] = propValue;
  // Indicate success
  return true;
}

class UICommand {
  static EventType = EventType;

  shouldRespondToUIEvent = (e: SyntheticEvent | MouseEvent): boolean => {
    return e.type === UICommand.EventType.CLICK;
  };

  renderLabel = (state: EditorState): any => {
    return null;
  };

  isActive = (state: EditorState): boolean => {
    return false;
  };

  isEnabled = (state: EditorState, view?: EditorView): boolean => {
    return this.dryRun(state, view);
  };

  dryRun = (state: EditorState, view?: EditorView): boolean => {
    const { Proxy } = window;

    const dryRunState = Proxy
      ? new Proxy(state, {
          get: dryRunEditorStateProxyGetter,
          set: dryRunEditorStateProxySetter
        })
      : state;

    return this.execute(dryRunState, undefined, view);
  };

  execute = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView,
    event?: SyntheticEvent
  ): boolean => {
    this.waitForUserInput(state, dispatch, view, event)
      .then((inputs) => {
        this.executeWithUserInput(state, dispatch, view, inputs);
      })
      .catch((error) => {
        log.error('Error executing command', { error });
      });
    return false;
  };

  waitForUserInput = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView,
    event?: SyntheticEvent
  ): Promise<any> => {
    return Promise.resolve(undefined);
  };

  executeWithUserInput = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView,
    inputs?: any
  ): boolean => {
    return false;
  };

  cancel(): void {
    // subclass should overwrite this.
  }
}

export default UICommand;

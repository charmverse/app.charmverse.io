import { rafSchedule } from '@bangle.dev/utils';
import { Plugin, PluginKey } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { useContext, useEffect, useState } from 'react';

import type { BangleEditorStateProps } from '../core/bangle-editor-state';
import { BangleEditorState } from '../core/bangle-editor-state';

import { EditorViewContext } from './editorContext';

export function useEditorState(props: BangleEditorStateProps) {
  if (props.plugins && typeof props.plugins !== 'function') {
    throw new Error('plugins error: plugins must be a function');
  }

  const [state] = useState(
    () =>
      // Instantiate the editorState once and keep using that instance
      // on subsequent renders.
      // Passing a callback in useState lazy calls the
      // functions on the first render and never again.
      new BangleEditorState(props)
  );

  return state;
}

export function usePluginState(pluginKey: PluginKey, throttle = false) {
  const view = useEditorViewContext();
  const [state, setState] = useState(pluginKey.getState(view.state));

  useEffect(() => {
    let _setState = setState;
    if (throttle) {
      _setState = rafSchedule(setState);
    }
    const plugin = watcherPlugin(pluginKey, _setState);
    (view as any)._updatePluginWatcher(plugin);
    return () => {
      if (throttle) {
        (_setState as ReturnType<typeof rafSchedule>).cancel();
      }
      (view as any)._updatePluginWatcher(plugin, true);
    };
  }, [view, pluginKey, throttle]);

  return state;
}

export function useEditorViewContext(): EditorView {
  const context = useContext(EditorViewContext);
  if (!context) {
    throw new Error('useEditorViewContext must be used within a EditorViewContext');
  }
  return context;
}

function watcherPlugin(pluginKey: PluginKey, setState: (state: any) => void) {
  return new Plugin({
    key: new PluginKey(`withPluginState_${(pluginKey as any).key}`),
    view() {
      return {
        update(view, prevState) {
          const { state } = view;
          if (prevState === state) {
            return;
          }
          const newPluginState = pluginKey.getState(state);

          if (newPluginState !== pluginKey.getState(prevState)) {
            setState(newPluginState);
          }
        }
      };
    }
  });
}

import { removeSuggestMark } from '@packages/bangleeditor/components/@bangle.dev/tooltip/suggestTooltipSpec';
import type { EditorState, PluginKey, Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { useCallback, useEffect } from 'react';

import { useEditorViewContext, usePluginState } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';

import { getSuggestTooltipKey } from './inlinePalette';
import type { InlinePaletteItem } from './paletteItem';

export function useInlinePaletteQuery(palettePluginKey: PluginKey) {
  const view = useEditorViewContext();
  const pluginKey = getSuggestTooltipKey(palettePluginKey)(view.state) as PluginKey; // usePluginState is not typed correctly
  // TODO show is a bad name
  const { triggerText: query, counter, show: isVisible } = usePluginState(pluginKey, true);
  const { tooltipContentDOM } = usePluginState(palettePluginKey);

  return { query, counter, isVisible, tooltipContentDOM };
}
/**
 * Hook which takes a function to get the items to render.
 * returns the properties needed to get on click and enter working
 * on these items.
 * TODO this api can be improved currently its unituitive
 * @param {*} param0
 * @returns
 */
export function useInlinePaletteItems<T extends InlinePaletteItem>(
  palettePluginKey: PluginKey,
  items: T[],
  counter: number,
  isItemDisabled?: (item: T) => boolean
): {
  getItemProps: (
    item: T,
    index: number
  ) => {
    isActive: boolean;
    onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  };
  dismissPalette: () => boolean;
} {
  const { setExecuteItemCommand } = usePluginState(palettePluginKey);
  const view = useEditorViewContext();

  const dismissPalette = useCallback(() => {
    return removeSuggestMark(palettePluginKey)(view.state, view.dispatch, view);
  }, [view, palettePluginKey]);

  const activeIndex = getActiveIndex(counter, items.length);

  const executeHandler = useCallback(
    (itemIndex: number) => {
      const item = items[itemIndex];

      if (!item) {
        return removeSuggestMark(palettePluginKey);
      }

      if (isItemDisabled?.(item)) {
        // still handle the key
        return () => true;
      }

      return (state: EditorState, dispatch: ((tr: Transaction) => void) | undefined, _view: EditorView) => {
        return item.editorExecuteCommand({
          item,
          palettePluginKey,
          itemIndex
        })(state, dispatch, _view);
      };
    },
    [palettePluginKey, items, isItemDisabled]
  );

  useEffect(() => {
    // Save the callback to get the active item so that the plugin
    // can execute an enter on the active item
    setExecuteItemCommand(
      (state: EditorState, dispatch: ((tr: Transaction) => void) | undefined, _view: EditorView) => {
        const result = executeHandler(getActiveIndex(counter, items.length))(state, dispatch, _view);
        return result;
      }
    );
    return () => {
      setExecuteItemCommand(undefined);
    };
  }, [setExecuteItemCommand, executeHandler, items, counter]);

  const getItemProps = useCallback(
    (item: T, index: number) => {
      return {
        isActive: activeIndex === index,
        onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          if (executeHandler(index)(view.state, view.dispatch, view)) {
            e.preventDefault();
          }
        }
      };
    },
    [activeIndex, executeHandler, view]
  );

  return {
    getItemProps,
    dismissPalette
  };
}

function getActiveIndex(counter: number, size: number): number {
  const r = counter % size;
  return r < 0 ? r + size : r;
}

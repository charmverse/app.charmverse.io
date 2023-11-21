import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import type { BoardView } from 'lib/focalboard/boardView';

export function useViewSortOptions(activeView: BoardView) {
  const { sortOptions: globalSortOptions } = activeView.fields;
  const localViewSettings = useLocalDbViewSettings();

  return localViewSettings?.localSort ? localViewSettings.localSort : globalSortOptions;
}

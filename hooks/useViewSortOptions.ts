import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import type { BoardView } from 'lib/databases/boardView';

export function useViewSortOptions(activeView: BoardView) {
  const { sortOptions: globalSortOptions } = activeView.fields;
  const localViewSettings = useLocalDbViewSettings();

  return localViewSettings?.localSort ? localViewSettings.localSort : globalSortOptions;
}

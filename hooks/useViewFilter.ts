import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import type { BoardView } from 'lib/databases/boardView';

export function useViewFilter(activeView: BoardView) {
  const { filter: globalFilter } = activeView.fields;
  const localViewSettings = useLocalDbViewSettings();

  return localViewSettings?.localFilters ? localViewSettings.localFilters : globalFilter;
}

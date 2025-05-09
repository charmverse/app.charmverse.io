import type { SxProps } from '@mui/material';
import { Stack, Tooltip, Typography } from '@mui/material';

import { Button } from 'components/common/Button';
import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import type { BoardView } from '@packages/databases/boardView';

import mutator from '../mutator';

type Props = {
  activeView: BoardView;
  canSaveGlobally: boolean;
  sx?: SxProps;
};

export function ViewSettingsRow({ activeView, canSaveGlobally, sx }: Props) {
  const localViewSettings = useLocalDbViewSettings(activeView.id);

  if (!localViewSettings) {
    return null;
  }

  const { resetLocalSettings, localFilters, localSort, hasLocalFiltersEnabled, hasLocalSortEnabled, setLocalSort } =
    localViewSettings;

  const hasLocalFilters = hasLocalFiltersEnabled(activeView.fields.filter);
  const hasLocalSort = hasLocalSortEnabled(activeView.fields.sortOptions);
  const hasLocalSettingsEnabled = hasLocalFilters || hasLocalSort;

  const saveSettingsGlobally = () => {
    if (!canSaveGlobally) {
      return;
    }

    if (localSort) {
      mutator.changeViewSortOptions(activeView.id, activeView.fields.sortOptions, localSort);
      // reset after saving
      if (!localSort.length) {
        setLocalSort(null);
      }
    }

    if (localFilters) {
      mutator.changeViewFilter(activeView.id, activeView.fields.filter, localFilters);
    }
  };

  const getSettingsLabel = () => {
    const activeLocalSettings = [];
    if (hasLocalFilters) {
      activeLocalSettings.push('filters');
    }

    if (hasLocalSort) {
      activeLocalSettings.push('sort');
    }

    return activeLocalSettings.join(' & ');
  };

  if (!hasLocalSettingsEnabled) {
    return null;
  }

  return (
    <Stack flex={1} direction='row' justifyContent='flex-end' mx={2} gap={1} sx={sx}>
      <Tooltip title={`Reset local ${getSettingsLabel()} to global default`}>
        <Button
          data-test='reset-database-filters'
          onClick={resetLocalSettings}
          variant='text'
          color='secondary'
          size='small'
        >
          {canSaveGlobally ? 'Reset' : `Reset default ${getSettingsLabel()}`}
        </Button>
      </Tooltip>
      {canSaveGlobally && (
        <Button onClick={saveSettingsGlobally} variant='outlined' color='warning' size='small'>
          {`Save ${getSettingsLabel()} for everyone`}
        </Button>
      )}
    </Stack>
  );
}

import { Stack, Typography } from '@mui/material';

import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { Button } from 'components/common/Button';
import { useLocalDbViewSettings, type DbViewLocalOptions } from 'hooks/useLocalDbViewSettings';
import type { BoardView } from 'lib/focalboard/boardView';

type Props = {
  activeView: BoardView;
  canSaveGlobally: boolean;
};

export function ViewSettingsRow({ activeView, canSaveGlobally }: Props) {
  const localViewSettings = useLocalDbViewSettings(activeView.id);

  if (!localViewSettings) {
    return null;
  }

  const { resetLocalSettings, localFilters, localSort, hasLocalFiltersEnabled, hasLocalSortEnabled } =
    localViewSettings;

  const hasLocalFilters = hasLocalFiltersEnabled(activeView.fields.filters);
  const hasLocalSort = hasLocalSortEnabled(activeView.fields.sortOptions);
  const hasLocalSettingsEnabled = hasLocalFilters || hasLocalSort;

  const saveSettingsGlobally = () => {
    if (!canSaveGlobally) {
      return;
    }

    if (localSort) {
      mutator.changeViewSortOptions(activeView.id, activeView.fields.sortOptions, localSort);
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
    <Stack flex={1} direction='row' justifyContent='flex-end' mx={2} gap={1}>
      <Typography>
        {hasLocalFilters && 'local filters on'} {hasLocalSort && 'local sort on'}
      </Typography>
      <Button onClick={resetLocalSettings} variant='text' color='secondary' size='small'>
        {canSaveGlobally ? 'Reset' : `Reset default ${getSettingsLabel()}`}
      </Button>
      {canSaveGlobally && (
        <Button onClick={saveSettingsGlobally} variant='outlined' color='warning' size='small'>
          {`Save ${getSettingsLabel()} for everyone`}
        </Button>
      )}
    </Stack>
  );
}

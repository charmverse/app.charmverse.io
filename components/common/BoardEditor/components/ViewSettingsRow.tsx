import { Stack, Typography } from '@mui/material';

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

  const hasLocalSettingsEnabled = hasLocalFiltersEnabled || hasLocalSortEnabled;

  // check if custom sort filters are set - compare with activeView filters / sort
  // show reset and save if admin
  // show reset if not admin

  if (!hasLocalSettingsEnabled) {
    return null;
  }

  return (
    <Stack flex={1} direction='row' justifyContent='flex-end' mx={2}>
      <Typography>
        {hasLocalFiltersEnabled && 'local filters on'} {hasLocalSortEnabled && 'local sort on'}
      </Typography>
    </Stack>
  );
}

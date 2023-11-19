import { Stack, Typography } from '@mui/material';

import type { DbViewLocalOptions } from 'hooks/useLocalDbViewSettings';
import type { BoardView } from 'lib/focalboard/boardView';

type Props = {
  activeView: BoardView;
} & DbViewLocalOptions;

export function ViewSettingsRow({ localFilters, setLocalFilters, localSort, setLocalSort, activeView }: Props) {
  // check if custom sort filters are set
  // show reset and save if admin
  // show reset if not admin

  return (
    <Stack flex={1} direction='row' justifyContent='flex-end' mx={2}>
      <Typography>filters reset</Typography>
    </Stack>
  );
}

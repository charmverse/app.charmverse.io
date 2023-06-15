import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

import { usePagePermissionsList } from 'hooks/usePagePermissionsList';

import FreePagePermissions from './FreePagePermissions';
import FreeShareToWeb from './FreeShareToWeb';

type Props = {
  pageId: string;
};

export function FreePagePermissionsContainer({ pageId }: Props) {
  return (
    <Box>
      <FreeShareToWeb pageId={pageId} />
      <Divider />
      <FreePagePermissions pageId={pageId} />
    </Box>
  );
}

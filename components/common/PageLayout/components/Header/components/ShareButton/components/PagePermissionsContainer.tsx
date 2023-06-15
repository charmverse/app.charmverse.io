import type { AssignedPagePermission } from '@charmverse/core/permissions';
import { Box, Divider } from '@mui/material';

import Loader from 'components/common/Loader';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { usePagePermissionsList } from 'hooks/usePagePermissionsList';

import FreePagePermissions from './FreePagePermissions/FreePagePermissions';
import FreeShareToWeb from './FreePagePermissions/FreeShareToWeb';
import PaidPagePermissions from './PaidPagePermissions/PaidPagePermissions';
import PaidShareToWeb from './PaidPagePermissions/PaidShareToWeb';

type Props = {
  pageId: string;
};

export function PagePermissionsContainer({ pageId }: Props) {
  const { isFreeSpace } = useIsFreeSpace();

  const { pagePermissions, refreshPermissions } = usePagePermissionsList({
    pageId: !isFreeSpace ? pageId : null
  });

  if (!isFreeSpace && !pagePermissions) {
    return (
      <Box
        sx={{
          height: 100
        }}
      >
        <Loader size={20} sx={{ height: 100 }} />
      </Box>
    );
  }

  return (
    <Box p={2} pt={1}>
      {isFreeSpace ? (
        <FreeShareToWeb pageId={pageId} />
      ) : (
        <PaidShareToWeb
          pageId={pageId}
          pagePermissions={pagePermissions as AssignedPagePermission[]}
          refreshPermissions={refreshPermissions}
        />
      )}

      <Divider sx={{ my: 1 }} />
      {isFreeSpace ? (
        <FreePagePermissions pageId={pageId} />
      ) : (
        <PaidPagePermissions
          pagePermissions={pagePermissions as AssignedPagePermission[]}
          refreshPermissions={refreshPermissions}
          pageId={pageId}
        />
      )}
    </Box>
  );
}

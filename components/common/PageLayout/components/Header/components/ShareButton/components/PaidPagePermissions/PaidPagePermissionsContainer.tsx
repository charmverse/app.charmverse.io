import { Box, Divider } from '@mui/material';

import Loader from 'components/common/Loader';
import { usePagePermissionsList } from 'hooks/usePagePermissionsList';

import PaidPagePermissions from './PaidPagePermissions';
import PaidShareToWeb from './PaidShareToWeb';

type Props = {
  pageId: string;
};
export function PaidPagePermissionsContainer({ pageId }: Props) {
  const { pagePermissions, refreshPermissions } = usePagePermissionsList({
    pageId
  });

  <Box sx={{ height: 100 }}></Box>;

  return (
    <Box sx={{ minHeight: 100 }}>
      {' '}
      {!pagePermissions ? (
        <Loader size={20} sx={{ height: 600 }} />
      ) : (
        <>
          <PaidShareToWeb pageId={pageId} pagePermissions={pagePermissions} refreshPermissions={refreshPermissions} />
          <Divider />
          <PaidPagePermissions
            pagePermissions={pagePermissions}
            refreshPermissions={refreshPermissions}
            pageId={pageId}
          />
        </>
      )}
    </Box>
  );
}

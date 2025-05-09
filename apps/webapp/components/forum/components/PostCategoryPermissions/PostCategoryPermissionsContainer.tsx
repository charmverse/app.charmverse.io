import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';

import Loader from 'components/common/LoadingComponent';
import Modal from 'components/common/Modal';
import { usePostCategoryPermissionsList } from 'components/forum/hooks/usePostCategoryPermissionsList';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useRoles } from 'hooks/useRoles';

import { FreePostCategoryPermissions } from './FreePostCategoryPermissions/FreePostCategoryPermissions';
import { FreeSharePostCategoryToWeb } from './FreePostCategoryPermissions/FreeSharePostCategoryToWeb';
import { PaidPostCategoryPermissions } from './PaidPostCategoryPermissions/PaidPostCategoryPermissions';
import { PaidSharePostCategoryToWeb } from './PaidPostCategoryPermissions/PaidSharePostCategoryToWeb';

/**
 * @permissions The actions a user can perform on a post category
 *
 * @abstract All other permissions inside this component are the actual assigned list of permissions to various groups for this post category
 */
function PostCategoryPermissionsContainer({ postCategoryId }: { postCategoryId: string }) {
  const { permissionsList } = usePostCategoryPermissionsList({
    postCategoryId
  });
  const { isFreeSpace } = useIsFreeSpace();
  const { roles } = useRoles();

  if (!permissionsList && !isFreeSpace) {
    return (
      <Box sx={{ my: 2 }}>
        <Loader />
      </Box>
    );
  }

  return (
    <Box data-test='category-permissions-dialog'>
      <Stack spacing={2}>
        {isFreeSpace ? <FreeSharePostCategoryToWeb /> : <PaidSharePostCategoryToWeb postCategoryId={postCategoryId} />}
        <Divider sx={{ my: 2 }} />

        {isFreeSpace ? (
          <FreePostCategoryPermissions postCategoryId={postCategoryId} />
        ) : (
          <PaidPostCategoryPermissions postCategoryId={postCategoryId} />
        )}
      </Stack>
    </Box>
  );
}

type PostCategoryDialogProps = {
  category: { id: string; name: string };
  onClose: () => void;
  open: boolean;
};

export function PostCategoryPermissionsDialog({ category, onClose, open }: PostCategoryDialogProps) {
  return (
    <Modal mobileDialog onClose={onClose} title={`${category.name} permissions`} open={open}>
      <PostCategoryPermissionsContainer postCategoryId={category.id} />
    </Modal>
  );
}

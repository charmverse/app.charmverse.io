import type { PostCategory } from '@charmverse/core/prisma';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import Loader from 'components/common/LoadingComponent';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import { PostCategoryRolePermissionRow } from './PostCategoryPermissionRow';

/**
 * @permissions The actions a user can perform on a post category
 *
 * @abstract All other permissions inside this component are the actual assigned list of permissions to various groups for this post category
 */
type Props = {
  postCategory: PostCategory;
};
function PostCategoryPermissions({ postCategory }: Props) {
  const space = useCurrentSpace();

  if (!space) {
    return (
      <Box sx={{ my: 2 }}>
        <Loader />
      </Box>
    );
  }

  return (
    <Box data-test='category-permissions-dialog'>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Typography variant='body2'>Public category</Typography>
            <Switch data-test='toggle-public-page' checked={true} disabled={true} />
          </Box>
          <Typography variant='caption'>Anyone on the web can view this category.</Typography>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Grid item xs={12}>
          <PostCategoryRolePermissionRow
            canEdit={false}
            deletePermission={() => null}
            updatePermission={() => null}
            postCategoryId={postCategory.id}
            disabledTooltip='Public spaces have fixed permissions.'
            defaultPermissionLevel='full_access'
            assignee={{ group: 'space', id: space.id }}
          />
        </Grid>
        <Divider sx={{ my: 2 }} />

        <Grid item xs={12}>
          <Typography variant='caption'>Public spaces have fixed permissions.</Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

type PostCategoryDialogProps = Props & {
  onClose: () => void;
  open: boolean;
};

export function PostCategoryPermissionsDialogPublic({ postCategory, onClose, open }: PostCategoryDialogProps) {
  return (
    <Modal mobileDialog onClose={onClose} title={`${postCategory.name} permissions`} open={open}>
      <PostCategoryPermissions postCategory={postCategory} />
    </Modal>
  );
}

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import type { PostCategory } from '@prisma/client';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Loader from 'components/common/LoadingComponent';
import Modal from 'components/common/Modal';
import { usePostCategoryPermissions } from 'components/forum/hooks/usePostCategoryPermissions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';

type Props = {
  postCategory: PostCategory;
};

function PostCategoryPermissions({ postCategory }: Props) {
  const { data, isLoading } = useSWR(`/api/forum/list-post-category-permissions-${postCategory.id}`, () =>
    charmClient.permissions.listPostCategoryPermissions(postCategory.id)
  );

  const space = useCurrentSpace();

  if (!data || !space) {
    return (
      <Box sx={{ my: 2 }}>
        <Loader />
      </Box>
    );
  }

  //  const spacePermission = data.find((p) => p.spaceId === space.id);

  return (
    <Box>
      <Grid container>
        <Grid item xs={12}></Grid>
      </Grid>
    </Box>
  );
}

type PostCategoryDialogProps = Props & {
  onClose: () => void;
  open: boolean;
};

export function PostCategoryPermissionsDialog({ postCategory, onClose, open }: PostCategoryDialogProps) {
  return (
    <Modal onClose={onClose} title={`${postCategory.name} permissions`} open={open}>
      <PostCategoryPermissions postCategory={postCategory} />
    </Modal>
  );
}

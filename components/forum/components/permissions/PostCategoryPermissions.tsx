import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Loader from 'components/common/LoadingComponent';

type Props = {
  postCategoryId: string;
};

export function PostCategoryPermissions({ postCategoryId }: Props) {
  const { data, isLoading } = useSWR(`/api/forum/list-post-category-permissions-${postCategoryId}`, () =>
    charmClient.permissions.listPostCategoryPermissions(postCategoryId)
  );

  return (
    <Box>
      {true && <Loader />}
      {/* <Grid container></Grid>
      <h1>Post Category Permissions</h1> */}
    </Box>
  );
}

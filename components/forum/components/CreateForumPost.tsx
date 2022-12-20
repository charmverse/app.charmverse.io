import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import { useRouter } from 'next/router';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import UserDisplay from 'components/common/UserDisplay';
import { usePostDialog } from 'components/forum/components/PostDialog/hooks/usePostDialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useUser } from 'hooks/useUser';
import type { PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import type { Member } from 'lib/members/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

function CreateForumPost({
  setPosts
}: {
  setPosts: Dispatch<
    SetStateAction<PaginatedPostList<{
      user?: Member | undefined;
    }> | null>
  >;
}) {
  const { user } = useUser();
  const currentSpace = useCurrentSpace();
  const [userSpacePermissions] = useCurrentSpacePermissions();
  const { showPost } = usePostDialog();
  const [createPageLoading, setCreatePageLoading] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const router = useRouter();

  const addPageCb = useCallback(async () => {
    if (user && currentSpace) {
      setCreatePageLoading(true);
      const page = await charmClient.forum.createForumPost({
        content: null,
        contentText: '',
        spaceId: currentSpace.id,
        title: pageTitle
      });
      setUrlWithoutRerender(router.pathname, { pageId: page.id });
      showPost({
        postId: page.id,
        onClose() {
          setUrlWithoutRerender(router.pathname, { pageId: null });
        }
      });
      setPageTitle('');
      setCreatePageLoading(false);
      setPosts((paginatedPostList) => {
        return paginatedPostList
          ? {
              ...paginatedPostList,
              data: [page, ...paginatedPostList.data]
            }
          : null;
      });
    }
  }, [currentSpace, user, pageTitle]);

  return (
    <Card variant='outlined' sx={{ mb: '15px' }}>
      <CardActionArea disabled={createPageLoading || !userSpacePermissions?.createPage}>
        <CardContent>
          <Box display='flex' flexDirection='row' justifyContent='space-between' mb='16px'>
            <UserDisplay user={user} avatarSize='medium' hideName mr='10px' />
            <TextField
              variant='outlined'
              placeholder='Title of your post...'
              value={pageTitle}
              fullWidth
              onChange={(e) => {
                setPageTitle(e.target.value);
              }}
            />
          </Box>
          <Box display='flex' justifyContent='flex-end'>
            <Button
              disabledTooltip='You are not allowed to create a post'
              disabled={!userSpacePermissions?.createPage}
              component='div'
              float='right'
              onClick={addPageCb}
            >
              Create Post
            </Button>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default CreateForumPost;

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import { useRouter } from 'next/router';
import { forwardRef, useCallback, useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { usePostDialog } from 'components/common/PostDialog/hooks/usePostDialog';
import UserDisplay from 'components/common/UserDisplay';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useUser } from 'hooks/useUser';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

const CreateForumPost = forwardRef<HTMLDivElement>((_, ref) => {
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
        content: { type: 'doc' },
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
    }
  }, [currentSpace, user, pageTitle]);

  return (
    <Card variant='outlined' sx={{ mb: '15px' }} ref={ref}>
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
});

export default CreateForumPost;

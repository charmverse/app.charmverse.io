import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import { useCallback, useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import UserDisplay from 'components/common/UserDisplay';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useUser } from 'hooks/useUser';

export default function CreateForumPost() {
  const { user } = useUser();
  const currentSpace = useCurrentSpace();
  const [userSpacePermissions] = useCurrentSpacePermissions();
  const { showPage } = usePageDialog();
  const [createPageLoading, setCreatePageLoading] = useState(false);
  const [pageTitle, setPageTitle] = useState('');

  const addPageCb = useCallback(async () => {
    if (user && currentSpace) {
      setCreatePageLoading(true);
      const page = await charmClient.forum.createForumPost({
        content: { type: 'doc' },
        contentText: '',
        spaceId: currentSpace.id,
        title: pageTitle
      });
      showPage({
        pageId: page.id
      });
      setPageTitle('');
      setCreatePageLoading(false);
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
              placeholder='Create post'
              value={pageTitle}
              fullWidth
              onChange={(e) => {
                setPageTitle(e.target.value);
              }}
            />
          </Box>
          <Box display='flex' justifyContent='flex-end'>
            <Button disabled={!userSpacePermissions?.createPage} component='div' float='right' onClick={addPageCb}>
              Create Post
            </Button>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

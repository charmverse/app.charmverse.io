import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import { useCallback, useState } from 'react';

import Button from 'components/common/Button';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import UserDisplay from 'components/common/UserDisplay';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useUser } from 'hooks/useUser';
import { addPage } from 'lib/pages';

export default function CreateForumPost() {
  const { user } = useUser();
  const currentSpace = useCurrentSpace();
  const [userSpacePermissions] = useCurrentSpacePermissions();
  const { showPage } = usePageDialog();
  const [createPageLoading, setCreatePageLoading] = useState(false);

  const addPageCb = useCallback(async () => {
    if (user && currentSpace) {
      setCreatePageLoading(true);
      const { page } = await addPage({
        type: 'post',
        createdBy: user.id,
        spaceId: currentSpace.id,
        shouldCreateDefaultBoardData: false
      });
      showPage({ pageId: page.id });
      setCreatePageLoading(false);
    }
  }, [currentSpace, user]);

  return (
    <Card variant='outlined' sx={{ mb: '15px' }}>
      <CardActionArea disabled={createPageLoading} onClick={addPageCb}>
        <CardContent>
          <Box display='flex' flexDirection='row' justifyContent='space-between' mb='16px'>
            <UserDisplay user={user} avatarSize='medium' hideName mr='10px' />
            <TextField variant='outlined' placeholder='Create post' fullWidth />
          </Box>
          <Box display='flex' justifyContent='flex-end'>
            <Button component='div' float='right'>
              Create Post
            </Button>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

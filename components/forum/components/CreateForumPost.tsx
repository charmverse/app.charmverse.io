import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';

import Button from 'components/common/Button';
import UserDisplay from 'components/common/UserDisplay';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useForumCategories } from 'hooks/useForumCategories';
import { useUser } from 'hooks/useUser';

export function CreateForumPost({ onClick }: { onClick: () => void }) {
  const { user } = useUser();
  const [userSpacePermissions] = useCurrentSpacePermissions();
  const { categories } = useForumCategories();
  const canPost = categories.filter((c) => c.create_post).length > 0;

  function clickHandler() {
    if (userSpacePermissions?.createPage) {
      onClick();
    }
  }
  return (
    <Card variant='outlined' sx={{ mb: '15px' }} onClick={clickHandler}>
      <CardActionArea disabled={!userSpacePermissions?.createPage}>
        <CardContent>
          <Box display='flex' flexDirection='row' justifyContent='space-between' mb='16px'>
            <UserDisplay user={user} avatarSize='medium' hideName mr='10px' />
            <TextField variant='outlined' placeholder='Create Post' fullWidth />
          </Box>
          <Box display='flex' justifyContent='flex-end'>
            <Button
              disabledTooltip='There are no categories in which you can create a post.'
              disabled={!canPost}
              component='div'
              float='right'
            >
              Create Post
            </Button>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

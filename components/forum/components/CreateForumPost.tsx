import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';

import Button from 'components/common/Button';
import UserDisplay from 'components/common/UserDisplay';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useUser } from 'hooks/useUser';

export function CreateForumPost({ onClick }: { onClick: () => void }) {
  const { user } = useUser();
  const [userSpacePermissions] = useCurrentSpacePermissions();

  function clickHandler() {
    if (userSpacePermissions?.createPage) {
      onClick();
    }
  }

  return (
    <Card variant='outlined' sx={{ mb: '15px' }} onClick={clickHandler}>
      <CardActionArea disabled={!userSpacePermissions?.createPage}>
        <CardContent>
          <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' gap={1}>
            <UserDisplay user={user} avatarSize='medium' hideName />
            <TextField variant='outlined' placeholder='Create Post' fullWidth sx={{ pointerEvents: 'none' }} disabled />
            <Button
              disabledTooltip='You are not allowed to create a post'
              disabled={!userSpacePermissions?.createPage}
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

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';

import Button from 'components/common/Button';
import UserDisplay from 'components/common/UserDisplay';
import { useUser } from 'hooks/useUser';

export default function CreateForumPost () {
  const { user } = useUser();

  return (
    <Card variant='outlined' sx={{ mb: '15px' }}>
      <CardActionArea onClick={() => alert('Create page')}>
        <CardContent>
          <Box display='flex' flexDirection='row' justifyContent='space-between' mb='16px'>
            <UserDisplay user={user} avatarSize='medium' hideName mr='10px' />
            <TextField
              variant='outlined'
              placeholder='Create post'
              fullWidth
            />
          </Box>
          <Box display='flex' justifyContent='flex-end'>
            <Button component='div' float='right'>Create Post</Button>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

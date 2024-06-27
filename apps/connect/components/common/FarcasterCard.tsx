import { Avatar } from '@connect/components/common/Avatar';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Stack } from '@mui/system';

export function FarcasterCard({
  name,
  username,
  avatar,
  bio,
  fid
}: {
  name?: string;
  bio?: string;
  username?: string;
  fid?: number;
  avatar?: string;
}) {
  return (
    <Card>
      <CardContent
        sx={{
          display: 'flex',
          gap: 2,
          flexDirection: {
            xs: 'column',
            sm: 'row'
          }
        }}
      >
        <Stack
          alignItems={{
            xs: 'center',
            sm: 'flex-start'
          }}
        >
          <Avatar size='xLarge' name={username || 'N/A'} avatar={avatar} />
        </Stack>
        <Box>
          <Typography variant='h6'>{name || 'N/A'}</Typography>
          <Typography variant='subtitle1' color='secondary'>
            {username || 'N/A'} #{fid || 'N/A'}
          </Typography>
          <Typography>{bio}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

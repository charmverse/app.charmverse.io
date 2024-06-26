import { Avatar } from '@connect/components/common/Avatar';
import { Box, Card, CardContent, Typography } from '@mui/material';

export function FarcasterCard({ username, avatar, bio }: { bio: string; username: string; avatar: string }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', gap: 2 }}>
        <Avatar size='xLarge' name={username} avatar={avatar} />
        <Box>
          <Typography>{username}</Typography>
          <Typography>{bio}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

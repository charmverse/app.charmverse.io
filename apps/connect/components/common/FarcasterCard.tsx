import { Avatar } from '@connect/components/common/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

export function FarcasterCard({ username, pfpUrl, bio }: any) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', gap: 2 }}>
        <Avatar size='xLarge' name={username} avatar={pfpUrl} />
        <Box>
          <Typography>{username}</Typography>
          <Typography>{bio}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
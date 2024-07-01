import type { AvatarSize } from '@connect/components/common/Avatar';
import { Avatar } from '@connect/components/common/Avatar';
import { DeleteOutline } from '@mui/icons-material';
import { Box, Card, CardActionArea, CardContent, IconButton, Link, Typography } from '@mui/material';
import { Stack } from '@mui/system';

export function FarcasterCard({
  name,
  username,
  avatar,
  bio,
  fid,
  avatarSize = 'xLarge',
  onDelete
}: {
  name?: string;
  bio?: string;
  username?: string;
  fid?: number;
  avatar?: string;
  avatarSize?: AvatarSize;
  onDelete?: VoidFunction;
}) {
  return (
    <Card>
      <CardActionArea LinkComponent={Link} href={`/u/${username}`} hrefLang='en'>
        <CardContent
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
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
            <Avatar size={avatarSize} name={username || 'N/A'} avatar={avatar} />
          </Stack>
          <Box width='100%'>
            <Stack direction='row' justifyContent='space-between' width='100%' alignItems='center'>
              <Typography variant='h6'>{name || 'N/A'}</Typography>
              {onDelete && (
                <IconButton size='small'>
                  <DeleteOutline color='error' onClick={onDelete} fontSize='small' />
                </IconButton>
              )}
            </Stack>
            <Typography variant='subtitle1' color='secondary'>
              {username || 'N/A'} #{fid || 'N/A'}
            </Typography>
            <Typography>{bio}</Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

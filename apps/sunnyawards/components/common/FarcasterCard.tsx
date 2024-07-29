import { Avatar } from '@connect-shared/components/common/Avatar';
import type { AvatarSize } from '@connect-shared/components/common/Avatar';
import { DeleteOutline } from '@mui/icons-material';
import { Box, Card, CardActionArea, CardContent, IconButton, Stack, Typography } from '@mui/material';
import Link from 'next/link';

function FarcasterCardContent({
  avatar,
  name,
  bio,
  username,
  avatarSize = 'xLarge',
  onDelete
}: {
  name?: string;
  bio?: string;
  username?: string;
  avatar?: string;
  avatarSize?: AvatarSize;
  onDelete?: VoidFunction;
}) {
  return (
    <CardContent
      sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        flexDirection: 'row'
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
          @{username || 'N/A'}
        </Typography>
        <Typography>{bio}</Typography>
      </Box>
    </CardContent>
  );
}

export function FarcasterCard(props: {
  name?: string;
  bio?: string;
  username?: string;
  fid?: number;
  avatar?: string;
  avatarSize?: AvatarSize;
  onDelete?: VoidFunction;
  enableLink?: boolean;
}) {
  if (!props.enableLink || !props.username) {
    return (
      <Card>
        <FarcasterCardContent {...props} />
      </Card>
    );
  }

  return (
    <Card>
      <CardActionArea LinkComponent={Link} href={`/u/${props.username}`} hrefLang='en'>
        <FarcasterCardContent {...props} />
      </CardActionArea>
    </Card>
  );
}

import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { DeleteOutline } from '@mui/icons-material';
import { Box, Card, CardActionArea, CardContent, IconButton, Stack, Typography } from '@mui/material';
import { Avatar } from '@packages/connect-shared/components/common/Avatar';
import type { AvatarSize } from '@packages/connect-shared/components/common/Avatar';
import { CardMotion } from '@packages/connect-shared/components/common/Motions/CardMotion';
import type { LoggedInUser } from '@packages/connect-shared/lib/profile/getCurrentUserAction';
import Link from 'next/link';

export function getFarcasterCardDisplayDetails(user: LoggedInUser) {
  const farcasterDetails = user.farcasterUser?.account as Required<FarcasterBody> | undefined;
  return user.farcasterUser
    ? {
        username: farcasterDetails?.username,
        name: farcasterDetails?.displayName,
        avatar: farcasterDetails?.pfpUrl,
        bio: farcasterDetails?.bio
      }
    : {
        username: '',
        name: user.username,
        avatar: user.avatar,
        bio: ''
      };
}

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
  avatar?: string | null;
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
        <Avatar size={avatarSize} name={username} avatar={avatar || undefined} />
      </Stack>
      <Box width='100%' sx={{ wordBreak: 'break-all' }}>
        <Stack direction='row' justifyContent='space-between' width='100%' alignItems='center'>
          <Typography variant='h6'>{name || 'N/A'}</Typography>
          {onDelete && (
            <IconButton size='small'>
              <DeleteOutline color='error' onClick={onDelete} fontSize='small' />
            </IconButton>
          )}
        </Stack>
        {username && (
          <Typography variant='subtitle1' color='secondary'>
            @{username}
          </Typography>
        )}
        <Typography
          sx={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: '2'
          }}
        >
          {bio}
        </Typography>
      </Box>
    </CardContent>
  );
}

export function FarcasterCard(props: {
  name?: string;
  bio?: string;
  username?: string;
  fid?: number;
  avatar?: string | null;
  avatarSize?: AvatarSize;
  onDelete?: VoidFunction;
  enableLink?: boolean;
  isCurrentUser?: boolean;
}) {
  if (!props.enableLink || !props.username) {
    return (
      <Card>
        <FarcasterCardContent {...props} />
      </Card>
    );
  }

  const href = props.isCurrentUser ? '/profile' : `/u/${props.username}`;

  return (
    <CardMotion>
      <CardActionArea LinkComponent={Link} href={href} hrefLang='en'>
        <FarcasterCardContent {...props} />
      </CardActionArea>
    </CardMotion>
  );
}

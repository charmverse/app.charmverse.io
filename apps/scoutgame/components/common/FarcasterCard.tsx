import { CardActionArea, Stack, Typography } from '@mui/material';
import Link from 'next/link';

import type { AvatarSize } from './Avatar';
import { Avatar } from './Avatar';
import { CardMotion } from './Motions/CardMotion';

type Props = {
  name: string;
  username: string;
  avatar: string | null;
  avatarSize?: AvatarSize;
};

function FarcasterCardContent({ avatar, name, username, avatarSize = 'xLarge' }: Props) {
  return (
    <Stack
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
        <Avatar size={avatarSize} name={username} src={avatar} />
      </Stack>
      <Stack width='100%' gap={1}>
        <Stack direction='row' justifyContent='space-between' width='100%' alignItems='center'>
          <Typography variant='h5'>{name}</Typography>
        </Stack>
        <Typography>{username}</Typography>
      </Stack>
    </Stack>
  );
}

export function FarcasterCard(
  props: Props & {
    enableLink?: boolean;
  }
) {
  if (!props.enableLink || !props.username) {
    return <FarcasterCardContent {...props} />;
  }

  return (
    <CardMotion>
      <CardActionArea LinkComponent={Link} href={`/u/${props.username}`} hrefLang='en'>
        <FarcasterCardContent {...props} />
      </CardActionArea>
    </CardMotion>
  );
}

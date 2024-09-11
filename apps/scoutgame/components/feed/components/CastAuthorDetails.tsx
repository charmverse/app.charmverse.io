import { Typography, Stack } from '@mui/material';
import { relativeTime } from '@root/lib/utils/dates';

import { Avatar } from 'components/common/Avatar';
import type { Cast } from 'lib/feed/getFarcasterUserReactions';

export function CastAuthorDetails({ cast }: { cast: Cast }) {
  return (
    <Stack gap={1}>
      <Stack
        direction='row'
        gap={{
          xs: 0.5,
          md: 1
        }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        flexDirection={{ xs: 'column', md: 'row' }}
      >
        <Stack direction='row' gap={1} alignItems='center'>
          <Avatar avatar={cast.author.pfp_url} name={cast.author.username} size='small' />
          <Typography>{cast.author.display_name}</Typography>
        </Stack>
        <Typography variant='subtitle1' color='secondary'>
          @{cast.author.username}
        </Typography>
        <Typography>{relativeTime(cast.timestamp)}</Typography>
      </Stack>
    </Stack>
  );
}

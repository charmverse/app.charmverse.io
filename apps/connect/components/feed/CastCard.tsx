import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import { Card, CardActionArea, Link, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { BsArrowRepeat } from 'react-icons/bs';

import type { FeedItem } from 'lib/feed/getFeed';

import { CastAuthorDetails } from './CastAuthorDetails';
import { CastContent } from './CastContent';

const FeedItemAction = {
  cast: 'Casted',
  like: 'Liked',
  recast: 'Recasted'
};

const FeedItemIcon = {
  cast: <BsArrowRepeat style={{ fontSize: 18 }} />,
  like: <FavoriteBorderOutlinedIcon fontSize='small' />,
  recast: <BsArrowRepeat style={{ fontSize: 18 }} />
};

export function CastCard({ item }: { item: FeedItem }) {
  const cast = item.cast;
  return (
    <Card>
      <CardActionArea sx={{ p: 2 }}>
        <Stack gap={1.5}>
          <Stack direction='row' gap={1} alignItems='center'>
            {FeedItemIcon[item.type]}
            <Typography variant='subtitle1' color='secondary'>
              {FeedItemAction[item.type]} by @charmverse
            </Typography>
          </Stack>
          <CastAuthorDetails cast={cast} />
          <CastContent cast={cast} />

          <Stack direction='row' gap={1.25} alignItems='center'>
            <Stack direction='row' gap={0.5} alignItems='center'>
              <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 18 }} />
              {cast.replies.count}
            </Stack>
            <Stack direction='row' gap={0.5} alignItems='center'>
              <BsArrowRepeat style={{ fontSize: 18 }} />
              {cast.reactions.recasts_count}
            </Stack>
            <Stack direction='row' gap={0.5} alignItems='center'>
              <FavoriteBorderOutlinedIcon fontSize='small' />
              {cast.reactions.likes_count}
            </Stack>
          </Stack>
          {cast.channel && (
            <Link target='_blank' href={`https://warpcast.com/channel/${cast.channel.id}`}>
              <Typography variant='subtitle1' color='secondary'>
                /{cast.channel.id}
              </Typography>
            </Link>
          )}
        </Stack>
      </CardActionArea>
    </Card>
  );
}

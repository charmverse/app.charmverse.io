import CallMadeIcon from '@mui/icons-material/CallMade';
import { Avatar, Box, Button, Stack, Typography } from '@mui/material';
import { isValidUrl } from '@root/lib/utils/isValidUrl';

import type { Cast } from 'lib/feed/getFarcasterUserReactions';

export function CastFrameContent({ frames }: { frames: NonNullable<Cast['frames']> }) {
  return (
    <Stack gap={1}>
      {frames.map((frame) => {
        const frameButtons = (frame.buttons ?? []).map((button, index) => ({ ...button, index }));
        const validFrameButtons = frameButtons.filter(
          ({ title, action_type: actionType }) => title && actionType !== 'mint'
        );

        return (
          <Stack gap={1} key={frame.title}>
            <img
              src={frame.image}
              style={{
                width: '100%',
                maxHeight: 450,
                objectFit: 'cover'
              }}
            />
            {validFrameButtons.length ? (
              <Stack
                flexDirection={{
                  xs: 'column',
                  md: 'row'
                }}
                flexWrap='wrap'
                gap={1}
                mb={1}
              >
                {validFrameButtons.map((button) => (
                  <Button
                    key={button.title}
                    color='secondary'
                    variant='outlined'
                    href={button.target && isValidUrl(button.target) ? button.target : ''}
                    target='_blank'
                    fullWidth
                  >
                    <Typography
                      variant='body2'
                      sx={{
                        fontWeight: 500,
                        textWrap: 'wrap'
                      }}
                    >
                      {button.title}
                    </Typography>
                    {button.action_type === 'post_redirect' ||
                    (button.action_type === 'link' && button.target && isValidUrl(button.target)) ? (
                      <CallMadeIcon sx={{ ml: 0.5, fontSize: 14 }} />
                    ) : null}
                  </Button>
                ))}
              </Stack>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
}

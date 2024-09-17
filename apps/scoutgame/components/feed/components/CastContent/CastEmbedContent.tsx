import { Typography, Card, Stack, Link, CardActionArea, Avatar } from '@mui/material';
import type { IframelyResponse } from '@root/lib/iframely/getIframely';

export function CastEmbedContent({ embeds }: { embeds: IframelyResponse[] }) {
  return (
    <Stack gap={1}>
      {embeds.map((embed) => (
        <Card sx={{ my: 1 }} key={embed.url}>
          <CardActionArea sx={{ p: 2 }} href={embed.meta.canonical} target='_blank' color='inherit'>
            <Stack
              gap={{
                xs: 1,
                md: 2
              }}
              direction={{
                xs: 'column',
                md: 'row'
              }}
              alignItems={{
                xs: 'flex-start',
                md: 'center'
              }}
            >
              <Stack direction='row' gap={1} alignItems='center' justifyContent='flex-start'>
                {embed.links.icon?.[0] ? (
                  <Avatar
                    src={embed.links.icon[0].href}
                    sx={{
                      width: {
                        xs: 35,
                        md: 100
                      },
                      height: {
                        xs: 35,
                        md: 100
                      }
                    }}
                  />
                ) : null}
                <Typography
                  variant='h6'
                  sx={{
                    display: {
                      xs: 'block',
                      md: 'none'
                    }
                  }}
                >
                  {embed.meta.title}
                </Typography>
              </Stack>
              <Stack gap={1}>
                <Typography
                  variant='h6'
                  sx={{
                    display: {
                      xs: 'none',
                      md: 'block'
                    }
                  }}
                >
                  {embed.meta.title}
                </Typography>
                <Typography variant='body1'>{embed.meta.description}</Typography>
                <Typography variant='subtitle2' color='secondary'>
                  {embed.meta.canonical}
                </Typography>
              </Stack>
            </Stack>
          </CardActionArea>
        </Card>
      ))}
    </Stack>
  );
}

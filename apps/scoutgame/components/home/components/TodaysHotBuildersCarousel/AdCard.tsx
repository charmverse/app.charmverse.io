import { Button, Stack, Link, Box, Card, CardActionArea, CardMedia, Typography } from '@mui/material';

import { nftDisplaySize } from 'components/common/Card/BuilderCard/BuilderCardNftDisplay';

export function AdCard({ src, path }: { src: string; path: string }) {
  return (
    <Card
      sx={{
        border: 'none',
        width: 'fit-content',
        height: 'fit-content',
        margin: '0 auto'
      }}
    >
      <Box
        overflow='hidden'
        width={nftDisplaySize.medium.width}
        height={nftDisplaySize.medium.height}
        sx={{ backgroundColor: 'black.dark' }}
      >
        <CardActionArea
          LinkComponent={Link}
          href={path}
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%'
          }}
        >
          <Box position='absolute'>
            <CardMedia component='img' image={src} />
          </Box>
          <Box
            sx={{
              // height: hideDetails ? 'fit-content' : '33.33%',
              position: 'absolute',
              width: 'calc(100% - 8px)',
              left: '50%',
              // backgroundColor: hideDetails ? 'transparent' : '#000',
              transform: 'translateX(-50%)',
              bottom: 3.5
            }}
          ></Box>
        </CardActionArea>
      </Box>
      <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
        <Button size='small'>Learn More</Button>
      </Stack>
    </Card>
  );
}

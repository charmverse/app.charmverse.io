import { Button, Stack, Link, Box, Card, CardActionArea, CardMedia } from '@mui/material';

import { nftDisplaySize } from 'components/common/Card/BuilderCard/BuilderCardNftDisplay';

export function PromoCard({
  src,
  path,
  size,
  'data-test': dataTest,
  onClick
}: {
  src: string;
  path: string;
  size: 'x-small' | 'small' | 'medium' | 'large';
  'data-test'?: string;
  onClick?: () => void;
}) {
  const width = nftDisplaySize[size].width;
  const height = nftDisplaySize[size].height;
  return (
    <Card
      sx={{
        border: 'none',
        width: 'fit-content',
        height: 'fit-content',
        margin: '0 auto'
      }}
      data-test={dataTest}
      onClick={onClick}
    >
      <Box overflow='hidden' width={width} height={height} sx={{ backgroundColor: 'black.dark', borderRadius: '4px' }}>
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
        <Button
          sx={{
            borderRadius: '5px'
          }}
          size='small'
          href={path}
        >
          Learn More
        </Button>
      </Stack>
    </Card>
  );
}

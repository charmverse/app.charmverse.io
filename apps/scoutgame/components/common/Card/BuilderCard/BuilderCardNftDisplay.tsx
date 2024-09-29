import PersonIcon from '@mui/icons-material/Person';
import { CardActionArea, CardMedia, Typography, Box } from '@mui/material';
import Link from 'next/link';

const nftDisplaySize = {
  small: {
    width: 150,
    height: 200
  },
  medium: {
    width: 187.5,
    height: 250
  },
  large: {
    width: 200,
    height: 266.67
  }
};

export function BuilderCardNftDisplay({
  nftImageUrl,
  children,
  username,
  showHotIcon = false,
  size = 'medium'
}: {
  username: string;
  nftImageUrl?: string | null;
  showHotIcon?: boolean;
  children?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}) {
  const width = nftDisplaySize[size].width;
  const height = nftDisplaySize[size].height;
  return (
    <Box overflow='hidden' width={width} height={height}>
      <CardActionArea
        LinkComponent={Link}
        href={`/u/${username}`}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%'
        }}
      >
        <Box position='absolute'>
          {nftImageUrl ? (
            <CardMedia component='img' image={nftImageUrl} />
          ) : (
            <PersonIcon
              sx={{
                px: 2,
                fontSize: {
                  xs: 200,
                  md: 250
                },
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                top: -20
              }}
            />
          )}
          {showHotIcon ? (
            <CardMedia
              component='img'
              image='/images/profile/icons/blue-fire-icon.svg'
              alt='hot icon'
              sx={{
                position: 'absolute',
                width: 'initial',
                height: {
                  xs: 25,
                  md: 30
                },
                top: {
                  xs: 7.5,
                  md: 10
                },
                right: {
                  xs: 10,
                  md: 15
                }
              }}
            />
          ) : null}
        </Box>
        <Box
          sx={{
            px: {
              xs: 0.5,
              md: 1
            },
            backgroundColor: '#000',
            height: 'fit-content',
            position: 'absolute',
            width: 'calc(100% - 10px)',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: {
              xs: 7.5,
              md: 10
            }
          }}
        >
          {nftImageUrl ? null : (
            <Typography gutterBottom variant='body1' textAlign='center' noWrap>
              Unavailable
            </Typography>
          )}
          {children}
        </Box>
      </CardActionArea>
    </Box>
  );
}

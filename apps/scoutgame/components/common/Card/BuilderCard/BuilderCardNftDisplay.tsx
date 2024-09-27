import PersonIcon from '@mui/icons-material/Person';
import { CardActionArea, CardMedia, CardContent, Typography, Box } from '@mui/material';
import Link from 'next/link';

export function BuilderCardNftDisplay({
  avatar,
  username,
  children,
  showHotIcon = false
}: {
  avatar?: string | null;
  username: string;
  showHotIcon?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Box borderRadius='5px' overflow='hidden'>
      <CardActionArea
        LinkComponent={Link}
        href={`/u/${username}`}
        sx={{
          bgcolor: 'black.dark',
          borderStyle: 'solid',
          borderWidth: '4px',
          borderImage: 'linear-gradient(152.64deg, #69DDFF 2.2%, #85A5EA 48.95%, #A06CD5 95.71%) 1'
        }}
      >
        <Box position='relative' minHeight={avatar ? undefined : 200}>
          {avatar ? (
            <CardMedia component='img' sx={{ aspectRatio: '1 / 1' }} image={avatar ?? ''} alt={username} />
          ) : (
            <PersonIcon
              sx={{ px: 2, fontSize: 250, position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: -20 }}
            />
          )}
          {showHotIcon ? (
            <CardMedia
              component='img'
              width='30px'
              height='30px'
              image='/images/profile/icons/blue-fire-icon.svg'
              alt='hot icon'
              sx={{ position: 'absolute', top: 10, right: 10, width: 'initial' }}
            />
          ) : null}
          <CardMedia
            component='img'
            width='40px'
            height='40px'
            image='/images/profile/icons/season1-icon.svg'
            alt='hot icon'
            sx={{ position: 'absolute', top: 5, left: 5, width: 'initial' }}
          />
        </Box>
        <CardContent sx={{ p: 1 }}>
          <Typography gutterBottom variant='body1' textAlign='center' noWrap>
            {avatar ? username : 'Unavailable'}
          </Typography>
          {children}
        </CardContent>
      </CardActionArea>
    </Box>
  );
}

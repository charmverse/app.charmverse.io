import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

const imageSrc = '/images/space_binoculars.webp';
export function NotFoundPage({ content = 'The page you are looking for does not exist!' }: { content?: string }) {
  return (
    <>
      <CssBaseline />
      <Box
        height='100%'
        width='100%'
        display='flex'
        alignItems='center'
        justifyContent='center'
        overflow='hidden'
        flexDirection='column'
        sx={{
          backgroundColor: '#2b2645'
        }}
        gap={5}
      >
        <Image src={imageSrc} width={300} height={300} alt='' />
        <Typography variant='subtitle1'>{content}</Typography>
      </Box>
    </>
  );
}

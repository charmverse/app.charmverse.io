import Box from '@mui/material/Box';
import Header from 'components/login/Header';
import SplashImage from 'components/login/SplashImage';
import Footer from 'components/login/Footer';

export default function LoginPage () {
  return (
    <Box display='flex' flexDirection='column' sx={{ backgroundColor: '#fafafa' }}>
      <Header />
      <SplashImage />
      <Footer />
    </Box>
  );
}

import Box from '@mui/material/Box';
import Header from 'components/login/Header';
import LoginPageContent from 'components/login/LoginPageContent';
import Footer from 'components/login/Footer';

export default function LoginPage () {
  return (
    <Box display='flex' flexDirection='column' sx={{ backgroundColor: '#fafafa' }}>
      <Header />
      <LoginPageContent />
      <Footer />
    </Box>
  );
}

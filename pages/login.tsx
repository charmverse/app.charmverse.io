import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import styled from '@emotion/styled';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Copyright from '../components/Copyright';
import PrimaryButton from '../components/PrimaryButton';
import Link from '@mui/material/Link';
import EmailIcon from '@mui/icons-material/MailOutline';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { blueColor, greyColor } from '../theme/colors';

const LoginButton = styled((props: any) => <PrimaryButton {...props} variant='outlined' component={Link} />)`
  cursor: pointer;
  text-align: center;
  margin-bottom: 4em;
`;

const StyledWrapper = styled(Card)`
  box-shadow: 0 12px 40px rgba(0,0,0,.12);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const LogoImage = styled.img`
  border-radius: 50%;
  height: 120px;
  width: auto;
`;

export default function Login () {
  const { user } = useUser();
  const router = useRouter();
  const errorCode = router.query.code;
  const errorMessage = router.query.error;
  useEffect(() => {
    // redirect to home if already logged in
    if (user) {
      router.push('/');
    }
  }, []);

  return (
    <Container component='main' maxWidth='xs'>
      <StyledWrapper sx={{ mt: 12, mb: 6, py: 2 }}>
        <Box mb={4} mt={5} mx='auto' display='flex' justifyContent='center'>
          <LogoImage src={'/images/logo_black_lightgrey.png'} />
        </Box>
        <Typography sx={{ fontSize: 32 }}>
          Token Gate
        </Typography>
        <Typography sx={{ fontSize: 12, mb: 4 }}>
          Powered by <Link href='https://charmverse.io' target='_blank'>CharmVerse</Link>
        </Typography>
        <LoginButton external href='/api/auth/login?type=email'>
          Sign in
        </LoginButton>
        <Typography variant='caption' style={{ textAlign: 'center', margin: '8px 0', width: '100%' }}>
          Don't have an account? <Link sx={{ color: blueColor, textDecoration: 'none' }} href='/api/auth/signup'>Sign up</Link>
        </Typography>
        {(errorCode === 'account_not_found')
          ? <Box mt={2} textAlign='center'><Typography color='error'>
              Sorry, we couldn't find your profile.<br />
              <Link href='/api/auth/signup'>Sign up</Link> to create a new account.
            </Typography></Box>
          : (errorMessage && (
            <Box mt={2} textAlign='center'>
              <Typography color='error'>
                {errorMessage}
              </Typography>
            </Box>
          ))}
      </StyledWrapper>
    </Container>
  );
}

import { useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Header from 'components/login/Header';
import LoginPageContent from 'components/login/LoginPageContent';
import Footer from 'components/login/Footer';

export default function LoginPage () {

  const { account } = useWeb3React();
  const router = useRouter();
  useEffect(() => {
    if (account && typeof router.query.returnUrl === 'string') {
      router.replace('/login', undefined, { shallow: true });
      router.push(router.query.returnUrl);
    }
  }, [account]);

  return (
    <Box display='flex' flexDirection='column' sx={{ backgroundColor: '#fafafa' }}>
      <Header />
      <LoginPageContent account={account} />
      <Footer />
    </Box>
  );
}

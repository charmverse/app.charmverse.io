import { useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { useRouter } from 'next/router';
import getBaseLayout from 'components/common/base-layout/getLayout';
import LoginPageContent from 'components/login/LoginPageContent';
import { usePageTitle } from 'hooks/usePageTitle';
import Footer from 'components/login/Footer';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';

export default function LoginPage () {

  const { account } = useWeb3React();
  const router = useRouter();
  const [, setTitleState] = usePageTitle();
  const [user, setUser, isUserLoaded] = useUser();
  const [spaces, setSpaces, isSpacesLoaded] = useSpaces();

  useEffect(() => {
    setTitleState('Login');
  }, []);

  // redirect user once wallet is connected
  useEffect(() => {
    if (account) {
      if (typeof router.query.returnUrl === 'string') {
        router.push(router.query.returnUrl);
      }
      else if (isSpacesLoaded && isUserLoaded) {
        console.log('spaces loaded', spaces);
        if (spaces.length > 0) {
          router.push(`/${spaces[0]!.domain}`);
        }
        else {
          router.push('/signup');
        }
      }
    }
  }, [account, isSpacesLoaded, isUserLoaded]);

  return (
    <>
      <LoginPageContent account={account} />
      <Footer />
    </>
  );
}

LoginPage.getLayout = getBaseLayout;

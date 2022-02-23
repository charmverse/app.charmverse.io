import { useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { useRouter } from 'next/router';
import getBaseLayout from 'components/common/base-layout/getLayout';
import LoginPageContent from 'components/login/LoginPageContent';
import Footer from 'components/login/Footer';

export default function LoginPage () {

  const { account } = useWeb3React();
  const router = useRouter();

  useEffect(() => {
    if (account && typeof router.query.returnUrl === 'string') {
      router.push(router.query.returnUrl);
    }
  }, [account]);

  return (
    <>
      <LoginPageContent account={account} />
      <Footer />
    </>
  );
}

LoginPage.getLayout = getBaseLayout;

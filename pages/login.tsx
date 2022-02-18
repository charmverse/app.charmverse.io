import { useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { useRouter } from 'next/router';
import Header from 'components/common/base-layout/Header';
import PageWrapper from 'components/common/base-layout/PageWrapper';
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
    <PageWrapper>
      <Header />
      <LoginPageContent account={account} />
      <Footer />
    </PageWrapper>
  );
}

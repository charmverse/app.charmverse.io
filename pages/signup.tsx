import PageWrapper from 'components/common/base-layout/PageWrapper';
import Header from 'components/common/base-layout/Header';
import SignupPageContent from 'components/signup/SignupPageContent';
import Footer from 'components/login/Footer';

export default function LoginPage () {

  return (
    <PageWrapper>
      <Header />
      <SignupPageContent />
      <Footer />
    </PageWrapper>
  );
}

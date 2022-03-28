import getBaseLayout from 'components/common/BaseLayout/BaseLayout';
import SignupForm from 'components/signup/SignupForm';

export default function LoginPage () {
  return (
    <SignupForm />
  );
}

LoginPage.getLayout = getBaseLayout;

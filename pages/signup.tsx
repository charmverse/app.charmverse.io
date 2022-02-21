import getBaseLayout from 'components/common/base-layout/getLayout';
import SignupForm from 'components/signup/SignupForm';

export default function LoginPage () {
  return (
    <SignupForm />
  );
}

LoginPage.getLayout = getBaseLayout;

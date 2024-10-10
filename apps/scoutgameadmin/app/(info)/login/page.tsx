import type { Metadata } from 'next';

import { LoginPage as LoginPageComponent } from 'components/login/LoginPage';

export const metadata: Metadata = {
  title: 'Login to Scout Game Admin'
};

export default async function LoginPage() {
  return <LoginPageComponent />;
}

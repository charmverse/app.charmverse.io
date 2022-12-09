import { useRouter } from 'next/router';
import { useEffect } from 'react';

import getBaseLayout from 'components/common/BaseLayout/BaseLayout';
import SignupForm from 'components/signup/SignupForm';
import { useSpaces } from 'hooks/useSpaces';

import { getDefaultWorkspaceUrl } from './index';

export default function LoginPage() {
  const { spaces, isLoaded } = useSpaces();
  const router = useRouter();

  useEffect(() => {
    if (spaces.length > 0) {
      router.push(getDefaultWorkspaceUrl(spaces));
    }
  }, [spaces]);

  if (!spaces || !isLoaded) {
    return null;
  }

  return <SignupForm />;
}

LoginPage.getLayout = getBaseLayout;

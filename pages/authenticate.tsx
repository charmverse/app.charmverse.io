import Box from '@mui/material/Box';
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import { CollectEmailDialog } from 'components/login/CollectEmail';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';

export default function Authenticate() {
  const [error, setError] = useState(null);
  const emailDialog = usePopupState({ variant: 'popover', popupId: 'email-magic-link' });
  const [isLoading, setIsLoading] = useState(true);
  const { validateMagicLink } = useFirebaseAuth();

  const router = useRouter();

  async function handleEmailAuth() {
    setIsLoading(true);

    try {
      await validateMagicLink();
    } catch (err) {
      setError(err as any);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const { strategy } = router.query;
    if (strategy === 'email') {
      handleEmailAuth();
    }
  }, [router.query.strategy]);

  if (error) {
    return <ErrorPage message='Login failed' />;
  }

  return (
    <Box>
      {isLoading && <LoadingComponent />}
      {/** <CollectEmailDialog isOpen={emailDialog.isOpen} onClose={emailDialog.close} handleSubmit={handleEmailAuth} /> */}
    </Box>
  );

  //  return;
}

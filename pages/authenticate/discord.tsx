import Box from '@mui/material/Box';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import getLayout from 'components/common/BaseLayout/BaseLayout';
import ErrorPage from 'components/common/errors/ErrorPage';
import Link from 'components/common/Link';
import { LoginPageContent } from 'components/login';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { useSnackbar } from 'hooks/useSnackbar';
import type { SystemError } from 'lib/utilities/errors';

export default function Oauth() {
  const [error, setError] = useState<SystemError | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const { validateMagicLink, emailForSignIn, setEmailForSignIn } = useFirebaseAuth();
  const { showMessage } = useSnackbar();
  const router = useRouter();
  const emailPopup = usePopupState({ variant: 'popover', popupId: 'emailPopup' });

  // Case where existing user is adding an email to their account
  const isConnectingAccount = router.query.connectToExistingAccount === 'true';
  const code = router.query.code;

  // useEffect(() => {
  //   if (isUserLoaded && emailForSignIn && isValidEmail(emailForSignIn)) {
  //     setIsAuthenticating(true);
  //     validateMagicLink()
  //       .then(() => {
  //         showMessage('Logged in with email. Redirecting you now', 'success');
  //         const redirectPath = typeof router.query.redirectUrl === 'string' ? router.query.redirectUrl : '/';
  //         router.push(redirectPath);
  //       })
  //       .catch((err) => {
  //         setIsAuthenticating(false);
  //         setError(err as any);
  //       });
  //   } else if (isUserLoaded && !isAuthenticating) {
  //     emailPopup.open();
  //   }
  // }, [isUserLoaded, emailForSignIn]);

  if (error) {
    return (
      <ErrorPage message={isConnectingAccount ? 'Failed to connect email to your account' : 'Login failed'}>
        <Box sx={{ mt: 3 }}>
          <Link href='/'>
            {isConnectingAccount
              ? 'Request new magic link from your profile settings'
              : 'Request magic link from login page'}
          </Link>
        </Box>
      </ErrorPage>
    );
  }

  return getLayout(
    <Box height='100%' display='flex' flexDirection='column'>
      <LoginPageContent hideLoginOptions isLoggingIn={isAuthenticating} />
    </Box>
  );
}

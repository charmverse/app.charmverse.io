import { log } from '@charmverse/core/log';
import type { IdentityType } from '@charmverse/core/prisma';
import { styled } from '@mui/material';
import EmailIcon from '@mui/icons-material/EmailOutlined';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import type { SignatureVerificationPayload } from '@packages/lib/blockchain/signAndVerify';
import type { LoggedInUser } from '@packages/profile/getUser';
import type { SystemError } from '@packages/utils/errors';
import { usePopupState } from 'material-ui-popup-state/hooks';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import type { SyntheticEvent } from 'react';
import { useRef, useState } from 'react';

import { WalletSelector } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal';
import { ConnectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/components/ConnectorButton';
import { Button } from 'components/common/Button';
import { useCustomDomain } from 'hooks/useCustomDomain';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { useGoogleLogin } from 'hooks/useGoogleLogin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3Account } from 'hooks/useWeb3Account';

import { DiscordLoginHandler } from './DiscordLoginHandler';
import { EmailAddressForm } from './EmailAddressForm';
import { LoginErrorModal } from './LoginErrorModal';
import { WalletSign } from './WalletSign';

export type AnyIdLogin<I extends IdentityType = IdentityType> = {
  identityType: I;
  user: LoggedInUser;
  displayName: string;
};

export interface DialogProps {
  isOpen: boolean;
  redirectUrl?: string;
  onClose: () => void;
  emailOnly?: boolean;
}

const StyledButton = styled(Button)`
  width: 100%;
  max-width: 100%;
  ${({ theme }) => theme.breakpoints.up('sm')} {
    width: 200px;
  }
  ${({ theme }) => theme.breakpoints.up('md')} {
    width: auto;
    padding: ${({ theme }) => theme.spacing(1, 8)};
  }
`;

type Props = {
  redirectUrl?: string;
  showSignup?: boolean;
  signInLabel?: string;
  emailOnly?: boolean;
};

const WarpcastLogin = dynamic(() => import('./WarpcastLogin').then((module) => module.WarpcastLogin), {
  ssr: false
});

export function LoginButton({ redirectUrl, signInLabel = 'Sign in', showSignup, emailOnly }: Props) {
  const loginDialog = usePopupState({ variant: 'popover', popupId: 'login-dialog' });
  const { resetSigning } = useWeb3Account();

  const handleClickOpen = (eventOrAnchorEl?: Element | SyntheticEvent<Element, Event> | null | undefined) => {
    loginDialog.open(eventOrAnchorEl);
  };

  const handleClose = () => {
    loginDialog.close();
    resetSigning();
  };

  return (
    <Box
      display='flex'
      gap={2}
      flexDirection={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'center', md: 'flex-start' }}
      justifyContent={{ xs: 'center', md: 'flex-start' }}
      py={{ xs: 2, md: 0 }}
    >
      {showSignup && (
        <StyledButton
          size='large'
          onClick={handleClickOpen}
          data-test='universal-connect-button'
          color='primary'
          disableElevation={false}
        >
          Sign up
        </StyledButton>
      )}
      <StyledButton
        color={!showSignup ? 'primary' : 'secondary'}
        size='large'
        onClick={handleClickOpen}
        variant={showSignup ? 'outlined' : undefined}
        data-test='signin-button'
      >
        {signInLabel}
      </StyledButton>
      <LoginHandler emailOnly={emailOnly} redirectUrl={redirectUrl} isOpen={loginDialog.isOpen} onClose={handleClose} />
    </Box>
  );
}

function LoginHandler(props: DialogProps) {
  const { redirectUrl, onClose, isOpen } = props;
  const { loginFromWeb3Account, verifiableWalletDetected } = useWeb3Account();
  // Governs whether we should auto-request a signature. Should only happen on first login.
  const [enableAutosign, setEnableAutoSign] = useState(true);
  const router = useRouter();
  const returnUrl = typeof router.query.returnUrl === 'string' ? router.query.returnUrl : undefined;
  const [loginMethod, setLoginMethod] = useState<'email' | null>(null);
  const { isOnCustomDomain } = useCustomDomain();

  const [showLoginError, setShowLoginError] = useState(false);

  const { showMessage } = useSnackbar();

  const sendingMagicLink = useRef(false);

  const { requestMagicLinkViaFirebase } = useFirebaseAuth();
  const { loginWithGooglePopup } = useGoogleLogin();

  async function handleLogin(loggedInUser: { identityType?: string }) {
    showMessage(`Logged in with ${loggedInUser?.identityType}. Redirecting you now`, 'success');
    window.location.reload();
  }

  async function handleGoogleLogin() {
    const onSuccess = () => handleLogin({ identityType: 'Google' });
    return loginWithGooglePopup({ onSuccess });
  }

  async function handleMagicLinkRequest(email: string) {
    if (sendingMagicLink.current === false) {
      sendingMagicLink.current = true;
      try {
        await requestMagicLinkViaFirebase({ email, redirectUrl });
        showMessage(`Magic link sent. Please check your inbox for ${email}`, 'success');
        onClose();
        setLoginMethod(null);
      } catch (err) {
        handleLoginError(err);
      } finally {
        sendingMagicLink.current = false;
      }
    }
  }

  async function handleWeb3Login(payload: SignatureVerificationPayload) {
    try {
      const resp = await loginFromWeb3Account(payload);
      if (resp?.id) {
        handleLogin({ identityType: 'Wallet' });
      }
    } catch (err) {
      handleLoginError(err);
    }
  }

  function handleLoginError(err: any) {
    if ((err as SystemError)?.errorType === 'Disabled account') {
      setShowLoginError(true);
    }
    log.error(`Error on login.`, { error: err });
  }

  function toggleEmailDialog(position: 'open' | 'close') {
    if (position === 'open') {
      setLoginMethod('email');
    } else {
      setLoginMethod(null);
    }
  }

  function close() {
    if (loginMethod) {
      setLoginMethod(null);
    } else {
      onClose();
    }
  }

  return (
    <>
      <Dialog open={isOpen} onClose={close}>
        <List sx={{ pt: 0, maxWidth: '400px' }}>
          {!loginMethod && !props.emailOnly && (
            <>
              <DialogTitle textAlign='left'>Connect Wallet</DialogTitle>

              {/** Web 3 login methods */}
              <ListItem>
                <WalletSelector />
              </ListItem>
              {verifiableWalletDetected && (
                <ListItem>
                  <WalletSign
                    buttonStyle={{ width: '100%' }}
                    signSuccess={handleWeb3Login}
                    enableAutosign={enableAutosign}
                    onError={() => setEnableAutoSign(false)}
                  />
                </ListItem>
              )}
            </>
          )}
          {!loginMethod && (
            <DialogTitle sx={{ mt: -1 }} textAlign='left'>
              Connect Account
            </DialogTitle>
          )}
          {!loginMethod && !props.emailOnly && <DiscordLoginHandler redirectUrl={returnUrl ?? redirectUrl ?? '/'} />}
          {!loginMethod && !props.emailOnly && (
            <ListItem>
              <WarpcastLogin type='login' />
            </ListItem>
          )}

          {/* Google login method */}
          {!loginMethod && (
            <ListItem>
              <ConnectorButton
                onClick={handleGoogleLogin}
                name='Connect with Google'
                iconUrl='Google_G.png'
                disabled={false}
                isActive={false}
                isLoading={false}
              />
            </ListItem>
          )}
          {!isOnCustomDomain && !loginMethod && (
            <>
              {/** Connect with email address */}
              <ListItem>
                <ConnectorButton
                  onClick={() => toggleEmailDialog('open')}
                  name='Connect with email'
                  icon={<EmailIcon />}
                  disabled={false}
                  isActive={false}
                  isLoading={false}
                />
              </ListItem>
            </>
          )}
        </List>

        {loginMethod === 'email' && (
          <Box m={2}>
            <EmailAddressForm
              loading={sendingMagicLink.current === true}
              title='Connect with email'
              description="Enter your email address and we'll email you a login link"
              handleSubmit={handleMagicLinkRequest}
              onClose={close}
            />
          </Box>
        )}
      </Dialog>
      <LoginErrorModal open={showLoginError} onClose={() => setShowLoginError(false)} />
    </>
  );
}

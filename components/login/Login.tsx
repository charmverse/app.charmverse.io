import EmailIcon from '@mui/icons-material/Email';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import SvgIcon from '@mui/material/SvgIcon';
import type { IdentityType } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useRef, useState } from 'react';

import { WalletSelector } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal';
import { ConnectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/components/ConnectorButton';
import Button from 'components/common/Button';
import Link from 'components/common/Link';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSig } from 'lib/blockchain/interfaces';
import type { SystemError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models/User';
import DiscordIcon from 'public/images/discord_logo.svg';

import { CollectEmail } from './CollectEmail';
import { LoginErrorModal } from './LoginErrorModal';
import { WalletSign } from './WalletSign';

export type AnyIdLogin<I extends IdentityType = IdentityType> = {
  identityType: I;
  user: LoggedInUser;
  displayName: string;
};

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function LoginHandler(props: DialogProps) {
  const { onClose, isOpen } = props;
  const { loginFromWeb3Account } = useWeb3AuthSig();
  // Governs whether we should auto-request a signature. Should only happen on first login.
  const [enableAutosign, setEnableAutoSign] = useState(true);
  const returnUrl = new URLSearchParams(decodeURIComponent(window.location.search)).get('returnUrl');
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<'email' | null>(null);

  const [showLoginError, setShowLoginError] = useState(false);

  const { showMessage } = useSnackbar();

  const sendingMagicLink = useRef(false);

  const { loginWithGoogle, requestMagicLinkViaFirebase } = useFirebaseAuth();
  const { verifiableWalletDetected } = useWeb3AuthSig();
  async function handleLogin(loggedInUser: AnyIdLogin) {
    showMessage(`Logged in with ${loggedInUser?.identityType}. Redirecting you now`, 'success');
    window.location.reload();
  }

  async function handleGoogleLogin() {
    try {
      const googleLoginResult = await loginWithGoogle();
      handleLogin(googleLoginResult);
    } catch (err) {
      handleLoginError(err);
    }
  }

  async function handleMagicLinkRequest(email: string) {
    if (sendingMagicLink.current === false) {
      sendingMagicLink.current = true;
      // console.log('Handling magic link request');
      try {
        await requestMagicLinkViaFirebase({ email });
        onClose();
        setLoginMethod(null);
      } catch (err) {
        handleLoginError(err);
      } finally {
        sendingMagicLink.current = false;
      }
    }
  }

  async function handleWeb3Login(authSig: AuthSig) {
    try {
      const user = await loginFromWeb3Account(authSig);
      handleLogin({
        identityType: 'Wallet',
        displayName: authSig.address,
        user
      });
    } catch (err) {
      handleLoginError(err);
    }
  }

  function handleLoginError(err: any) {
    if ((err as SystemError)?.errorType === 'Disabled account') {
      setShowLoginError(true);
    }
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
        {!loginMethod && (
          <List sx={{ pt: 0, maxWidth: '400px' }}>
            <DialogTitle textAlign='left'>Connect Wallet</DialogTitle>

            {/** Web 3 login methods */}
            <ListItem>
              <WalletSelector loginSuccess={handleLogin} onError={handleLoginError} />
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

            <DialogTitle sx={{ mt: -1 }} textAlign='left'>
              Connect Account
            </DialogTitle>

            <Link data-test='connect-discord' href={`/api/discord/oauth?type=login&redirect=${returnUrl ?? '/'}`}>
              <ListItem>
                <ConnectorButton
                  onClick={() => {}}
                  name='Connect with Discord'
                  disabled={false}
                  isActive={false}
                  isLoading={false}
                  icon={
                    <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#5865F2' }}>
                      <DiscordIcon />
                    </SvgIcon>
                  }
                />
              </ListItem>
            </Link>

            {/* Google login method */}
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
          </List>
        )}
        {loginMethod === 'email' && (
          <Box m={2}>
            <CollectEmail
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

export function Login() {
  const loginDialog = usePopupState({ variant: 'popover', popupId: 'login-dialog' });
  const { resetSigning } = useWeb3AuthSig();

  const handleClickOpen = () => {
    loginDialog.open();
  };

  const handleClose = () => {
    loginDialog.close();
    resetSigning();
  };

  return (
    <div>
      <Button
        sx={{ width: '100%' }}
        onClick={handleClickOpen}
        data-test='universal-connect-button'
        size='large'
        primary
      >
        Connect
      </Button>
      <LoginHandler isOpen={loginDialog.isOpen} onClose={handleClose} />
    </div>
  );
}

import EmailIcon from '@mui/icons-material/Email';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import type { IdentityType } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRef, useState } from 'react';

import { WalletSelector } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal';
import { ConnectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/components/ConnectorButton';
import Button from 'components/common/Button';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSig } from 'lib/blockchain/interfaces';
import type { SystemError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models/User';

import { CollectEmailDialog } from './CollectEmail';
import { LoginErrorModal } from './LoginErrorModal';
import { WalletSign } from './WalletSign';

export type AnyIdLogin<I extends IdentityType = IdentityType> = {
  identityType: I;
  user: LoggedInUser;
  displayName: string;
};

export interface DialogProps {
  open: boolean;
  selectedValue: string;
  onClose: (value: string) => void;
}

function LoginHandler(props: DialogProps) {
  const { onClose, selectedValue, open } = props;
  const { loginFromWeb3Account } = useWeb3AuthSig();

  const [showLoginError, setShowLoginError] = useState(false);

  const { showMessage } = useSnackbar();

  const sendingMagicLink = useRef(false);

  const magicLinkPopup = usePopupState({ variant: 'popover', popupId: 'email-magic-link' });

  const { loginWithGoogle, requestMagicLinkViaFirebase } = useFirebaseAuth();
  const { verifiableWalletDetected } = useWeb3AuthSig();
  async function handleLogin(loggedInUser: AnyIdLogin) {
    showMessage(`Logged in with ${loggedInUser?.identityType}. Redirecting you now`, 'success');
    window.location.reload();
  }

  const handleClose = () => {
    onClose(selectedValue);
  };

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
        showMessage(`Magic link sent. Please check your inbox for ${email}`, 'success');
        magicLinkPopup.close();
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

  return (
    <Dialog onClose={handleClose} open={open}>
      <List sx={{ pt: 0, maxWidth: '400px' }}>
        <DialogTitle textAlign='left'>Connect Wallet</DialogTitle>

        {/** Web 3 login methods */}
        <ListItem>
          <WalletSelector loginSuccess={handleLogin} onError={handleLoginError} />
        </ListItem>
        {verifiableWalletDetected && (
          <ListItem>
            <WalletSign buttonStyle={{ width: '100%' }} signSuccess={handleWeb3Login} enableAutosign />
          </ListItem>
        )}

        <DialogTitle sx={{ mt: -1 }} textAlign='left'>
          Connect Account
        </DialogTitle>

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
            onClick={magicLinkPopup.open}
            name='Connect with email'
            icon={<EmailIcon />}
            disabled={false}
            isActive={false}
            isLoading={false}
          />
        </ListItem>
      </List>
      <LoginErrorModal open={showLoginError} onClose={() => setShowLoginError(false)} />
      <CollectEmailDialog
        onClose={magicLinkPopup.close}
        isOpen={magicLinkPopup.isOpen}
        handleSubmit={handleMagicLinkRequest}
      />
    </Dialog>
  );
}

export function Login() {
  const [open, setOpen] = useState(false);
  const { resetSigning } = useWeb3AuthSig();

  const [selectedValue, setSelectedValue] = useState('');

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = (value: string) => {
    setOpen(false);
    setSelectedValue(value);
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
      <LoginHandler selectedValue={selectedValue} open={open} onClose={handleClose} />
    </div>
  );
}

import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { SiweMessage } from 'siwe';
import { useSignMessage } from 'wagmi';

import { useWallet } from 'hooks/useWallet'; // Import the custom wallet hook
import { loginAction } from 'lib/session/loginWithWalletAction';

import { WalletConnect } from './WalletConnect'; // Import the generic wallet connect component

export function WalletLoginWrapper() {
  const router = useRouter();
  const { signMessageAsync, error: signMessageError } = useSignMessage();
  const { executeAsync } = useAction(loginAction);
  const { address, chainId } = useWallet(); // Hook to access the connected wallet details

  const handleLoginSuccess = async () => {
    if (!address) {
      return;
    }

    const preparedMessage = {
      domain: window.location.host,
      address,
      uri: window.location.origin,
      version: '1',
      chainId
    };

    const siweMessage = new SiweMessage(preparedMessage);
    const message = siweMessage.prepareMessage();

    try {
      const signature = await signMessageAsync({ message });
      await executeAsync({ message, signature });
      router.push('/');
    } catch (error) {
      // handle sign error or login error
    }
  };

  return (
    <>
      <WalletConnect onSuccess={handleLoginSuccess} />
      {signMessageError && (
        <Typography variant='body2' color='error'>
          {signMessageError.message || 'There was an error while signing the message.'}
        </Typography>
      )}
    </>
  );
}

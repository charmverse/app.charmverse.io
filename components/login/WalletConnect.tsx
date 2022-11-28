import styled from '@emotion/styled';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSig } from 'lib/blockchain/interfaces';

import { WalletSign } from './WalletSign';

// Copied from components/integrations/components/IdentityProviders.tsx
const StyledButton = styled(Button)`
  width: 140px;
`;

/**
 * We don't expose an onError method. The calling component should consider onClose as a failure to complete the process
 */
type Props = {
  onSuccess: () => void;
};

/**
 * Used to add a wallet to an account
 */
export function WalletConnect({ onSuccess }: Props) {
  const { account, connectWallet } = useWeb3AuthSig();
  const { updateUser } = useUser();

  async function signSuccess(signature: AuthSig) {
    const updatedUser = await charmClient.addUserWallets([signature]);

    updateUser(updatedUser);
    onSuccess();
  }

  if (!account) {
    return (
      <WalletSign
        buttonOutlined
        signSuccess={signSuccess}
        ButtonComponent={StyledButton as any}
        buttonSize='medium'
        enableAutosign={false}
      />
    );
  }

  return (
    <StyledButton onClick={connectWallet} variant='outlined' color='primary'>
      Switch
    </StyledButton>
  );
}

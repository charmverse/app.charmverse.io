import styled from '@emotion/styled';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSigWithRawAddress } from 'lib/blockchain/interfaces';

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
}

/**
 * Used to add a wallet to an account
 */
export function WalletConnect ({ onSuccess }: Props) {

  const { account } = useWeb3AuthSig();
  const { updateUser } = useUser();

  async function signSuccess (signature: AuthSigWithRawAddress) {
    const updatedUser = await charmClient.updateUser({
      addressesToAdd: [signature]
    });

    updateUser(updatedUser);
    onSuccess();
  }

  if (!account) {
    return (
      <WalletSign
        buttonStyle={StyledButton.__emotion_styles}
        signSuccess={signSuccess}
        ButtonComponent={StyledButton as any}
      />
    );
  }

  return <StyledButton disabled color='secondary'>Connected</StyledButton>;
}


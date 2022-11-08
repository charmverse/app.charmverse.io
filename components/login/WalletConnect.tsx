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
 * This signature modal must pass, or the user will be unable to continue in logged in state
 *
 * If closed without success, triggers a disconnect
 * @returns
 */
export function WalletConnect ({ onSuccess }: Props) {

  const { account, walletSignerModal } = useWeb3AuthSig();
  const { updateUser } = useUser();

  async function signSuccess (signature: AuthSigWithRawAddress) {
    const updatedUser = await charmClient.updateUser({
      addressesToAdd: [signature]
    });

    updateUser(updatedUser);
    walletSignerModal.close();
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


import { Box } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';

import { useSearchByDomain } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { SpaceAccessGate } from 'components/common/SpaceAccessGate/SpaceAccessGate';
import { WalletSign } from 'components/login/components/WalletSign';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';

interface Props {
  pagePath: string;
}

export function RewardSignupButton({ pagePath }: Props) {
  const { account, loginFromWeb3Account } = useWeb3Account();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { space } = useCurrentSpace();
  const { data: spaceFromPath } = useSearchByDomain(space?.domain);
  const loginViaTokenGateModal = usePopupState({ variant: 'popover', popupId: 'login-via-token-gate' });

  const { isSpaceMember } = useIsSpaceMember();
  const showSignup = isUserLoaded && (!user || !isSpaceMember);

  return (
    <>
      <Box display='flex' justifyContent='center' sx={{ my: 2 }} data-test='public-bounty-space-action'>
        {showSignup && (
          <Button color='primary' onClick={loginViaTokenGateModal.open}>
            Join this space to apply
          </Button>
        )}
      </Box>

      <Modal
        size='large'
        open={loginViaTokenGateModal.isOpen}
        onClose={loginViaTokenGateModal.close}
        title={`Join the ${space?.name} space to apply`}
      >
        {!account ? (
          <Box display='flex' justifyContent='center' sx={{ mt: 3 }}>
            <WalletSign signSuccess={loginFromWeb3Account} />
          </Box>
        ) : (
          spaceFromPath && (
            <SpaceAccessGate
              onSuccess={() => {
                window.location.href = `${window.location.origin}/${space?.domain}/${pagePath}`;
              }}
              space={spaceFromPath}
              joinType='public_bounty_token_gate'
            />
          )
        )}
      </Modal>
    </>
  );
}

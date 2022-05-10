
import ButtonGroup from '@mui/material/ButtonGroup';
import { alpha } from '@mui/system';
import Tooltip from '@mui/material/Tooltip';
import Button from 'components/common/Button';
import SvgIcon from '@mui/material/SvgIcon';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { Avatar } from 'components/common/Avatar';
import { useUser } from 'hooks/useUser';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { Chains, RPC } from 'connectors';
import { useContext } from 'react';
import { getDisplayName } from 'lib/users';
import useENSName from 'hooks/useENSName';
import AccountModal from 'components/common/PageLayout/components/Account/components/AccountModal';
import NetworkModal from 'components/common/PageLayout/components/Account/components/NetworkModal';
import styled from '@emotion/styled';

const AccountCard = styled.div`
  display: inline-flex;
`;

const NetworkButton = styled(Button)`
  padding-left: 0;
  padding-right: 0;
`;

const AccountButton = styled(Button)`
  display: flex;
  align-items: center;
`;

const StyledButtonGroup = styled(ButtonGroup)`
  button {
    background-color: ${({ theme }) => theme.palette.action.selected};
    color: ${({ theme }) => theme.palette.text.primary};
    &:hover {
      background-color: ${({ theme }) => alpha(theme.palette.action.selected, theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity)};
    }
    border-radius: 10px;
    border-width: 0;
    &:not(:last-of-type) {
      border-right: 0 none !important;
      margin-right: 1px;
    }
  }
`;

function Account (): JSX.Element {
  const { error, account, chainId } = useWeb3React();
  const { openWalletSelectorModal, triedEager, openNetworkModal } = useContext(Web3Connection);
  const ENSName = useENSName(account);

  const accountModalState = usePopupState({ variant: 'popover', popupId: 'account-modal' });
  const networkModalState = usePopupState({ variant: 'popover', popupId: 'network-modal' });
  const [user, setUser] = useUser();

  if (typeof window === 'undefined') {
    return (
      <AccountCard>
        <AccountButton isLoading>Connect to a wallet</AccountButton>
      </AccountCard>
    );
  }

  if (error instanceof UnsupportedChainIdError) {
    return (
      <AccountCard>
        <AccountButton
          // leftIcon={<LinkBreak />}
          colorScheme='red'
          onClick={openNetworkModal}
        >
          Wrong Network
        </AccountButton>
      </AccountCard>
    );
  }

  const isConnectedWithWallet = (account && chainId);

  const userName = ENSName || (user ? getDisplayName(user) : '');

  return (
    <AccountCard>
      <StyledButtonGroup variant='contained' disableElevation>
        {isConnectedWithWallet && (
        <Tooltip title={RPC[Chains[chainId]].chainName} arrow>
          <NetworkButton onClick={networkModalState.open}>
            <SvgIcon component='object' sx={{ display: 'flex', justifyContent: 'center' }}>
              <img alt='' src={RPC[Chains[chainId]].iconUrls[0]} style={{ height: '100%' }} />
            </SvgIcon>
          </NetworkButton>
        </Tooltip>
        )}
        <AccountButton
          onClick={accountModalState.open}
          endIcon={<Avatar avatar={user?.avatar} name={userName} size='small' />}
        >
          {userName}
        </AccountButton>
      </StyledButtonGroup>
      <AccountModal
        isOpen={accountModalState.isOpen}
        onClose={accountModalState.close}
      />
      <NetworkModal isOpen={networkModalState.isOpen} onClose={networkModalState.close} />
    </AccountCard>
  );
}

export default Account;

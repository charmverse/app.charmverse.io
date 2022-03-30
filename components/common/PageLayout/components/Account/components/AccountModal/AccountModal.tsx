
import { useWeb3React } from '@web3-react/core';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from 'components/common/Button';
import CopyableAddress from 'components/common/CopyableAddress';
import Avatar from 'components/common/Avatar';
import { Modal, DialogTitle } from 'components/common/Modal';
import { injected, walletConnect, walletLink } from 'connectors';
import { useContext, useState } from 'react';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import useENSName from 'hooks/useENSName';
import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import styled from '@emotion/styled';
import { CircularProgress, Tooltip } from '@mui/material';
import { useRouter } from 'next/router';
// import AccountConnections from './components/AccountConnections';

const DiscordUserName = styled(Typography)`
  position: relative;
  top: 4px;
`;

const StyledButton = styled(Button)`
  width: 100px;
`;

function AccountModal ({ isConnectDiscordLoading, isOpen, onClose }:
  { isConnectDiscordLoading: boolean, isOpen: boolean, onClose: () => void }) {
  const { account, connector } = useWeb3React();
  const { openWalletSelectorModal } = useContext(Web3Connection);
  const ENSName = useENSName(account);
  const [user, setUser] = useUser();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isLoginOut, setIsLoginOut] = useState(false);

  const handleWalletProviderSwitch = () => {
    openWalletSelectorModal();
    onClose();
  };

  const router = useRouter();

  const connectorName = (c: any) => {
    switch (c) {
      case injected:
        return 'MetaMask';
      case walletConnect:
        return 'WalletConnect';
      case walletLink:
        return 'Coinbase Wallet';
      default:
        return '';
    }
  };

  const connectedWithDiscord = Boolean(user?.discordUser);

  async function connectWithDiscord () {
    if (!isConnectDiscordLoading) {
      if (connectedWithDiscord) {
        setIsDisconnecting(true);
        try {
          await charmClient.disconnectDiscord();
          setUser({ ...user, discordUser: null });
        }
        catch (err) {
          console.log('Error disconnecting from discord');
        }
        setIsDisconnecting(false);
      }
      else {
        window.location.replace(`/api/discord/oauth?redirect=${encodeURIComponent(window.location.href.split('?')[0])}&type=connect`);
      }
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose}>
      <DialogTitle onClose={onClose}>Account</DialogTitle>
      {user && user?.addresses.length !== 0 && (
        <Stack mb={2} direction='row' spacing='4' alignItems='center'>
          <Avatar name={ENSName || user.username || user.addresses[0]} avatar={user.avatar} />
          <CopyableAddress address={user.addresses[0]} decimals={5} sx={{ fontSize: 24 }} />
          {connectedWithDiscord && <DiscordUserName variant='subtitle2'>{user.username}</DiscordUserName>}
        </Stack>
      )}
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        my={1}
      >
        <Typography color='secondary'>
          {account ? `Connected with ${connectorName(connector)}` : 'Connect with Metamask'}
        </Typography>
        <StyledButton size='small' variant='outlined' onClick={handleWalletProviderSwitch}>
          {account ? 'Switch' : 'Connect'}
        </StyledButton>
      </Stack>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        mb={3}
      >
        <Typography color='secondary'>
          {connectedWithDiscord ? 'Connected with Discord' : 'Connect with Discord'}
        </Typography>
        <Tooltip arrow placement='bottom' title={user?.addresses.length === 0 ? 'You must have at least one wallet address to disconnect from discord' : ''}>
          {/** div is used to make sure the tooltip is rendered as disabled button doesn't allow tooltip */}
          <div>
            <StyledButton
              size='small'
              variant='outlined'
              color={connectedWithDiscord ? 'error' : 'primary'}
              disabled={isLoginOut || isDisconnecting || isConnectDiscordLoading || user?.addresses.length === 0}
              onClick={connectWithDiscord}
              endIcon={(
                isConnectDiscordLoading && <CircularProgress size={20} />
              )}
            >
              {connectedWithDiscord ? 'Disconnect' : 'Connect'}
            </StyledButton>
          </div>
        </Tooltip>
      </Stack>
      <StyledButton
        size='medium'
        variant='outlined'
        color='primary'
        disabled={isLoginOut}
        onClick={async () => {
          setIsLoginOut(true);
          await charmClient.logout();
          setUser(null);
          setIsLoginOut(true);
          router.push('/');
        }}
        endIcon={(
          isLoginOut && <CircularProgress size={20} />
        )}
      >
        Logout
      </StyledButton>
    </Modal>
  );
}

export default AccountModal;


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
import log from 'lib/log';

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

  const connectedWithDiscord = Boolean(user?.discordUser);

  const handleWalletProviderSwitch = () => {
    openWalletSelectorModal();
    onClose();
  };

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

  async function connectDiscord () {
    window.location.replace(`/api/discord/login?redirect=${encodeURIComponent(window.location.href.split('?')[0])}&type=connect`);
  }

  async function disconnectDiscord () {
    setIsDisconnecting(true);
    try {
      await charmClient.disconnectDiscord();
      setUser({ ...user, discordUser: null });
    }
    catch (err) {
      log.error('Error disconnecting from discord', err);
    }
    setIsDisconnecting(false);
  }

  return (
    <Modal open={isOpen} onClose={onClose}>
      <DialogTitle onClose={onClose}>Account</DialogTitle>
      <Stack mb={9} direction='row' spacing='4' alignItems='center'>
        <Avatar name={ENSName || user?.username || account} avatar={user?.avatar} />
        <CopyableAddress address={account!} decimals={5} sx={{ fontSize: 24 }} />
        {connectedWithDiscord && <DiscordUserName variant='subtitle2'>{user?.username}</DiscordUserName>}
      </Stack>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        my={1}
      >
        <Typography color='secondary'>
          {`Connected with ${connectorName(connector)}`}
        </Typography>
        <StyledButton size='small' variant='outlined' onClick={handleWalletProviderSwitch}>
          Switch
        </StyledButton>
      </Stack>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        my={1}
      >
        <Typography color='secondary'>
          {connectedWithDiscord ? 'Connected with Discord' : 'Connect with Discord'}
        </Typography>
        <StyledButton
          size='small'
          variant={connectedWithDiscord ? 'contained' : 'outlined'}
          color={connectedWithDiscord ? 'error' : 'primary'}
          disabled={isDisconnecting || isConnectDiscordLoading}
          onClick={connectedWithDiscord ? disconnectDiscord : connectDiscord}
          loading={isConnectDiscordLoading}
        >
          {connectedWithDiscord ? 'Disconnect' : 'Connect'}
        </StyledButton>
      </Stack>
    </Modal>
  );
}

export default AccountModal;

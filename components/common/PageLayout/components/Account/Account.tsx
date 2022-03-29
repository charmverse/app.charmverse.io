
import ButtonGroup from '@mui/material/ButtonGroup';
import { alpha } from '@mui/system';
import Tooltip from '@mui/material/Tooltip';
import Button from 'components/common/Button';
import SvgIcon from '@mui/material/SvgIcon';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import { usePopupState } from 'material-ui-popup-state/hooks';
import Avatar from 'components/common/Avatar';
import { useUser } from 'hooks/useUser';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { Chains, RPC } from 'connectors';
import { useContext, useEffect, useState } from 'react';
import { shortenHex } from 'lib/utilities/strings';
import useENSName from 'hooks/useENSName';
import AccountModal from 'components/common/PageLayout/components/Account/components/AccountModal';
import NetworkModal from 'components/common/PageLayout/components/Account/components/NetworkModal';
import styled from '@emotion/styled';
import { useSnackbar } from 'hooks/useSnackbar';
import { useRouter } from 'next/router';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import charmClient from 'charmClient';

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
  const [space] = useCurrentSpace();

  const router = useRouter();
  const { showMessage } = useSnackbar();
  const isConnectingToDiscord = space && typeof router.query.code === 'string' && router.query.discord === '1' && router.query.type === 'connect';
  const discordConnectFailed = space && router.query.discord === '2' && router.query.type === 'connect';
  const [isConnectDiscordLoading, setIsConnectDiscordLoading] = useState(false);
  const accountModalState = usePopupState({ variant: 'popover', popupId: 'account-modal' });
  const networkModalState = usePopupState({ variant: 'popover', popupId: 'network-modal' });
  const [user, setUser] = useUser();

  useEffect(() => {
    if (discordConnectFailed === true) {
      showMessage('Failed to connect to discord');
    }
  }, [discordConnectFailed]);

  function postConnect () {
    setIsConnectDiscordLoading(false);
    // Clean up the routes
    setTimeout(() => {
      router.replace(window.location.href.split('?')[0], undefined, { shallow: true });
    }, 2500);
  }
  // We might get redirected after connection with discord, so check the query param if it has a discord field
  // It can either be fail or success
  useEffect(() => {
    // Connection with discord
    if (isConnectingToDiscord && user) {
      setIsConnectDiscordLoading(true);
      charmClient.connectDiscord({
        code: router.query.code as string,
        spaceId: space.id
      }).then(({ discordUser, username, avatar }) => {
        setUser({ ...user, username: username ?? user.username, avatar: avatar ?? user.avatar, discordUser });
        postConnect();
      }).catch((err) => {
        showMessage(err.error, 'error');
        postConnect();
      });
    }
  }, []);

  useEffect(() => {
    if (isConnectDiscordLoading) {
      accountModalState.open();
    }
  }, [isConnectDiscordLoading]);

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
  if (!account || !chainId) {
    return (
      <AccountCard>
        <AccountButton
          // leftIcon={<SignIn />}
          isLoading={!triedEager}
          onClick={openWalletSelectorModal}
        >
          Connect to a wallet
        </AccountButton>
      </AccountCard>
    );
  }
  return (
    <AccountCard>
      <StyledButtonGroup variant='contained' disableElevation>
        <Tooltip title={RPC[Chains[chainId]].chainName} arrow>
          <NetworkButton onClick={networkModalState.open}>
            <SvgIcon component='object' sx={{ display: 'flex', justifyContent: 'center' }}>
              <img alt='' src={RPC[Chains[chainId]].iconUrls[0]} style={{ height: '100%' }} />
            </SvgIcon>
          </NetworkButton>
        </Tooltip>
        <AccountButton
          onClick={accountModalState.open}
          endIcon={<Avatar avatar={user?.avatar} name={ENSName || account} size='small' />}
        >
          {ENSName || user?.username || `${shortenHex(account, 3)}`}
        </AccountButton>
      </StyledButtonGroup>
      <AccountModal
        isConnectDiscordLoading={isConnectDiscordLoading}
        isOpen={accountModalState.isOpen}
        onClose={accountModalState.close}
      />
      <NetworkModal isOpen={networkModalState.isOpen} onClose={networkModalState.close} />
    </AccountCard>
  );
}

export default Account;

import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import TelegramIcon from '@mui/icons-material/Telegram';
import { Box, SvgIcon, Tooltip, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import type { IdentityType } from '@prisma/client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState } from 'react';

import Button from 'components/common/Button';
import Image from 'components/common/Image';
import { DialogTitle, Modal } from 'components/common/Modal';
import randomName from 'lib/utilities/randomName';
import DiscordIcon from 'public/images/discord_logo.svg';
import MetamaskIcon from 'public/images/metamask.svg';

import Integration from './Integration';

export type IntegrationModel = {
  username: string;
  type: IdentityType;
  isInUse: boolean;
  icon: ReactNode;
};

export const getIdentityIcon = (identityType: IdentityType | null) => {
  switch (identityType) {
    case 'Wallet':
      return (
        <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#000000', minHeight: '40px', minWidth: '40px' }}>
          <MetamaskIcon />
        </SvgIcon>
      );

    case 'Discord':
      return (
        <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#5865F2', minHeight: '40px', minWidth: '40px' }}>
          <DiscordIcon />
        </SvgIcon>
      );

    case 'Telegram':
      return (
        <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#229ED9', minHeight: '40px', minWidth: '40px' }}>
          <TelegramIcon />
        </SvgIcon>
      );

    case 'UnstoppableDomain':
      return <img src='/images/walletLogos/unstoppable-domains.png' height={40} width={40} />;

    case 'RandomName':
    default:
      return (
        <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#777', minHeight: '40px', minWidth: '40px' }}>
          <PersonIcon />
        </SvgIcon>
      );
  }
};

type IdentityModalProps = {
  save: (id: string, identityType: IdentityType) => void;
  close: () => void;
  isOpen: boolean;
  identityTypes: IntegrationModel[];
  identityType: IdentityType;
  username: string;
};

function IdentityModal(props: IdentityModalProps) {
  const { close, isOpen, save, identityTypes, identityType, username } = props;
  const [generatedName, setGeneratedName] = useState(identityType === 'RandomName' ? username : randomName());

  return (
    <Modal open={isOpen} onClose={close} size='large'>
      <DialogTitle onClose={close}>Select a public identity</DialogTitle>
      <Typography>Select which integration you want to show as your username</Typography>
      <Box mb={2}>
        {identityTypes.map((item: IntegrationModel) => (
          <Integration
            isInUse={item.type === 'RandomName' && generatedName !== item.username ? false : item.isInUse}
            icon={item.icon}
            identityType={item.type}
            name={item.type === 'RandomName' ? 'Anonymous' : item.type}
            username={item.type === 'RandomName' ? generatedName : item.username}
            useIntegration={save}
            action={
              item.type === 'RandomName' ? (
                <Tooltip arrow placement='top' title='Generate a new name'>
                  <IconButton onClick={() => setGeneratedName(randomName())}>
                    <RefreshIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              ) : null
            }
            key={item.type}
          />
        ))}
      </Box>
      <Link href='/integrations'>
        <Button variant='text' color='secondary' endIcon={<NavigateNextIcon />}>
          Manage identities
        </Button>
      </Link>
    </Modal>
  );
}

export default IdentityModal;

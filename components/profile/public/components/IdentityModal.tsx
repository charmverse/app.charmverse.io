import { useState, ReactNode } from 'react';
import styled from '@emotion/styled';
import { uniqueNamesGenerator, Config, adjectives, colors, animals } from 'unique-names-generator';
import Link from 'next/link';
import { Box, Stack, SvgIcon, Typography } from '@mui/material';
import Button from 'components/common/Button';
import { Modal, DialogTitle } from 'components/common/Modal';
import DiscordIcon from 'public/images/discord_logo.svg';
import MetamaskIcon from 'public/images/metamask.svg';
import TelegramIcon from '@mui/icons-material/Telegram';
import PersonIcon from '@mui/icons-material/Person';
import { IdentityType, IDENTITY_TYPES } from 'models';
import Integration from './Integration';
import { CRYPTO_WORD_LIST } from '../interfaces';

const StyledButton = styled(Button)`
  background-color: ${({ theme }) => theme.palette.background.light};
  color: #37352f;

  &:hover {
    background-color: ${({ theme }) => theme.palette.background.light};
  }
`;

export type IntegrationModel = {
  username: string,
  type: IdentityType,
  isInUse: boolean,
  icon: ReactNode;
};

export const getIdentityIcon = (identityType: IdentityType | null) => {
  switch (identityType) {
    case IDENTITY_TYPES[1]:
      return (
        <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#5865F2', minHeight: '40px', minWidth: '40px' }}>
          <DiscordIcon />
        </SvgIcon>
      );
    case IDENTITY_TYPES[2]:
      return (
        <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#229ED9', minHeight: '40px', minWidth: '40px' }}>
          <TelegramIcon />
        </SvgIcon>
      );
    case IDENTITY_TYPES[3]:
      return (
        <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#777', minHeight: '40px', minWidth: '40px' }}>
          <PersonIcon />
        </SvgIcon>
      );
      break;
    default:
      return (
        <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#000000', minHeight: '40px', minWidth: '40px' }}>
          <MetamaskIcon />
        </SvgIcon>
      );
  }
};

type IdentityModalProps = {
    save: (id: string, identityType: IdentityType) => void,
    close: () => void,
    isOpen: boolean,
    identityTypes: Array<IntegrationModel>,
    identityType: IdentityType,
    username: string,
};

function IdentityModal (props: IdentityModalProps) {
  const { close, isOpen, save, identityTypes, identityType, username } = props;
  const nameGeneratorConfig: Config = {
    dictionaries: [
      adjectives,
      [...colors, ...CRYPTO_WORD_LIST],
      animals
    ],
    separator: '-',
    length: 3
  };
  const [generatedName, setGeneratedName] = useState(
    identityType === IDENTITY_TYPES[3] ? username : uniqueNamesGenerator(nameGeneratorConfig)
  );

  return (
    <Modal open={isOpen} onClose={close} size='large'>
      <DialogTitle onClose={close}>Public Identity</DialogTitle>
      <Typography>Select which integration you want to show as your public identity</Typography>
      <Stack mt={2}>
        {
          identityTypes.map((item: IntegrationModel) => (
            <Integration
              isInUse={item.isInUse}
              icon={item.icon}
              identityType={item.type}
              name={item.type}
              id={item.type === IDENTITY_TYPES[3] ? generatedName : item.username}
              useIntegration={save}
              actions={
                item.type === IDENTITY_TYPES[3] ? [{
                  name: 'Generate',
                  action: () => setGeneratedName(uniqueNamesGenerator(nameGeneratorConfig))
                }] : []
              }
              key={item.type}
            />
          ))
        }
        <Box justifyContent='end' mt={3} sx={{ display: 'flex' }}>
          <Link href='/profile/tasks'>
            <StyledButton>
              Manage Integrations
            </StyledButton>
          </Link>
        </Box>
      </Stack>
    </Modal>
  );
}

export default IdentityModal;

import styled from '@emotion/styled';
import type { ReactNode } from 'react';

import { Button } from 'components/common/Button';
import { greyColor2 } from 'theme/colors';

const ImageIcon = styled.img`
  width: 1.5rem;
  height: 1.5rem;
`;

const ButtonContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  color: ${({ theme }) => theme.palette.text.primary};
`;

type Props = {
  name: string;
  onClick?: () => void;
  iconUrl?: string;
  icon?: ReactNode;
  disabled: boolean;
  isActive: boolean;
  isLoading: boolean;
};

export function ConnectorButton({ name, onClick, iconUrl, icon, disabled, isActive, isLoading, ...props }: Props) {
  return (
    <Button
      color='secondary'
      variant='outlined'
      onClick={onClick}
      disabled={disabled}
      loading={isLoading}
      loadingMessage={`${name} - connecting...`}
      fullWidth
      size='large'
      sx={{
        color: disabled ? `${greyColor2} !important` : 'inherit',
        px: 4,
        py: 1.5
      }}
      {...props}
    >
      <ButtonContent>
        {`${name} ${isActive ? ' - connected' : ''}`}
        {iconUrl && <ImageIcon style={{ marginLeft: 3 }} src={`/images/walletLogos/${iconUrl}`} />}
        {/** Allow switching between icon */}
        {!iconUrl && icon}
      </ButtonContent>
    </Button>
  );
}

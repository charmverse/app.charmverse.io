import styled from '@emotion/styled';
import Image from 'next/image';
import Button from 'components/common/Button';

const ImageIcon = styled.img`
  width: 1.5rem;
  height: 1.5rem;
`;

const ButtonContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

type Props = {
  name: string
  onClick: () => void
  iconUrl: string
  disabled: boolean
  isActive: boolean
  isLoading: boolean
}

function ConnectorButton ({
  name,
  onClick,
  iconUrl,
  disabled,
  isActive,
  isLoading
}: Props) {
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
      sx={{ px: 4, py: 1.5 }}
    >
      <ButtonContent>
        {`${name} ${isActive ? ' - connected' : ''}`}
        <ImageIcon src={`/walletLogos/${iconUrl}`} />
      </ButtonContent>
    </Button>
  );
}

export default ConnectorButton;

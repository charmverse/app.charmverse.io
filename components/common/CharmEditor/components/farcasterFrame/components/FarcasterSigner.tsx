import styled from '@emotion/styled';
import { Stack, SvgIcon, Typography } from '@mui/material';

import { Button } from 'components/common/Button';
import { useFarcasterUser } from 'hooks/useFarcasterUser';
import FarcasterIcon from 'public/images/logos/farcaster.svg';

const StyledButton = styled(Button)`
  background-color: ${({ theme }) => theme.palette.farcaster.main};
  &:hover {
    background-color: ${({ theme }) => theme.palette.farcaster.dark};
  }
  padding: ${({ theme }) => (theme.breakpoints.down('sm') ? theme.spacing(1) : theme.spacing(1.5))};
  width: fit-content;
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  justify-content: center;
  white-space: normal;
`;

export function FarcasterSigner() {
  const { createAndStoreSigner, signerApprovalModalPopupState, isCreatingSigner } = useFarcasterUser();

  const isButtonDisabled = isCreatingSigner || signerApprovalModalPopupState.isOpen;

  return (
    <Stack gap={1} alignItems='center'>
      <StyledButton
        onClick={() => {
          if (!isButtonDisabled) {
            createAndStoreSigner();
          }
        }}
        loading={isButtonDisabled}
      >
        <SvgIcon viewBox='0 0 20 20' fontSize='small'>
          <FarcasterIcon />
        </SvgIcon>
        <Typography fontWeight={600} variant='body2'>
          {signerApprovalModalPopupState.isOpen
            ? 'Waiting for approval...'
            : isCreatingSigner
              ? 'Loading...'
              : 'Sign in with Farcaster'}
        </Typography>
      </StyledButton>
    </Stack>
  );
}

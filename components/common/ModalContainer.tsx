import { ReactNode } from 'react';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const StyledModal = styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  background-color: ${({ theme }) => theme.palette.background.paper};
  border: 2px solid ${({ theme }) => theme.palette.divider};
  border-radius: 20px;
  box-shadow: ${({ theme }) => theme.shadows[15]};
  padding: ${({ theme }) => theme.spacing(4)};
`;

const StyledCloseButton = styled(IconButton)`
  position: absolute;
  top: 10px;
  right: 10px;
`;

export default function ModalContainer ({ children, onClose }:
  { children: ReactNode, onClose: () => void }) {
  return (
    <StyledModal>
      <StyledCloseButton onClick={onClose}>
        <CloseIcon color='secondary' />
      </StyledCloseButton>
      {children}
    </StyledModal>
  );
}

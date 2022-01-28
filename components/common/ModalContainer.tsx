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

export default function ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) {
  return (
    <StyledModal>
      <IconButton sx={{ position: 'absolute', top: 10, right: 10 }} onClick={onClose}>
        <CloseIcon color='secondary' />
      </IconButton>
      {children}
    </StyledModal>
  );
}

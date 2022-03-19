import { ComponentProps, ReactNode } from 'react';
import styled from '@emotion/styled';
import MuiModal from '@mui/material/Modal';
import MuiDialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

type ModalSize = 'large' | 'fluid' | 'small' | string;

const defaultSize = '400px';

const ModalContainer = styled.div<{ size: ModalSize }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: ${({ size }) => size === 'large' ? '670px' : size === 'fluid' ? 'auto' : size};
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-radius: ${({ theme }) => theme.spacing(1)};
  box-shadow: ${({ theme }) => theme.shadows[15]};
  padding: ${({ theme }) => theme.spacing(4)};
`;

const StyledDialogTitle = styled(MuiDialogTitle)`
  font-weight: 700;
  padding-left: 0;
  padding-right: 0;
  padding-top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseButton = styled(IconButton)`
  padding: 0;
`;

export type ModalProps = Omit<ComponentProps<typeof MuiModal>, 'children' | 'onClose'> & {
  size?: ModalSize,
  children: any,
  title?: string,
  onClose: () => void
};

export function Modal ({ children, size = defaultSize, title, ...props }: ModalProps) {
  return (
    <MuiModal {...props}>
      <div>
        <ModalContainer size={size}>
          {title && <DialogTitle onClose={props.onClose}>{title}</DialogTitle>}
          {children}
        </ModalContainer>
      </div>
    </MuiModal>
  );
}

export function DialogTitle ({ children, onClose }: { children: ReactNode, onClose?: () => void }) {
  return (
    <StyledDialogTitle>
      {children}
      {onClose && (
        <CloseButton onClick={onClose}>
          <CloseIcon color='secondary' />
        </CloseButton>
      )}
    </StyledDialogTitle>
  );
}

// TODO: add special theme for alert dialogs
export const Alert = Modal;

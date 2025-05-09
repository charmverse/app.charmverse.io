import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import MuiDialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import MuiModal from '@mui/material/Modal';
import type { ComponentProps, ReactNode } from 'react';

import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import { useMdScreen } from 'hooks/useMediaScreens';

export type ModalSize = 'large' | 'fluid' | 'small' | string;

const defaultSize = '400px';

const ModalContainer = styled.div<{ padding?: string; size: ModalSize }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: ${({ size }) =>
    size === 'large' ? '670px' : size === 'fluid' ? 'auto' : size === 'small' ? defaultSize : size};
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-radius: ${({ theme }) => theme.spacing(1)};
  box-shadow: ${({ theme }) => theme.shadows[15]};
  padding: ${({ padding, theme }) => padding || theme.spacing(4)};
  max-height: calc(80vh);
  max-width: 100%;
  overflow-y: auto;

  &.top-position {
    top: 10%;
    transform: translate(-50%, 0);
  }
`;

const ScrollableModalContainer = styled(ModalContainer)`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing(4, 0)};
`;

const StyledDialogTitle = styled(MuiDialogTitle)`
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

const ScrollableContainer = styled.div`
  flex-grow: 1;
  overflow: auto;
`;

export enum ModalPosition {
  center,
  top
}

export type ModalProps = Omit<ComponentProps<typeof MuiModal>, 'children' | 'onClose' | 'title'> & {
  size?: ModalSize;
  children: any;
  title?: string | ReactNode;
  position?: ModalPosition;
  noPadding?: boolean;
  onClose?: () => void;
  mobileDialog?: boolean;
};

export function Modal({
  children,
  noPadding,
  position = ModalPosition.center,
  size = defaultSize,
  title,
  mobileDialog,
  ...props
}: ModalProps) {
  const isMdScreen = useMdScreen();
  const isMobileDialog = !isMdScreen && mobileDialog;

  if (isMobileDialog) {
    return (
      <MobileDialog title={title} {...props}>
        {children}
      </MobileDialog>
    );
  }

  return (
    <MuiModal {...props}>
      <div>
        <ModalContainer
          padding={noPadding ? '0px' : undefined}
          size={size}
          className={position === ModalPosition.center ? 'center-position' : 'top-position'}
        >
          {title && <DialogTitle onClose={props.onClose}>{title}</DialogTitle>}
          {children}
        </ModalContainer>
      </div>
    </MuiModal>
  );
}

export function ScrollableModal({ children, size = defaultSize, title, ...props }: ModalProps) {
  return (
    <MuiModal {...props}>
      <div>
        <ScrollableModalContainer size={size}>
          {title && (
            <Box px={4}>
              <DialogTitle>{title}</DialogTitle>
            </Box>
          )}
          <ScrollableContainer>{children}</ScrollableContainer>
        </ScrollableModalContainer>
      </div>
    </MuiModal>
  );
}

export function DialogTitle({ children, onClose, sx }: { children: ReactNode; onClose?: () => void; sx?: any }) {
  return (
    <StyledDialogTitle sx={sx}>
      {children}
      {onClose && (
        <CloseButton data-test='close-modal' onClick={onClose}>
          <CloseIcon color='secondary' />
        </CloseButton>
      )}
    </StyledDialogTitle>
  );
}

// TODO: add special theme for alert dialogs
export const Alert = Modal;

export default Modal;

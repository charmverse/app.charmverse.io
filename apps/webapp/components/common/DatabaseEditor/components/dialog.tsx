import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import { Box, DialogActions, Divider, Stack } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import clsx from 'clsx';
import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

type Props = {
  children: React.ReactNode;
  toolsMenu?: React.ReactNode; // some dialogs may not  require a toolmenu
  toolbar?: React.ReactNode;
  hideCloseButton?: boolean;
  className?: string;
  onClose?: () => void;
  fullWidth?: boolean;
  footerActions?: React.ReactNode;
  'data-test'?: string;
};

const Toolbar = styled(Box)`
  .MuiIconButton-root {
    width: 30px;
    height: 30px;
  }
`;

const Content = styled.div`
  overflow-x: hidden;
  flex-grow: 1;
  -webkit-overflow-scrolling: touch;
`;

const FooterActionsContainer = styled(Box)`
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  position: relative;
  padding: 0 40px 0 30px;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    width: 860px;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 0 80px;
  }
`;

function FBDialog(props: Props) {
  const { toolbar, toolsMenu, fullWidth = false, footerActions } = props;

  useHotkeys('esc', () => props.onClose?.());

  return (
    <Modal open={true}>
      <div data-test={props['data-test'] || 'dialog'} className={`Dialog dialog-back ${props.className}`}>
        <div
          className='wrapper'
          onClick={(e) => {
            if (props.onClose && e.target === e.currentTarget) {
              props.onClose();
            }
          }}
        >
          <div role='dialog' className={clsx('dialog', { fullWidth })}>
            <Toolbar display='flex' p={1}>
              {toolbar ? (
                <Box flexGrow={1}>{toolbar}</Box>
              ) : (
                <Box flexGrow={1}>
                  <div />
                </Box>
              )}
              {toolsMenu}
              {!props.hideCloseButton && (
                <IconButton data-test='close-modal' size='small' onClick={props.onClose}>
                  <CloseIcon color='secondary' />
                </IconButton>
              )}
            </Toolbar>
            <Content>{props.children}</Content>

            {!!footerActions && (
              <Stack>
                <Divider light />
                <FooterActionsContainer className='footer-actions'>
                  <DialogActions sx={{ px: 0 }}>{footerActions}</DialogActions>
                </FooterActionsContainer>
              </Stack>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default React.memo(FBDialog);

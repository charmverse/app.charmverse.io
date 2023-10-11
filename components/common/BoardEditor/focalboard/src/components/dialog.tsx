import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import { Box } from '@mui/material';
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
  onClose: () => void;
  fullWidth?: boolean;
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

function FBDialog(props: Props) {
  const { toolbar, toolsMenu, fullWidth = false } = props;

  useHotkeys('esc', () => props.onClose());

  return (
    <Modal open={true}>
      <div data-test='dialog' className={`Dialog dialog-back ${props.className}`}>
        <div
          className='wrapper'
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              props.onClose();
            }
          }}
        >
          <div role='dialog' className={clsx('dialog', { fullWidth })}>
            <Toolbar display='flex' p={1}>
              {toolbar && <Box flexGrow={1}>{toolbar}</Box>}
              {toolsMenu}
              {!props.hideCloseButton && (
                <IconButton data-test='close-modal' size='small' onClick={props.onClose}>
                  <CloseIcon color='secondary' />
                </IconButton>
              )}
            </Toolbar>
            <Content>{props.children}</Content>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default React.memo(FBDialog);

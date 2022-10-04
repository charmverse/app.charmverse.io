
import CloseIcon from '@mui/icons-material/Close';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MuiIconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useIntl } from 'react-intl';

import PopperPopup from 'components/common/PopperPopup';

import IconButton from '../widgets/buttons/iconButton';

type Props = {
  children: React.ReactNode;
  toolsMenu?: React.ReactNode; // some dialogs may not  require a toolmenu
  toolbar?: React.ReactNode;
  hideCloseButton?: boolean;
  className?: string;
  onClose: () => void;
}

const Dialog = React.memo((props: Props) => {
  const { toolsMenu } = props;
  const { toolbar } = props;
  const intl = useIntl();

  const closeDialogText = intl.formatMessage({
    id: 'Dialog.closeDialog',
    defaultMessage: 'Close dialog'
  });

  useHotkeys('esc', () => props.onClose());

  return (
    <Modal open={true}>
      <div className={`Dialog dialog-back ${props.className}`}>
        <div
          className='wrapper'
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              props.onClose();
            }
          }}
        >
          <div
            role='dialog'
            className='dialog'
          >
            <div className='toolbar'>
              {
                !props.hideCloseButton
                && (
                  <IconButton
                    onClick={props.onClose}
                    icon={<CloseIcon />}
                    title={closeDialogText}
                    className='IconButton--large'
                  />
                )
              }
              {toolbar && <div className='cardToolbar'>{toolbar}</div>}
              {toolsMenu && (
                <PopperPopup closeOnClick popupContent={toolsMenu}>
                  <MuiIconButton size='small'>
                    <MoreHorizIcon fontSize='small' />
                  </MuiIconButton>
                </PopperPopup>
              )}
            </div>
            {props.children}
          </div>
        </div>
      </div>
    </Modal>
  );
});

export default Dialog;

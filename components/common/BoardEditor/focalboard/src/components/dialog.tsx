import CloseIcon from '@mui/icons-material/Close';
import Modal from '@mui/material/Modal';
import clsx from 'clsx';
import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useIntl } from 'react-intl';

import IconButton from '../widgets/buttons/iconButton';

type Props = {
  children: React.ReactNode;
  toolsMenu?: React.ReactNode; // some dialogs may not  require a toolmenu
  toolbar?: React.ReactNode;
  hideCloseButton?: boolean;
  className?: string;
  onClose: () => void;
  fullWidth?: boolean;
};

function FBDialog(props: Props) {
  const { toolbar, toolsMenu, fullWidth = false } = props;
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
          <div role='dialog' className={clsx('dialog', { fullWidth })}>
            <div className='toolbar'>
              {toolbar && <div className='cardToolbar'>{toolbar}</div>}
              {toolsMenu}
              {!props.hideCloseButton && (
                <IconButton
                  onClick={props.onClose}
                  icon={<CloseIcon />}
                  style={{
                    paddingLeft: '20px'
                  }}
                  title={closeDialogText}
                  className='IconButton'
                />
              )}
            </div>
            {props.children}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default React.memo(FBDialog);

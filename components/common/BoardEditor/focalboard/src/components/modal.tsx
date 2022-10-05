import CloseIcon from '@mui/icons-material/Close';
import { ClickAwayListener } from '@mui/material';
import React, { useRef, useEffect } from 'react';

import IconButton from '../widgets/buttons/iconButton';

type Props = {
    onClose: () => void;
    position?: 'top'|'bottom'|'bottom-right';
    children: React.ReactNode;
}

const Modal = React.memo((props: Props): JSX.Element => {
  const node = useRef<HTMLDivElement>(null);

  const { position, onClose, children } = props;

  return (
    <ClickAwayListener onClickAway={onClose}>
      <div
        className={`Modal ${position || 'bottom'}`}
        ref={node}
      >
        <div className='toolbar hideOnWidescreen'>
          <IconButton
            onClick={() => onClose()}
            icon={<CloseIcon fontSize='small' />}
            title='Close'
          />
        </div>
        {children}
      </div>
    </ClickAwayListener>
  );
});

export default Modal;

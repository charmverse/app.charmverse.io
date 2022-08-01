// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { ClickAwayListener } from '@mui/material';
import React, { useRef, useEffect } from 'react';

import IconButton from '../widgets/buttons/iconButton';
import CloseIcon from '../widgets/icons/close';

type Props = {
    onClose: () => void
    position?: 'top'|'bottom'|'bottom-right'
    children: React.ReactNode
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
            icon={<CloseIcon />}
            title='Close'
          />
        </div>
        {children}
      </div>
    </ClickAwayListener>
  );
});

export default Modal;

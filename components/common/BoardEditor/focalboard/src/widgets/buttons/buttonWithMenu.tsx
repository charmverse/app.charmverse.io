// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';

import DropdownIcon from '../icons/dropdown';
import MenuWrapper from '../menuWrapper';
import Button from 'components/common/Button';

type Props = {
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
    children?: React.ReactNode
    title?: string
    text: React.ReactNode
}

function ButtonWithMenu (props: Props): JSX.Element {
  return (
    <Button
      disableElevation
      size='small'
      onClick={props.onClick}
    >
      {props.text}
      {/* <MenuWrapper stopPropagationOnToggle={true}>
                <div className='button-dropdown'>
                    <DropdownIcon/>
                </div>
                {props.children}
            </MenuWrapper> */}
    </Button>
  );
}

export default React.memo(ButtonWithMenu);

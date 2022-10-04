import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import Box from '@mui/material/Box';
import React from 'react';

import Button from 'components/common/Button';

import MenuWrapper from '../menuWrapper';

type Props = {
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    children?: React.ReactNode;
    text: React.ReactNode;
}

function ButtonWithMenu (props: Props): JSX.Element {
  return (
    <Button
      disableElevation
      size='small'
      onClick={props.onClick}
    >
      {props.text}
      <MenuWrapper stopPropagationOnToggle={true}>
        <Box
          sx={{ pl: 1 }}
          className='button-dropdown'
        >
          <ArrowDropDownOutlinedIcon fontSize='small' />
        </Box>
        {props.children}
      </MenuWrapper>
    </Button>
  );
}

export default React.memo(ButtonWithMenu);

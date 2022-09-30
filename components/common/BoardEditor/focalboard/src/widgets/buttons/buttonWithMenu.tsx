import React from 'react';
import Box from '@mui/material/Box';
import MenuWrapper from '../menuWrapper';
import Button from 'components/common/Button';
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';

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
      <MenuWrapper stopPropagationOnToggle={true}>
        <Box
          sx={{pl: 1}}
          className='button-dropdown'
        >
          <ArrowDropDownOutlinedIcon fontSize='small'  />
        </Box>
        {props.children}
      </MenuWrapper>
    </Button>
  );
}

export default React.memo(ButtonWithMenu);

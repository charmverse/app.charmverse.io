import MuiDeleteIcon from '@mui/icons-material/DeleteOutline';
import Box from '@mui/material/Box';
import type { SvgIconTypeMap } from '@mui/material/SvgIcon';

import { IconWrapper } from './IconWrapper';

interface Props {
  iconSize?: SvgIconTypeMap['props']['fontSize'];
  fontSize?: string;
  label?: string;
}

export function DeleteIcon({ iconSize, label, fontSize }: Props) {
  return (
    <IconWrapper>
      <MuiDeleteIcon fontSize={iconSize} />
      <Box component='span' fontSize={fontSize}>
        {label}
      </Box>
    </IconWrapper>
  );
}

import MuiAddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import type { SvgIconTypeMap } from '@mui/material/SvgIcon';

import { IconWrapper } from './IconWrapper';

interface Props {
  iconSize?: SvgIconTypeMap['props']['fontSize'];
  fontSize?: string;
  label?: string;
}

export function AddIcon({ iconSize, label, fontSize }: Props) {
  return (
    <IconWrapper>
      <MuiAddIcon fontSize={iconSize} />
      <Box component='span' fontSize={fontSize}>
        {label}
      </Box>
    </IconWrapper>
  );
}

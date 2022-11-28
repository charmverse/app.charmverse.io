import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import Box from '@mui/material/Box';
import type { SvgIconTypeMap } from '@mui/material/SvgIcon';

import { IconWrapper } from './IconWrapper';

interface Props {
  iconSize?: SvgIconTypeMap['props']['fontSize'];
  fontSize?: string;
  label?: string;
}

export function EditIcon({ iconSize, label, fontSize }: Props) {
  return (
    <IconWrapper>
      <ModeEditOutlineOutlinedIcon fontSize={iconSize} />
      <Box component='span' fontSize={fontSize}>
        {label}
      </Box>
    </IconWrapper>
  );
}

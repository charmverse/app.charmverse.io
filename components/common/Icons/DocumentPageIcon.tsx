import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import Box from '@mui/material/Box';
import type { SvgIconTypeMap } from '@mui/material/SvgIcon';

import { IconWrapper } from './IconWrapper';

interface Props {
  iconSize?: SvgIconTypeMap['props']['fontSize'];
  fontSize?: string;
  label?: string;
  onClick?: () => void;
}

export function DocumentPageIcon({ iconSize, label, fontSize, onClick }: Props) {
  return (
    <IconWrapper onClick={onClick}>
      <DescriptionOutlinedIcon fontSize={iconSize} />
      <Box component='span' fontSize={fontSize}>
        {label}
      </Box>
    </IconWrapper>
  );
}

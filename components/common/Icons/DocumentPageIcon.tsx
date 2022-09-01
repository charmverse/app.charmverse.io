import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { SvgIconTypeMap } from '@mui/material/SvgIcon';
import Box from '@mui/material/Box';
import { IconWrapper } from './IconWrapper';

interface Props {
  iconSize?: SvgIconTypeMap['props']['fontSize'];
  fontSize?: string;
  label?: string;
}

export function DocumentPageIcon ({ iconSize, label, fontSize }: Props) {
  return (
    <IconWrapper>
      <DescriptionOutlinedIcon fontSize={iconSize} />
      <Box component='span' fontSize={fontSize}>
        {label}
      </Box>
    </IconWrapper>
  );
}

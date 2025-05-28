import { styled } from '@mui/material';
import Chip from '@mui/material/Chip';

// Use this element to surround just an icon with the Chip component

const ButtonChip = styled(Chip)`
  box-sizing: content-box;
  .MuiSvgIcon-root {
    margin: 0;
    width: 24px;
  }
  .MuiChip-label {
    display: none;
  }
`;

export default ButtonChip;

import { styled } from '@mui/material';
import MuiTypography from '@mui/material/Typography';

export const Typography = styled(MuiTypography)<{ overflowEllipsis?: boolean }>`
  ${(props) =>
    props.overflowEllipsis &&
    `
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `}
`;

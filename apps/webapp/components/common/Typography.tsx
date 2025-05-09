import styled from '@emotion/styled';
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

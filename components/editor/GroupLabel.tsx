import styled from "@emotion/styled";
import { SxProps, Typography } from "@mui/material";

const StyledGroupLabel = styled(Typography)`
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.secondary.main}
`;

export default function GroupLabel({ label, sx }: { label: string, sx?: SxProps }) {
  return <StyledGroupLabel sx={sx}>
    {label}
  </StyledGroupLabel>
}
import { styled } from '@mui/material';

const StyledBlockQuote = styled('div')`
  border-left: 4px solid ${({ theme }) => theme.palette.text.primary};
  padding-left: ${({ theme }) => theme.spacing(2)};
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export default StyledBlockQuote;

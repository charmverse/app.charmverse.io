import { styled } from '@mui/material';
import FormControl from '@mui/material/FormControl';

export const VotesWrapper = styled('div')<{ detailed?: boolean }>`
  position: relative;
  border: 1px solid var(--input-border);
  padding: ${({ theme }) => theme.spacing(2)};
`;

export const StyledFormControl = styled(FormControl)`
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

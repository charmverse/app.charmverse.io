import styled from '@emotion/styled';
import FormControl from '@mui/material/FormControl';

export const VotesWrapper = styled.div<{ detailed?: boolean }>`
  background-color: ${({ theme, detailed }) => detailed && theme.palette.mode !== 'light' ? theme.palette.background.default : theme.palette.background.light};
  padding: ${({ theme }) => theme.spacing(2)};
  `;

export const StyledFormControl = styled(FormControl)`
border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
border-top: 1px solid ${({ theme }) => theme.palette.divider};
width: 100%;
margin-bottom: ${({ theme }) => theme.spacing(2)};
margin-top: ${({ theme }) => theme.spacing(2)};
`;

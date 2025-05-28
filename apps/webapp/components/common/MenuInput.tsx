import { styled } from '@mui/material';

export const MenuInput = styled.input`
  background: ${({ theme }) => theme.palette.background.default};
  outline: none;
  border: none;
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(1)};
  color: inherit;
  font-size: 16px;
`;

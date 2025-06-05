import { styled } from '@mui/material';

export type PageWrapperOptions = { bgcolor?: 'default' | 'light' };

const PageWrapper = styled('div')<PageWrapperOptions>`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background-color: ${({ bgcolor, theme }) =>
    bgcolor ? theme.palette.background[bgcolor] : theme.palette.background.light};
`;

export default PageWrapper;

import { ReactNode } from 'react';
import styled from '@emotion/styled';
import ScrollableWindow from './ScrollableWindow';

const StyledBox = styled.div(({ theme }) => `
  width: 1200px;
  max-width: 100%;
  margin: ${theme.spacing(10, 'auto')};
  min-height: 80vh;
  padding: ${theme.spacing(3, '24px')};
  ${theme.breakpoints.up('sm')} {
    padding: ${theme.spacing(3, '80px')};
  }
`);

const FixedWidthStyledBox = styled(StyledBox)`
  width: 1200px;
  max-width: 100%;
`;

export function CenteredPageContent (props: { children: ReactNode }) {
  return (
    <ScrollableWindow>
      <FixedWidthStyledBox>
        {props.children}
      </FixedWidthStyledBox>
    </ScrollableWindow>
  );
}

export function FullWidthPageContent (props: { children: ReactNode }) {

  return (
    <ScrollableWindow>
      <StyledBox>
        {props.children}
      </StyledBox>
    </ScrollableWindow>
  );
}

import styled from '@emotion/styled';
import { SxProps } from '@mui/system';
import type { CSSProperties, ReactNode } from 'react';

import ScrollableWindow from './ScrollableWindow';

const StyledBox = styled.div(({ theme }) => `
  max-width: 100%;
  margin: ${theme.spacing(10, 'auto')};
  min-height: 80vh;
  padding: ${theme.spacing(0, '24px')};
  ${theme.breakpoints.up('sm')} {
    padding: ${theme.spacing(0, '80px')};
  }
`);

const FixedWidthStyledBox = styled(StyledBox)`
  width: 1200px;
  max-width: 100%;
`;

export function CenteredPageContent (props: { children: ReactNode, style?: CSSProperties }) {
  return (
    <ScrollableWindow>
      <FixedWidthStyledBox style={props.style}>
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

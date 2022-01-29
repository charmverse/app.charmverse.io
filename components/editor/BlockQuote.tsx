import styled from "@emotion/styled";
import { ReactNode } from "react";

const StyledBlockQuote = styled.div`
  background-color: ${({ theme }) => theme.palette.background.light};
  font-size: 20px;
  padding: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.spacing(0.5)}
`;

export function BlockQuote({ children }: { children: ReactNode }) {
  return <StyledBlockQuote>
    {children}
  </StyledBlockQuote>
}
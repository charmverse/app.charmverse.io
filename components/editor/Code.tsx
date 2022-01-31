import styled from "@emotion/styled";
import { ReactNode } from "react";

const StyledCode = styled.div`
  background-color: ${({ theme }) => theme.palette.background.light};
  padding: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  font-family: Consolas;
`;

export function Code({ children }: { children: ReactNode }) {
  return <StyledCode>
    {children}
  </StyledCode>
}
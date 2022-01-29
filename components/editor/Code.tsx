import styled from "@emotion/styled";
import { ReactNode } from "react";
import { sidebarBackgroundColor, sidebarBackgroundColorDarkMode } from "theme/colors";

const StyledCode = styled.div`
  background-color: ${({ theme }) => theme.palette.mode === "dark" ? sidebarBackgroundColorDarkMode : sidebarBackgroundColor};
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
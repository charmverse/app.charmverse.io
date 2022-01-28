import styled from "@emotion/styled";
import { ReactNode } from "react";
import { sidebarBackgroundColor, sidebarBackgroundColorDarkMode } from "theme/colors";

const StyledBlockQuote = styled.div`
  background-color: ${({ theme }) => theme.palette.mode === "dark" ? sidebarBackgroundColorDarkMode : sidebarBackgroundColor};
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
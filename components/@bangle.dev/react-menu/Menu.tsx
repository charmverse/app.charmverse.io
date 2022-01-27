import styled from "@emotion/styled";
import React from 'react';
import { sidebarBackgroundColor, sidebarBackgroundColorDarkMode } from "theme/colors";

const StyledMenu = styled.div`
  background-color: ${({ theme }) => theme.palette.mode === "dark" ? sidebarBackgroundColorDarkMode : sidebarBackgroundColor};
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  display: flex;
  padding: ${({ theme }) => theme.spacing(0.75, 0.5)};
`

export function Menu({
  className = '',
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <StyledMenu className={className}>
      {children}
    </StyledMenu>
  );
}

import styled from '@emotion/styled';
import React from 'react';

const StyledMenuGroup = styled.div<{ keepBorder: boolean }>`
  display: flex;
  ${(props) =>
    props.keepBorder &&
    `
    border-right: 1.5px solid ${props.theme.palette.divider};
  `}
`;

export function MenuGroup({
  className = '',
  children,
  isLastGroup = false
}: {
  className?: string;
  children: React.ReactNode;
  isLastGroup?: boolean;
}) {
  return (
    <StyledMenuGroup keepBorder={!isLastGroup} className={className}>
      {children}
    </StyledMenuGroup>
  );
}
